import { ensureDb, dbApi, dbNewId, dbTicketCodeFor } from './db'

export type OrderRecord = {
  id: string
  eventId: string
  eventTitle: string
  eventSlug?: string
  createdAt: string
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'expired'
  payment: string
  paymentRef?: string
  stripeSessionId?: string
  customer: { name: string; email: string; phone?: string }
  items: Array<{
    label: string
    price: number
    seatId?: string | null
    categoryId?: string
    ticketCode?: string
  }>
  total: number
  fees: number
  holdIds?: string[]
  seatsHoldToken?: string | null
  emailSentAt?: string | null
  failReason?: string
}

export type HoldRecord = {
  id: string
  eventId: string
  seatIds: string[]
  seatsHoldToken?: string | null
  createdAt: string
  expiresAt: string
  status: 'active' | 'released' | 'converted' | 'expired'
  orderId?: string | null
  customerEmail?: string | null
}

export type TicketRecord = {
  code: string
  orderId: string
  eventId: string
  eventTitle: string
  label: string
  seatId?: string | null
  customerEmail: string
  customerName: string
  createdAt: string
  scannedAt?: string | null
  scannedBy?: string | null
  status: 'valid' | 'scanned' | 'void'
}

export type MonitoringStore = {
  failedPayments: Array<{
    id: string
    at: string
    email?: string
    amount?: number
    reason: string
    provider: string
    orderId?: string
  }>
  seatsSyncErrors: Array<{
    id: string
    at: string
    eventId?: string
    action: string
    message: string
  }>
}

export function newId(prefix: string) { return dbNewId(prefix) }
export function ticketCodeFor(orderId: string, index: number) { return dbTicketCodeFor(orderId, index) }

export async function readOrders(): Promise<OrderRecord[]> {
  await ensureDb()
  return dbApi
    .all<{ data: string }>('SELECT data FROM orders ORDER BY created_at DESC')
    .map((r) => JSON.parse(r.data) as OrderRecord)
}

export async function writeOrders(orders: OrderRecord[]) {
  await ensureDb()
  dbApi.run('DELETE FROM orders')
  for (const o of orders) {
    dbApi.run(
      'INSERT INTO orders (id, status, email, created_at, data) VALUES (?, ?, ?, ?, ?)',
      [o.id, o.status, o.customer?.email || '', o.createdAt, JSON.stringify(o)]
    )
  }
  dbApi.persistNow()
}

export async function upsertOrder(o: OrderRecord) {
  await ensureDb()
  dbApi.run(
    'INSERT OR REPLACE INTO orders (id, status, email, created_at, data) VALUES (?, ?, ?, ?, ?)',
    [o.id, o.status, o.customer?.email || '', o.createdAt, JSON.stringify(o)]
  )
  dbApi.persistNow()
}

export async function readHolds(): Promise<HoldRecord[]> {
  await ensureDb()
  return dbApi.all<{ data: string }>('SELECT data FROM holds').map((r) => JSON.parse(r.data) as HoldRecord)
}

export async function writeHolds(holds: HoldRecord[]) {
  await ensureDb()
  dbApi.run('DELETE FROM holds')
  for (const h of holds) {
    dbApi.run('INSERT INTO holds (id, status, expires_at, data) VALUES (?, ?, ?, ?)', [
      h.id,
      h.status,
      h.expiresAt,
      JSON.stringify(h)
    ])
  }
  dbApi.persistNow()
}

export async function readTickets(): Promise<TicketRecord[]> {
  await ensureDb()
  return dbApi.all<{ data: string }>('SELECT data FROM tickets').map((r) => JSON.parse(r.data) as TicketRecord)
}

export async function writeTickets(tickets: TicketRecord[]) {
  await ensureDb()
  dbApi.run('DELETE FROM tickets')
  for (const t of tickets) {
    dbApi.run(
      'INSERT INTO tickets (code, order_id, email, status, data) VALUES (?, ?, ?, ?, ?)',
      [t.code, t.orderId, t.customerEmail || '', t.status, JSON.stringify(t)]
    )
  }
  dbApi.persistNow()
}

