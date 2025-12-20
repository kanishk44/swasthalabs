"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Script from "next/script";
import { useRouter } from "next/navigation";

const PLANS = [
  {
    id: "3_MONTHS",
    razorpayPlanId: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_3M || "plan_3m_placeholder",
    name: "Standard",
    duration: "3 Months",
    price: "1,999",
    totalPrice: "5,997",
    features: [
      "AI Personalized Diet Plan",
      "AI Workout Routine",
      "Quarterly Plan Refresh",
      "Basic AI Coach Support",
    ],
    recommended: false,
  },
  {
    id: "6_MONTHS",
    razorpayPlanId: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_6M || "plan_6m_placeholder",
    name: "Pro",
    duration: "6 Months",
    price: "1,699",
    totalPrice: "10,194",
    features: [
      "Everything in Standard",
      "15% Savings Included",
      "Priority AI Coach Support",
      "Custom Macro Adjustments",
    ],
    recommended: true,
  },
  {
    id: "12_MONTHS",
    razorpayPlanId: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_12M || "plan_12m_placeholder",
    name: "Elite",
    duration: "12 Months",
    price: "1,299",
    totalPrice: "15,588",
    features: [
      "Everything in Pro",
      "35% Savings Included",
      "Direct Coach Overrides",
      "Early Access to Features",
    ],
    recommended: false,
  },
];

export default function Pricing({ userId }: { userId: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleSubscribe = async (plan: typeof PLANS[0]) => {
    if (!userId) {
      toast.info("Please log in to choose a plan");
      router.push("/login?redirect=/#pricing");
      return;
    }

    setLoading(plan.id);

    try {
      const response = await fetch("/api/checkout/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.razorpayPlanId,
          userId: userId,
        }),
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      const options = {
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "SwasthaLabs",
        description: `${plan.duration} Subscription`,
        image: "/logo.png",
        handler: function (response: any) {
          toast.success("Subscription successful! Redirecting to dashboard...");
          window.location.href = "/dashboard";
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#000000",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate checkout");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-20">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
            Pricing Plans
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-white">
            Invest in Your <span className="text-primary">Best Self</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose a subscription tier and let our AI Coach build your personalized Indian diet and workout roadmap.
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLANS.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`h-full border-white/5 bg-zinc-900/50 backdrop-blur-xl relative flex flex-col ${plan.recommended ? 'ring-2 ring-primary border-transparent' : ''}`}>
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> MOST POPULAR
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-muted-foreground">{plan.duration} access</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-black tracking-tight text-white">₹{plan.price}</span>
                  <span className="text-muted-foreground ml-1">/mo</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Billed as ₹{plan.totalPrice} total
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
                      <div className="mt-1 h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Check className="h-2.5 w-2.5 text-primary" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button 
                  className="w-full h-12 text-lg font-bold transition-all hover:scale-[1.02]"
                  variant={plan.recommended ? "default" : "secondary"}
                  disabled={loading === plan.id}
                  onClick={() => handleSubscribe(plan)}
                >
                  {loading === plan.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Subscribe Now"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
