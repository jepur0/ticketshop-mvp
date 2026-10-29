/**
 * SQLite via sql.js (WASM) — no native compile needed.
 * Persists to .data/ticketshop.sqlite; migrates JSON from data/ on first boot.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { createRequire } from 'node:module'
import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'

const require = createRequire(import.meta.url)

type SqlJsDatabase = import('sql.js').Database
type SqlJsStatic = import('sql.js').SqlJsStatic

let SQL: SqlJsStatic | null = null
let db: SqlJsDatabase | null = null
let persistTimer: ReturnType<typeof setTimeout> | null = null

function dataDir() {
  return join(process.cwd(), 'data')
}
function dbPath() {
  return join(process.cwd(), '.data', 'ticketshop.sqlite')
}

/** Path sql.js will `open()`. Prefer the traced Nitro copy, then the real package. */
function locateSqlFile(file: string): string {
  const traced = join(dirname(require.resolve('sql.js')), file)
  if (existsSync(traced)) return traced
  const fallbacks = [
    join(process.cwd(), '.output', 'server', 'node_modules', 'sql.js', 'dist', file),
    join(process.cwd(), 'node_modules', 'sql.js', 'dist', file)
  ]
  for (const candidate of fallbacks) {
    if (existsSync(candidate)) return candidate
  }
  return traced
}

async function loadSqlJs(): Promise<SqlJsStatic> {
  if (SQL) return SQL
  const initSqlJs = (await import('sql.js')).default
  SQL = await initSqlJs({
    locateFile: (file: string) => locateSqlFile(file)
  })
  return SQL
}

function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    try {
      persistNow()
    } catch (e) {
      console.error('[db] persist failed', e)
    }
  }, 80)
}

export function persistNow() {
  if (!db) return
  mkdirSync(dirname(dbPath()), { recursive: true })
  const data = db.export()
  writeFileSync(dbPath(), Buffer.from(data))
}

function exec(sql: string) {
  db!.run(sql)
}

function run(sql: string, params: unknown[] = []) {
  db!.run(sql, params as any[])
  schedulePersist()
}

function all<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
  const stmt = db!.prepare(sql)
  stmt.bind(params as any[])
  const rows: T[] = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T)
  }
  stmt.free()
  return rows
}

function get<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T | null {
  const rows = all<T>(sql, params)
  return rows[0] ?? null
}

function migrateSchema() {
  exec(`
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, slug TEXT UNIQUE, data TEXT NOT NULL, active INTEGER DEFAULT 1);
    CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, status TEXT, email TEXT, created_at TEXT, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS holds (id TEXT PRIMARY KEY, status TEXT, expires_at TEXT, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS tickets (code TEXT PRIMARY KEY, order_id TEXT, email TEXT, status TEXT, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS monitoring (id TEXT PRIMARY KEY, kind TEXT, at TEXT, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS event_posters (
      event_id TEXT PRIMARY KEY,
      mime TEXT NOT NULL,
      bytes BLOB NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_holds_status ON holds(status);
    CREATE INDEX IF NOT EXISTS idx_tickets_email ON tickets(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `)
}

function readJsonFile<T>(name: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(join(dataDir(), name), 'utf8')) as T
  } catch {
    return structuredClone(fallback)
  }
}

function seedUsersIfEmpty() {
  const count = get<{ c: number }>('SELECT COUNT(*) as c FROM users')
  if ((count?.c ?? 0) > 0) return

  const seeds = [
    { email: 'admin@ticketshop.local', password: 'admin', role: 'admin', name: 'Admin' },
    { email: 'scanner@ticketshop.local', password: 'scanner', role: 'scanner', name: 'Door Scanner' },
    { email: 'client@ticketshop.local', password: 'client', role: 'client', name: 'Client Organizer' }
  ]
  const now = new Date().toISOString()
  for (const s of seeds) {
    const id = `user-${randomBytes(4).toString('hex')}`
    const hash = bcrypt.hashSync(s.password, 10)
    run(
      'INSERT INTO users (id, email, password_hash, role, name, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, s.email, hash, s.role, s.name, now]
    )
  }
  console.log('[db] Seeded users: admin@ / scanner@ / client@ (change passwords in production)')
}

