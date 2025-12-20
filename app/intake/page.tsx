"use client";

import { Widget } from "@typeform/embed-react";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function IntakePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const formId = process.env.NEXT_PUBLIC_TYPEFORM_FORM_ID;
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirect=/intake");
        return;
      }
      setUser(user);
      setLoading(false);
    }
    getUser();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-screen bg-background"
    >
      <Widget
        id={formId || ""}
        style={{ width: "100%", height: "100%" }}
        className="my-form"
        hidden={{
          user_id: user.id,
          email: user.email,
        }}
      />
    </motion.div>
  );
}
