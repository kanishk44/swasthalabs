"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClientComponentClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);

    // Check if user is already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const redirectTo = searchParams.get("redirect") || "/dashboard";
        router.push(redirectTo);
      }
    });

    // Listen for auth state changes to handle successful login
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          const redirectTo = searchParams.get("redirect") || "/dashboard";
          router.push(redirectTo);
          router.refresh();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, searchParams, router]);

  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const finalRedirect = origin ? `${origin}${redirectTo}` : "";

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="h-6 w-6 text-black" fill="currentColor" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white">SWASTHALABS</span>
        </div>

        <Card className="border-white/5 bg-zinc-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-center text-xl">Welcome Back</CardTitle>
          </CardHeader>
          <CardContent>
            <Auth
              supabaseClient={supabase}
              view="sign_in"
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: 'oklch(0.922 0 0)',
                      brandAccent: 'oklch(0.8 0 0)',
                      inputBackground: 'transparent',
                      inputText: 'white',
                      inputBorder: 'rgba(255, 255, 255, 0.1)',
                      inputPlaceholder: '#666',
                    },
                  },
                },
              }}
              providers={["google"]}
              redirectTo={finalRedirect}
              theme="dark"
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
