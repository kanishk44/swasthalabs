"use client";

import { useChat } from "ai/react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirect=/chat");
        return;
      }
      setUser(user);
      setLoading(false);
    }
    getUser();
  }, [supabase, router]);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    body: { userId: user?.id },
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground max-w-4xl mx-auto border-x border-white/5">
      <header className="p-4 border-b border-white/5 bg-card/30 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary">MM</AvatarFallback>
            <AvatarImage src="/coach-avatar.png" />
          </Avatar>
          <div>
            <h1 className="font-bold text-lg leading-none">MasalaMacros AI</h1>
            <span className="text-xs text-green-500 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              AI Coach Online
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => router.push("/dashboard")}>
            <span className="sr-only">Dashboard</span>
            <Sparkles className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => supabase.auth.signOut().then(() => router.push("/"))}>
            Sign Out
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-6">
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="inline-block p-4 rounded-full bg-primary/5 mb-4">
                  <Bot className="h-12 w-12 text-primary/40" />
                </div>
                <h2 className="text-xl font-semibold mb-2">How can I help you today?</h2>
                <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                  Ask me about your meal swaps, workout modifications, or progress tracking.
                </p>
              </motion.div>
            )}
            
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: m.role === "user" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className={m.role === "user" ? "bg-muted" : "bg-primary/20"}>
                    {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground font-medium"
                      : "bg-muted/50 border border-white/5"
                  }`}
                >
                  {m.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>

      <footer className="p-4 border-t border-white/5 bg-card/30 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="flex gap-2 relative">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="h-12 bg-muted/50 border-white/5 pr-12 focus-visible:ring-primary/50"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="icon"
            className="absolute right-1 top-1 h-10 w-10 bg-primary hover:bg-primary/90 rounded-lg transition-all"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
        <p className="text-[10px] text-center mt-3 text-muted-foreground uppercase tracking-widest font-medium opacity-50">
          SwasthaLabs AI Assistant • Powered by Gemini
        </p>
      </footer>
    </div>
  );
}
