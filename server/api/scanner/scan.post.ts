import { requireUser } from '../../utils/auth'
import { readTickets, writeTickets } from '../../utils/store'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event, ['admin', 'scanner'])
  const body = await readBody(event)
  const code = String(body?.code || '').trim().toUpperCase()
  const scanner = String(body?.scanner || user.email || 'scanner')
  if (!code) throw createError({ statusCode: 400, statusMessage: 'code required' })

  const tickets = await readTickets()
  const ticket = tickets.find((t) => t.code.toUpperCase() === code)
  if (!ticket) {
    return { ok: false, status: 'not_found', message: 'Ticket unbekannt' }
  }
  if (ticket.status === 'void') {
    return { ok: false, status: 'void', message: 'Ticket ungültig', ticket }
  }
  if (ticket.status === 'scanned') {
    return {
      ok: false,
      status: 'already_scanned',
      message: `Bereits gescannt ${ticket.scannedAt}`,
      ticket
    }
  }
  ticket.status = 'scanned'
  ticket.scannedAt = new Date().toISOString()
  ticket.scannedBy = scanner
  await writeTickets(tickets)
  return { ok: true, status: 'ok', message: 'Einlass OK', ticket }
})
