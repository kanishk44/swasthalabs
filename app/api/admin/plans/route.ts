import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAuthServer } from "@/lib/supabase/server";

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

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { versionId, action } = await req.json();

  try {
    if (action === "unlock") {
      await prisma.planVersion.update({
        where: { id: versionId },
        data: { isReleased: true, releaseAt: new Date() }
      });
      return NextResponse.json({ success: true });
    }

    if (action === "delete") {
      await prisma.planVersion.delete({
        where: { id: versionId }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