/** Fill missing poster paths from data/events.json without touching other event fields. */
function applyPosterImagesFromSeed() {
  const seeds = readJsonFile<Array<{ slug?: string; posterImage?: string }>>('events.json', [])
  const posters = new Map<string, string>()
  for (const seed of seeds) {
    if (seed.slug && seed.posterImage) posters.set(seed.slug, seed.posterImage)
  }
  if (!posters.size || !db) return

  const rows = all<{ id: string; slug: string; data: string }>('SELECT id, slug, data FROM events')
  let changed = false
  for (const row of rows) {
    let data: Record<string, unknown>
    try {
      data = JSON.parse(row.data)
    } catch {
      continue
    }
    const slug = (typeof data.slug === 'string' && data.slug) || row.slug
    const poster = posters.get(slug)
    if (!poster || data.posterImage) continue
    data.posterImage = poster
    db.run('UPDATE events SET data = ? WHERE id = ?', [JSON.stringify(data), row.id])
    changed = true
  }
  if (changed) persistNow()
}

function migrateFromJsonIfNeeded() {
  const flag = get<{ value: string }>('SELECT value FROM meta WHERE key = ?', ['migrated_json_v1'])
  if (flag?.value === '1') {
    seedUsersIfEmpty()
    applyPosterImagesFromSeed()
    return
  }

  const settings = readJsonFile('settings.json', null as any)
  if (settings) {
    run('INSERT OR REPLACE INTO settings (id, data) VALUES (1, ?)', [JSON.stringify(settings)])
  }

  const events = readJsonFile<any[]>('events.json', [])
  for (const e of events) {
    run('INSERT OR REPLACE INTO events (id, slug, data, active) VALUES (?, ?, ?, ?)', [
      e.id,
      e.slug,
      JSON.stringify(e),
      e.active ? 1 : 0
    ])
  }

  const orders = readJsonFile<any[]>('orders-runtime.json', [])
  const seedOrders = readJsonFile<any[]>('orders.json', [])
  const orderMap = new Map<string, any>()
  for (const o of [...seedOrders, ...orders]) orderMap.set(o.id, o)
  for (const o of orderMap.values()) {
    run('INSERT OR REPLACE INTO orders (id, status, email, created_at, data) VALUES (?, ?, ?, ?, ?)', [
      o.id,
      o.status || 'pending',
      o.customer?.email || '',
      o.createdAt || new Date().toISOString(),
      JSON.stringify(o)
    ])
  }

  const holds = readJsonFile<any[]>('holds.json', [])
  for (const h of holds) {
    run('INSERT OR REPLACE INTO holds (id, status, expires_at, data) VALUES (?, ?, ?, ?)', [
      h.id,
      h.status,
      h.expiresAt,
      JSON.stringify(h)
    ])
  }

  const tickets = readJsonFile<any[]>('tickets.json', [])
  for (const t of tickets) {
    run('INSERT OR REPLACE INTO tickets (code, order_id, email, status, data) VALUES (?, ?, ?, ?, ?)', [
      t.code,
      t.orderId,
      t.customerEmail || '',
      t.status || 'valid',
      JSON.stringify(t)
    ])
  }

  const mon = readJsonFile<{ failedPayments: any[]; seatsSyncErrors: any[] }>('monitoring.json', {
    failedPayments: [],
    seatsSyncErrors: []
  })
  for (const f of mon.failedPayments || []) {
    run('INSERT OR REPLACE INTO monitoring (id, kind, at, data) VALUES (?, ?, ?, ?)', [
      f.id,
      'failed_payment',
      f.at,
      JSON.stringify(f)
    ])
  }
  for (const s of mon.seatsSyncErrors || []) {
    run('INSERT OR REPLACE INTO monitoring (id, kind, at, data) VALUES (?, ?, ?, ?)', [
      s.id,
      'seats_sync',
      s.at,
      JSON.stringify(s)
    ])
  }

  seedUsersIfEmpty()
  applyPosterImagesFromSeed()
  run('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', ['migrated_json_v1', '1'])
  persistNow()
  console.log('[db] Migrated JSON → SQLite (.data/ticketshop.sqlite)')
}

export async function getDb(): Promise<SqlJsDatabase> {
  if (db) return db
  const Sql = await loadSqlJs()
  mkdirSync(dirname(dbPath()), { recursive: true })
  if (existsSync(dbPath())) {
    const buf = readFileSync(dbPath())
    db = new Sql.Database(buf)
  } else {
    db = new Sql.Database()
  }
  migrateSchema()
  migrateFromJsonIfNeeded()
  persistNow()
  return db
}

/** Ensure DB ready — call from handlers */
export async function ensureDb() {
  await getDb()
}

export const dbApi = {
  run,
  all,
  get,
  exec,
  schedulePersist,
  persistNow
}

export function dbNewId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${randomBytes(3).toString('hex')}`
}

export function dbTicketCodeFor(orderId: string, index: number) {
  const raw = `${orderId}:${index}:${randomBytes(4).toString('hex')}`
  return createHash('sha1').update(raw).digest('hex').slice(0, 12).toUpperCase()
}
