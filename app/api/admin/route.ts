import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAuthServer } from "@/lib/supabase/server";
import { Prisma } from "@prisma/client";

async function isAdmin() {
  const supabase = await getSupabaseAuthServer();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { role: true }
  });

  return dbUser?.role === "ADMIN";
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [users, plans, webhooks, fileAssets] = await Promise.all([
      prisma.user.findMany({ 
        include: { profile: true, subscriptions: true },
        orderBy: { createdAt: "desc" }
      }),
      prisma.planVersion.findMany({
        where: { isReleased: false },
        include: { plan: { include: { user: true } } },
        orderBy: { releaseAt: "asc" }
      }),
      prisma.webhookEvent.findMany({
        where: { status: { in: ["FAILED", "PENDING"] } },
        orderBy: { createdAt: "desc" },
        take: 20
      }),
      prisma.fileAsset.findMany({
        include: { 
          _count: { select: { chunks: true } } 
        },
        orderBy: { createdAt: "desc" }
      })
    ]);

    // Get chunk statistics for file assets
    const assetsWithStats = fileAssets.map((asset) => ({
      ...asset,
      chunkCount: asset._count.chunks,
      _count: undefined
    }));

    return NextResponse.json({
      users,
      pendingPlans: plans,
      troubledWebhooks: webhooks,
      fileAssets: assetsWithStats
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
