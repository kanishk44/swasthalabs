import { prisma } from "@/lib/prisma";
import { WebhookStatus } from "@prisma/client";

export async function claimJobs(limit: number = 5) {
  // Use SELECT ... FOR UPDATE SKIP LOCKED to atomically claim jobs
  // We use raw query because Prisma doesn't support FOR UPDATE SKIP LOCKED natively yet
  return await prisma.$transaction(async (tx) => {
    const jobs = await tx.$queryRawUnsafe<{ id: string }[]>(`
      SELECT id FROM "WebhookEvent"
      WHERE status IN ('PENDING', 'FAILED')
      AND "nextAttemptAt" <= NOW()
      ORDER BY "nextAttemptAt" ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    `);

    if (jobs.length === 0) return [];

    const ids = jobs.map((j) => j.id);

    // Update status to PROCESSING
    await tx.webhookEvent.updateMany({
      where: { id: { in: ids } },
      data: {
        status: WebhookStatus.PROCESSING,
        lockedAt: new Date(),
        // lockedBy: process.env.VERCEL_URL || 'worker',
      },
    });

    // Fetch full objects to return
    return await tx.webhookEvent.findMany({
      where: { id: { in: ids } },
    });
  });
}

export async function releaseJob(id: string, status: WebhookStatus, error?: string) {
  const attemptCount = await prisma.webhookEvent.findUnique({
    where: { id },
    select: { attemptCount: true },
  });

  const nextAttempt = attemptCount && status === WebhookStatus.FAILED 
    ? new Date(Date.now() + Math.pow(2, attemptCount.attemptCount) * 1000 * 60) // Exponential backoff
    : new Date();

  await prisma.webhookEvent.update({
    where: { id },
    data: {
      status: status === WebhookStatus.FAILED && (attemptCount?.attemptCount || 0) >= 5 ? WebhookStatus.DEAD : status,
      lastError: error,
      attemptCount: { increment: status === WebhookStatus.FAILED ? 1 : 0 },
      nextAttemptAt: nextAttempt,
      lockedAt: null,
    },
  });
}

