import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAuthServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    // Authenticate the requester
    const supabase = await getSupabaseAuthServer();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Check if user is requesting their own data or is an admin
    const isOwnData = authUser.id === userId;

    let isAdmin = false;
    if (!isOwnData) {
      const dbUser = await prisma.user.findUnique({
        where: { id: authUser.id },
        select: { role: true },
      });
      isAdmin = dbUser?.role === "ADMIN";
    }

    if (!isOwnData && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const [intake, subscription, latestPlan] = await Promise.all([
      prisma.intake.findUnique({ where: { userId } }),
      prisma.subscription.findFirst({
        where: { userId, status: "ACTIVE" },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.planVersion.findFirst({
        where: { plan: { userId } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          planId: true,
          releaseAt: true,
          isReleased: true,
          plan: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      hasIntake: !!intake,
      hasSubscription: !!subscription,
      latestPlan: latestPlan || null,
    });
  } catch (error) {
    // Log full error server-side for diagnostics
    console.error("User status error:", error);
    // Return generic error to client to avoid leaking internal details
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
