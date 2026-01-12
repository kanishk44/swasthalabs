import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // Verify signature if secret is configured
  if (secret) {
    // Require signature header when secret is configured
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    // Use timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  // Parse and validate payload
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch (parseError) {
    console.error("Razorpay webhook JSON parse error:", parseError);
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  // Validate payload structure
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("id" in payload) ||
    typeof (payload as Record<string, unknown>).id !== "string" ||
    (payload as Record<string, unknown>).id === ""
  ) {
    console.error("Razorpay webhook invalid payload structure:", payload);
    return NextResponse.json({ error: "Invalid payload: missing or invalid event id" }, { status: 400 });
  }

  const eventId = `razorpay:${(payload as { id: string }).id}`;

  try {
    // Idempotent write
    await prisma.webhookEvent.upsert({
      where: { event_id: eventId },
      update: {},
      create: {
        event_id: eventId,
        source: "razorpay",
        payload: payload,
        status: "PENDING",
      },
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

