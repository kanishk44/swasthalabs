import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTypeformSignature } from "@/lib/webhooks/typeform";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("Typeform-Signature");
  const secret = process.env.TYPEFORM_WEBHOOK_SECRET || "";

  // Verify signature
  if (secret && !verifyTypeformSignature(signature, body, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const responseId = payload.event_id || payload.form_response?.token;
  
  if (!responseId) {
    return NextResponse.json({ error: "Missing event identifier" }, { status: 400 });
  }

  const eventId = `typeform:${responseId}`;

  try {
    // Idempotent write
    await prisma.webhookEvent.upsert({
      where: { event_id: eventId },
      update: {}, // Do nothing if exists
      create: {
        event_id: eventId,
        source: "typeform",
        payload: payload,
        status: "PENDING",
      },
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Typeform webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

