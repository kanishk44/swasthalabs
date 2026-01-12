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

const MAX_ATTEMPTS = 5;

export async function releaseJob(id: string, status: WebhookStatus, error?: string) {
  if (status === WebhookStatus.FAILED) {
    // Use atomic raw SQL to increment attemptCount and determine final status in one operation
    // This prevents race conditions and ensures DEAD is set on the 5th failure (not 6th)
    await prisma.$queryRaw(
      Prisma.sql`
        UPDATE "WebhookEvent"
        SET
          "attemptCount" = "attemptCount" + 1,
          "status" = CASE 
            WHEN "attemptCount" + 1 >= ${MAX_ATTEMPTS} THEN 'DEAD'::"WebhookStatus"
            ELSE 'FAILED'::"WebhookStatus"
          END,
          "lastError" = ${error ?? null},
          "nextAttemptAt" = CASE
            WHEN "attemptCount" + 1 >= ${MAX_ATTEMPTS} THEN NULL
            ELSE NOW() + (POWER(2, "attemptCount" + 1) * INTERVAL '1 minute')
          END,
          "lockedAt" = NULL,
          "updatedAt" = NOW()
        WHERE id = ${id}
      `
    );
  } else {
    // For non-failure statuses (e.g., PROCESSED), use simple Prisma update
    await prisma.webhookEvent.update({
      where: { id },
      data: {
        status,
        lastError: error ?? null,
        nextAttemptAt: null,
        lockedAt: null,
      },
    });
  }
}

