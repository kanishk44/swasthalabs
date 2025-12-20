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

// POST - Add a new file asset
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, bucketPath } = await req.json();

    if (!title || !bucketPath) {
      return NextResponse.json({ error: "Title and bucketPath are required" }, { status: 400 });
    }

    // Check if file already exists with same bucket path
    const existing = await prisma.fileAsset.findFirst({
      where: { bucketPath }
    });

    if (existing) {
      return NextResponse.json({ error: "A document with this path already exists" }, { status: 400 });
    }

    const fileAsset = await prisma.fileAsset.create({
      data: {
        title,
        bucketPath
      }
    });

    return NextResponse.json(fileAsset);
  } catch (error: any) {
    console.error("File asset creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove a file asset and its chunks
export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "File asset ID is required" }, { status: 400 });
    }

    // Delete all chunks first (cascade)
    await prisma.guideChunk.deleteMany({
      where: { fileAssetId: id }
    });

    // Then delete the file asset
    await prisma.fileAsset.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("File asset deletion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
