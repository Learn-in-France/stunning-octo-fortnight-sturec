import type { FastifyRequest, FastifyReply } from 'fastify'
import * as bookingService from './service.js'

export async function listBookings(request: FastifyRequest, reply: FastifyReply) {
  const bookings = await bookingService.listBookings(request.user)
  return reply.send(bookings)
}

export async function createBooking(request: FastifyRequest, reply: FastifyReply) {
  const booking = await bookingService.createBooking(request.body as any)
  return reply.status(201).send(booking)
}

export async function updateBooking(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const result = await bookingService.updateBooking(request.params.id, request.body as any)
  if (!result) return reply.status(404).send({ error: 'Booking not found', code: 'NOT_FOUND' })
  return reply.send(result)
}
