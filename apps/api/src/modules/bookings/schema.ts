import { z } from 'zod'

export const idParam = z.object({ id: z.string().uuid() })

export { createBookingSchema, updateBookingSchema } from '@sturec/shared/validation'