export async function upsertTicket(t: TicketRecord) {
  await ensureDb()
  dbApi.run(
    'INSERT OR REPLACE INTO tickets (code, order_id, email, status, data) VALUES (?, ?, ?, ?, ?)',
    [t.code, t.orderId, t.customerEmail || '', t.status, JSON.stringify(t)]
  )
  dbApi.persistNow()
}

export async function readMonitoring(): Promise<MonitoringStore> {
  await ensureDb()
  const rows = dbApi.all<{ kind: string; data: string }>(
    'SELECT kind, data FROM monitoring ORDER BY at DESC LIMIT 400'
  )
  const failedPayments: MonitoringStore['failedPayments'] = []
  const seatsSyncErrors: MonitoringStore['seatsSyncErrors'] = []
  for (const r of rows) {
    const obj = JSON.parse(r.data)
    if (r.kind === 'failed_payment') failedPayments.push(obj)
    else if (r.kind === 'seats_sync') seatsSyncErrors.push(obj)
  }
  return { failedPayments, seatsSyncErrors }
}

export async function writeMonitoring(m: MonitoringStore) {
  await ensureDb()
  dbApi.run('DELETE FROM monitoring')
  for (const f of m.failedPayments) {
    dbApi.run('INSERT INTO monitoring (id, kind, at, data) VALUES (?, ?, ?, ?)', [
      f.id,
      'failed_payment',
      f.at,
      JSON.stringify(f)
    ])
  }
  for (const s of m.seatsSyncErrors) {
    dbApi.run('INSERT INTO monitoring (id, kind, at, data) VALUES (?, ?, ?, ?)', [
      s.id,
      'seats_sync',
      s.at,
      JSON.stringify(s)
    ])
  }
  dbApi.persistNow()
}

export async function logFailedPayment(entry: Omit<MonitoringStore['failedPayments'][0], 'id' | 'at'>) {
  await ensureDb()
  const row = { id: newId('fail'), at: new Date().toISOString(), ...entry }
  dbApi.run('INSERT INTO monitoring (id, kind, at, data) VALUES (?, ?, ?, ?)', [
    row.id,
    'failed_payment',
    row.at,
    JSON.stringify(row)
  ])
  dbApi.persistNow()
}

export async function logSeatsSyncError(entry: Omit<MonitoringStore['seatsSyncErrors'][0], 'id' | 'at'>) {
  await ensureDb()
  const row = { id: newId('sync'), at: new Date().toISOString(), ...entry }
  dbApi.run('INSERT INTO monitoring (id, kind, at, data) VALUES (?, ?, ?, ?)', [
    row.id,
    'seats_sync',
    row.at,
    JSON.stringify(row)
  ])
  dbApi.persistNow()
}

export async function releaseExpiredHolds(): Promise<number> {
  const holds = await readHolds()
  const now = Date.now()
  let n = 0
  for (const h of holds) {
    if (h.status === 'active' && new Date(h.expiresAt).getTime() <= now) {
      h.status = 'expired'
      n++
    }
  }
  if (n) await writeHolds(holds)
  return n
}

export async function readEvents(): Promise<any[]> {
  await ensureDb()
  return dbApi
    .all<{ data: string }>('SELECT data FROM events ORDER BY slug')
    .map((r) => JSON.parse(r.data))
}

export async function writeEvents(events: any[]) {
  await ensureDb()
  dbApi.run('DELETE FROM events')
  for (const e of events) {
    dbApi.run('INSERT INTO events (id, slug, data, active) VALUES (?, ?, ?, ?)', [
      e.id,
      e.slug,
      JSON.stringify(e),
      e.active ? 1 : 0
    ])
  }
  dbApi.persistNow()
}

export async function upsertEvent(e: any) {
  await ensureDb()
  dbApi.run('INSERT OR REPLACE INTO events (id, slug, data, active) VALUES (?, ?, ?, ?)', [
    e.id,
    e.slug,
    JSON.stringify(e),
    e.active ? 1 : 0
  ])
  dbApi.persistNow()
}
