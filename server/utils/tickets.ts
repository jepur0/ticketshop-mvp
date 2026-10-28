import {
  readOrders,
  writeOrders,
  readTickets,
  writeTickets,
  ticketCodeFor,
  upsertOrder,
  type OrderRecord,
  type TicketRecord
} from './store'
import { bookSeats } from './seatsio'
import { sendTicketEmail } from './mail'
import { buildPdfText } from './tickets-pdf'

export async function fulfillPaidOrder(order: OrderRecord, eventKey?: string): Promise<OrderRecord> {
  const tickets = await readTickets()
  const created: TicketRecord[] = []

  order.items = order.items.map((item, idx) => {
    const code = item.ticketCode || ticketCodeFor(order.id, idx)
    return { ...item, ticketCode: code }
  })

  for (let i = 0; i < order.items.length; i++) {
    const item = order.items[i]
    const existing = tickets.find((t) => t.code === item.ticketCode)
    if (existing) {
      created.push(existing)
      continue
    }
    const rec: TicketRecord = {
      code: item.ticketCode!,
      orderId: order.id,
      eventId: order.eventId,
      eventTitle: order.eventTitle,
      label: item.label,
      seatId: item.seatId ?? null,
      customerEmail: order.customer.email,
      customerName: order.customer.name,
      createdAt: new Date().toISOString(),
      scannedAt: null,
      scannedBy: null,
      status: 'valid'
    }
    tickets.unshift(rec)
    created.push(rec)
  }
  await writeTickets(tickets)

  const seatIds = order.items.map((i) => i.seatId).filter(Boolean) as string[]
  if (seatIds.length && eventKey) {
    await bookSeats({
      eventKey,
      seatIds,
      holdToken: order.seatsHoldToken,
      orderId: order.id
    })
  }

  order.status = 'paid'

  try {
    const mail = await sendTicketEmail(order, created)
    order.emailSentAt = mail.ok ? new Date().toISOString() : order.emailSentAt || null
    if (!mail.ok) {
      console.warn('[TicketShop] ticket email not fully sent:', mail.message)
    }
  } catch (e) {
    console.error('[TicketShop] ticket email exception', e)
  }

  await upsertOrder(order)
  return order
}
