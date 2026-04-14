import prisma from '../../lib/prisma.js'

export async function completeCampaignIfAllStepsSettled(stepId: string) {
  const step = await prisma.studentCampaignStep.findUnique({
    where: { id: stepId },
    select: {
      studentCampaignId: true,
      studentCampaign: {
        select: {
          status: true,
          steps: { select: { status: true } },
        },
      },
    },
  })

  if (!step || step.studentCampaign.status === 'completed') return

  const allSettled = step.studentCampaign.steps.every(
    (campaignStep) => campaignStep.status === 'sent' || campaignStep.status === 'skipped',
  )

  if (!allSettled) return

  await prisma.studentCampaign.update({
    where: { id: step.studentCampaignId },
    data: { status: 'completed', completedAt: new Date() },
  })
}
