import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const [intake, subscription, latestPlan] = await Promise.all([
      prisma.intake.findUnique({ where: { userId } }),
      prisma.subscription.findFirst({ 
        where: { userId, status: "ACTIVE" },
        orderBy: { updatedAt: "desc" }
      }),
      prisma.planVersion.findFirst({
        where: { plan: { userId } },
        orderBy: { createdAt: "desc" },
        include: { plan: true }
      })
    ]);

    return NextResponse.json({
      hasIntake: !!intake,
      hasSubscription: !!subscription,
      latestPlan: latestPlan || null,
    });
  } catch (error: any) {
    console.error("User status error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

