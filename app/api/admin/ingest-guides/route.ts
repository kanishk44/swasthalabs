import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ingestFileAsset } from "@/lib/ai/ingestion";
import { getSupabaseServer, getSupabaseAuthServer } from "@/lib/supabase/server";
import crypto from "crypto";

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

  const { fileAssetId } = await req.json();

  try {
    const fileAsset = await prisma.fileAsset.findUnique({
      where: { id: fileAssetId },
    });

    if (!fileAsset) {
      return NextResponse.json({ error: "FileAsset not found" }, { status: 404 });
    }

    // 1. Download file from Supabase
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.storage
      .from("guides")
      .download(fileAsset.bucketPath);

    if (error || !data) {
      throw new Error(`Supabase Download Error: ${error?.message || "No data"}`);
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const currentChecksum = crypto.createHash("sha256").update(buffer).digest("hex");

    // 2. Conditional check
    if (fileAsset.checksum === currentChecksum) {
      return NextResponse.json({ message: "No changes detected. Skipping ingestion." });
    }

    // 3. Update checksum and ingest
    await prisma.fileAsset.update({
      where: { id: fileAssetId },
      data: { checksum: currentChecksum },
    });

    await ingestFileAsset(fileAssetId, buffer);

    return NextResponse.json({ success: true, message: "File ingested successfully." });
  } catch (error: any) {
    console.error("Ingestion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
