import { ensureDb, dbApi, dbNewId } from './db'

const TABLES = new Set(['places', 'clients', 'payouts', 'promos', 'sponsors', 'affiliates'])

function table(name: string) {
  if (!TABLES.has(name)) throw new Error('unknown table')
  return name
}

export async function listCatalog<T = any>(name: string): Promise<T[]> {
  await ensureDb()
  return dbApi
    .all<{ data: string }>(`SELECT data FROM ${table(name)} ORDER BY id`)
    .map((row) => JSON.parse(row.data) as T)
}

export async function upsertCatalog<T extends { id?: string }>(name: string, row: T, prefix: string): Promise<T & { id: string }> {
  await ensureDb()
  const saved = { ...row, id: row.id || dbNewId(prefix) }
  dbApi.run(`INSERT OR REPLACE INTO ${table(name)} (id, data) VALUES (?, ?)`, [saved.id, JSON.stringify(saved)])
  dbApi.persistNow()
  return saved as T & { id: string }
}

export async function deleteCatalog(name: string, id: string) {
  await ensureDb()
  dbApi.run(`DELETE FROM ${table(name)} WHERE id = ?`, [id])
  dbApi.persistNow()
}
