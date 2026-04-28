import prisma from '../../lib/prisma.js'
import type { Prisma } from '@prisma/client'

const SOURCE_PARTNER = 'Webinar May 11 2026 RSVP'

export function findRsvpByEmail(email: string) {
  return prisma.lead.findFirst({
    where: {
      email,
      sourcePartner: SOURCE_PARTNER,
      deletedAt: null,
    },
  })
}

export function createRsvpLead(data: Prisma.LeadUncheckedCreateInput) {
  return prisma.lead.create({ data })
}

export const WEBINAR_SOURCE_PARTNER = SOURCE_PARTNER
