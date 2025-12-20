import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getSupabaseServer } from "@/lib/supabase/server";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const { planId, userId } = await req.json();

    if (!planId || !userId) {
      return NextResponse.json({ error: "Missing planId or userId" }, { status: 400 });
    }

    // Create a subscription in Razorpay
    // IMPORTANT: We pass user_id in notes so the webhook can identify the user
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12, // For a monthly plan, bill 12 times (adjust based on your plan)
      quantity: 1,
      customer_notify: 1,
      notes: {
        user_id: userId,
      },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Razorpay subscription error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
