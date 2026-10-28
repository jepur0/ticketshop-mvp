import { readTickets } from '../../../utils/store'
import { buildPdfText } from '../../../utils/tickets-pdf'

export default defineEventHandler(async (event) => {
  const code = String(getRouterParam(event, 'code') || '').toUpperCase()
  const tickets = await readTickets()
  const ticket = tickets.find((t) => t.code.toUpperCase() === code)
  if (!ticket) throw createError({ statusCode: 404, statusMessage: 'Ticket not found' })
  const pdf = buildPdfText(ticket)
  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', `inline; filename="ticket-${ticket.code}.pdf"`)
  return Buffer.from(pdf, 'utf8')
})
