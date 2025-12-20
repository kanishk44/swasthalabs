import { NextRequest, NextResponse } from "next/server";
import { claimJobs, releaseJob } from "@/lib/jobs/worker";
import { prisma } from "@/lib/prisma";
import { generateCustomPlan } from "@/lib/ai/planner";
import { WebhookStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  // Check auth for cron (Vercel Cron Secret)
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobs = await claimJobs(5);
  const results = [];

  for (const job of jobs) {
    try {
      if (job.source === "typeform") {
        await processTypeformIntake(job.payload as any);
      } else if (job.source === "razorpay") {
        await processRazorpayPayment(job.payload as any);
      }
      
      await releaseJob(job.id, WebhookStatus.PROCESSED);
      results.push({ id: job.id, status: "success" });
    } catch (error: any) {
      console.error(`Error processing job ${job.id}:`, error);
      await releaseJob(job.id, WebhookStatus.FAILED, error.message);
      results.push({ id: job.id, status: "failed", error: error.message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}

async function processTypeformIntake(payload: any) {
  const hidden = payload.form_response?.hidden || {};
  const userId = hidden.user_id;
  const email = hidden.email;

  if (!userId) throw new Error("Missing user_id in Typeform hidden fields");

  // Upsert intake
  await prisma.intake.upsert({
    where: { userId },
    update: {
      rawJson: payload,
      fields: payload.form_response?.answers || {},
    },
    create: {
      userId,
      rawJson: payload,
      fields: payload.form_response?.answers || {},
    },
  });
}

async function processRazorpayPayment(payload: any) {
  const event = payload.event;
  
  if (event === "subscription.activated") {
    const sub = payload.payload.subscription.entity;
    const userId = sub.notes?.user_id; // Assume notes contain user_id

    if (!userId) throw new Error("Missing user_id in Razorpay subscription notes");

    await prisma.subscription.update({
      where: { razorpaySubscriptionId: sub.id },
      data: {
        status: "ACTIVE",
        startedAt: new Date(sub.start_at * 1000),
        renewsAt: new Date(sub.charge_at * 1000),
      },
    });

    // Trigger AI Plan Generation
    const intake = await prisma.intake.findUnique({ where: { userId } });
    if (intake) {
      const planData = await generateCustomPlan(userId, intake.fields);
      
      // Create Plan + PlanVersion (locked for 24h)
      const plan = await prisma.plan.create({
        data: { userId },
      });

      await prisma.planVersion.create({
        data: {
          planId: plan.id,
          version: 1,
          jsonPlan: planData as any,
          releaseAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          isReleased: false,
        },
      });
    }
  }
}

