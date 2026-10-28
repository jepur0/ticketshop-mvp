import type { TicketRecord } from './store'

export function buildPdfText(ticket: TicketRecord): string {
  return [
    '%PDF-1.1',
    '1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj',
    '2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj',
    '3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 600] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj',
    `4 0 obj<< /Length 220 >>stream`,
    'BT /F1 16 Tf 40 540 Td (TicketShop) Tj ET',
    `BT /F1 12 Tf 40 500 Td (${escapePdf(ticket.eventTitle.slice(0, 40))}) Tj ET`,
    `BT /F1 11 Tf 40 470 Td (${escapePdf(ticket.label.slice(0, 50))}) Tj ET`,
    `BT /F1 14 Tf 40 430 Td (Code: ${ticket.code}) Tj ET`,
    `BT /F1 10 Tf 40 400 Td (${escapePdf(ticket.customerName.slice(0, 40))}) Tj ET`,
    `BT /F1 9 Tf 40 370 Td (Order ${ticket.orderId}) Tj ET`,
    'ET',
    'endstream endobj',
    '5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj',
    'xref',
    '0 6',
    '0000000000 65535 f ',
    '0000000009 00000 n ',
    '0000000058 00000 n ',
    '0000000115 00000 n ',
    '0000000266 00000 n ',
    '0000000538 00000 n ',
    'trailer<< /Size 6 /Root 1 0 R >>',
    'startxref',
    '607',
    '%%EOF'
  ].join('\n')
}

function escapePdf(s: string) {
  return s.replace(/[()\\]/g, '')
}
