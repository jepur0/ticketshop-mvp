import { readPoster } from '../../../utils/posters'

export default defineEventHandler(async (event) => {
  const eventId = String(getRouterParam(event, 'eventId') || '')
  const poster = await readPoster(eventId)
  if (!poster) throw createError({ statusCode: 404, statusMessage: 'Bild nicht gefunden' })
  setHeader(event, 'Content-Type', poster.mime)
  setHeader(event, 'Cache-Control', 'public, max-age=86400')
  return Buffer.from(poster.bytes)
})
