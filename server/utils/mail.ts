import nodemailer from 'nodemailer'
import { readSettings } from './settings'
import type { OrderRecord, TicketRecord } from './store'
import { buildPdfText } from './tickets-pdf'

export type MailResult = { ok: boolean; mode: string; message: string }

export async function sendTicketEmail(
  order: OrderRecord,
  tickets: TicketRecord[]
): Promise<MailResult> {
  const settings = await readSettings()
  const site = settings.commerce.siteUrl || 'http://localhost:3000'
  const lines = tickets
    .map(
      (t) =>
        `- ${t.label}${t.seatId ? ` (${t.seatId})` : ''}: ${t.code}\n  PDF: ${site}/api/tickets/${t.code}/pdf`
    )
    .join('\n')

  const subject = `Deine Tickets — ${order.eventTitle} (${order.id})`
  const text = [
    `Hallo ${order.customer.name},`,
    '',
    `vielen Dank für deine Bestellung bei TicketShop.`,
    '',
    `Event: ${order.eventTitle}`,
    `Bestellung: ${order.id}`,
    `Summe: ${order.total.toFixed(2)} ${settings.commerce.currency.toUpperCase()}`,
    '',
    'Tickets:',
    lines,
    '',
    `Tickets finden: ${site}/ticket-find`,
    '',
    'Mit freundlichen Grüßen',
    settings.company.name !== '[FIRMA]' ? settings.company.name : 'TicketShop'
  ].join('\n')

  const pdfAttachments = tickets.map((t) => ({
    filename: `ticket-${t.code}.pdf`,
    content: Buffer.from(buildPdfText(t), 'utf8'),
    contentType: 'application/pdf'
  }))

  if (settings.email.provider === 'log' || !settings.email.from) {
    console.log('[TicketShop] EMAIL LOG →', order.customer.email, {
      subject,
      tickets: tickets.map((t) => t.code),
      note: 'Set email.provider to smtp|resend in Admin → Settings to send for real'
    })
    return { ok: true, mode: 'log', message: 'Logged (no SMTP/Resend configured)' }
  }

  if (settings.email.provider === 'resend') {
    if (!settings.email.resendApiKey) {
      console.log('[TicketShop] EMAIL SKIP resend — missing API key →', order.customer.email)
      return { ok: false, mode: 'resend', message: 'Missing Resend API key' }
    }
    try {
      // Resend REST — PDF as base64
      const attachments = pdfAttachments.map((a) => ({
        filename: a.filename,
        content: a.content.toString('base64')
      }))
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.email.resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: settings.email.from,
          to: [order.customer.email],
          subject,
          text,
          attachments
        })
      })
      if (!res.ok) {
        const body = await res.text()
        console.error('[TicketShop] Resend error', res.status, body)
        return { ok: false, mode: 'resend', message: body.slice(0, 200) }
      }
      return { ok: true, mode: 'resend', message: 'Sent via Resend' }
    } catch (e: any) {
      console.error('[TicketShop] Resend exception', e)
      return { ok: false, mode: 'resend', message: e?.message || 'Resend failed' }
    }
  }

  // SMTP via nodemailer
  if (!settings.email.smtpHost) {
    console.log('[TicketShop] EMAIL SKIP smtp — missing host →', order.customer.email)
    return { ok: false, mode: 'smtp', message: 'Missing SMTP host' }
  }

  try {
    const transporter = nodemailer.createTransport({
      host: settings.email.smtpHost,
      port: settings.email.smtpPort || 587,
      secure: !!settings.email.smtpSecure && settings.email.smtpPort === 465,
      auth:
        settings.email.smtpUser || settings.email.smtpPass
          ? { user: settings.email.smtpUser, pass: settings.email.smtpPass }
          : undefined
    })
    await transporter.sendMail({
      from: settings.email.from,
      to: order.customer.email,
      subject,
      text,
      attachments: pdfAttachments
    })
    return { ok: true, mode: 'smtp', message: 'Sent via SMTP' }
  } catch (e: any) {
    console.error('[TicketShop] SMTP error', e)
    // Fall back to log so fulfill still succeeds
    console.log('[TicketShop] EMAIL FALLBACK LOG →', order.customer.email, { subject })
    return { ok: false, mode: 'smtp', message: e?.message || 'SMTP failed (logged)' }
  }
}
