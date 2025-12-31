import { prisma } from "@/lib/prisma";
import { WebhookStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";

const MAX_JOB_LIMIT = 100;
const MIN_JOB_LIMIT = 1;

export async function claimJobs(limit: number = 5) {
  // Validate and coerce limit to a safe integer within bounds
  const safeLimit = Math.max(
    MIN_JOB_LIMIT,
    Math.min(MAX_JOB_LIMIT, Math.floor(Number(limit) || MIN_JOB_LIMIT))
  );

  if (!Number.isInteger(safeLimit) || safeLimit < MIN_JOB_LIMIT || safeLimit > MAX_JOB_LIMIT) {
    throw new Error(`Invalid limit: must be an integer between ${MIN_JOB_LIMIT} and ${MAX_JOB_LIMIT}`);
  }

  // Use SELECT ... FOR UPDATE SKIP LOCKED to atomically claim jobs
  // We use raw query because Prisma doesn't support FOR UPDATE SKIP LOCKED natively yet
  return await prisma.$transaction(async (tx) => {
    const jobs = await tx.$queryRaw<{ id: string }[]>(
      Prisma.sql`
        SELECT id FROM "WebhookEvent"
        WHERE status IN ('PENDING', 'FAILED')
        AND "nextAttemptAt" <= NOW()
        ORDER BY "nextAttemptAt" ASC
        LIMIT ${safeLimit}
        FOR UPDATE SKIP LOCKED
      `
    );

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

