import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAuthServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  // Authenticate the requester
  const supabase = await getSupabaseAuthServer();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
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
      where: { email: authUser.email! },
      select: { role: true }
    });
    isAdmin = dbUser?.role === "ADMIN";
  }

  if (!isOwnData && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

