"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Dumbbell, Utensils, Zap, ShieldCheck } from "lucide-react";
import Pricing from "@/components/pricing/Pricing";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase/client";

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, [supabase]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      {/* Background Effect */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]"></div>
      </div>

      <nav className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/5 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="h-5 w-5 text-black" fill="currentColor" />
          </div>
          <span className="text-xl font-black tracking-tighter">SWASTHALABS</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
        </div>
        <div className="flex items-center gap-4">
          {userId ? (
            <Link href="/dashboard">
              <Button variant="outline" className="border-white/10 hover:bg-white/5 font-bold">
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="outline" className="border-white/10 hover:bg-white/5 font-bold">
                Login
              </Button>
            </Link>
          )}
          <Link href="/intake">
            <Button className="font-bold">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="px-8 py-32 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-8 px-4 py-1.5 bg-zinc-900 border-zinc-800 text-zinc-400 font-medium hover:bg-zinc-800 transition-colors">
              AI Fitness & Nutrition Coach
            </Badge>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 max-w-4xl mx-auto">
              YOUR BODY, <br />
              <span className="text-primary italic">RE-ENGINEERED</span> BY AI.
            </h1>
            <p className="text-zinc-400 text-xl md:text-2xl max-w-2xl mx-auto mb-12 font-medium">
              Personalized Indian diet and workout plans, optimized by advanced RAG technology to match your unique metabolism.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/intake">
                <Button size="lg" className="h-16 px-10 text-xl font-black rounded-xl hover:scale-105 transition-transform">
                  START YOUR INTAKE <ChevronRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
              <a href="#pricing">
                <Button size="lg" variant="secondary" className="h-16 px-10 text-xl font-black rounded-xl border border-white/5 bg-zinc-900/50 backdrop-blur-md hover:bg-zinc-800 transition-colors">
                  VIEW PRICING
                </Button>
              </a>
            </div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section id="features" className="px-8 py-32 bg-zinc-900/30 border-y border-white/5">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="p-8 rounded-3xl bg-black border border-white/5 hover:border-primary/50 transition-colors group">
              <Utensils className="h-12 w-12 text-primary mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold mb-4">Desi Macros</h3>
              <p className="text-zinc-400 leading-relaxed">
                Dal, Paneer, Chicken Curry. No boring salads. AI crafts plans using foods you actually eat at home.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-black border border-white/5 hover:border-primary/50 transition-colors group">
              <Dumbbell className="h-12 w-12 text-primary mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold mb-4">Smart Workouts</h3>
              <p className="text-zinc-400 leading-relaxed">
                Progressive overload calculated by Gemini. Your exercises adapt as you get stronger every week.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-black border border-white/5 hover:border-primary/50 transition-colors group">
              <ShieldCheck className="h-12 w-12 text-primary mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold mb-4">Expert Safety</h3>
              <p className="text-zinc-400 leading-relaxed">
                Our RAG engine cross-references medical guides to ensure your plan is safe and injury-free.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="bg-black py-10">
          <Pricing userId={userId || ""} />
        </section>
      </main>

      <footer className="py-20 border-t border-white/5 text-center bg-zinc-950">
        <div className="flex items-center justify-center gap-2 mb-8 opacity-50 grayscale">
          <div className="h-6 w-6 bg-white rounded flex items-center justify-center">
            <Zap className="h-4 w-4 text-black" fill="currentColor" />
          </div>
          <span className="text-lg font-black tracking-tighter text-white">SWASTHALABS</span>
        </div>
        <p className="text-zinc-500 text-sm">
          © {new Date().getFullYear()} SwasthaLabs AI Fitness & Nutrition. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
