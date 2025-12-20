"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Lock, Timer, CheckCircle, ChefHat, Dumbbell, ShoppingCart, Info, Utensils, Zap, ClipboardList, CreditCard } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isStarterOpen, setIsStarterOpen] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirect=/dashboard");
        return;
      }
      setUser(user);

      // Fetch user status
      const res = await fetch(`/api/user/status?userId=${user.id}`);
      const statusData = await res.json();
      setStatus(statusData);
      setLoading(false);
    }
    init();
  }, [supabase, router]);

  useEffect(() => {
    if (status?.latestPlan && !status.latestPlan.isReleased) {
      const interval = setInterval(() => {
        const now = new Date();
        const release = new Date(status.latestPlan.releaseAt);
        const diff = release.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeLeft("Unlocking...");
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m`);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 min-h-screen">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl bg-muted/50" />
          ))}
        </div>
      </div>
    );
  }

  const starterPlanData = {
    title: "Standard Starter Plan",
    description: "Follow this baseline plan while your AI-personalized version is being generated.",
    diet: [
      { time: "Early Morning", meal: "Warm water with lemon + 5 soaked almonds" },
      { time: "Breakfast", meal: "Moong Dal Chilla or Vegetable Poha + 1 cup Curd" },
      { time: "Mid-Morning", meal: "1 Seasonal fruit (Apple/Papaya)" },
      { time: "Lunch", meal: "2 Rotis + 1 bowl Dal + 1 bowl Seasonal Sabzi + Salad" },
      { time: "Evening", meal: "Roasted Makhana or Roasted Chana + Green Tea" },
      { time: "Dinner", meal: "Paneer Stir Fry or Grilled Chicken with sauteed vegetables" },
    ],
    workout: [
      "10 mins Brisk Walk / Dynamic Stretching",
      "Bodyweight Squats: 3 sets x 15 reps",
      "Push-ups (Knee/Standard): 3 sets x 10 reps",
      "Plank: 3 sets x 45 seconds",
      "Walking Lunges: 3 sets x 12 reps per leg",
    ]
  };

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
              Welcome, <span className="text-primary">{user?.email?.split('@')[0] || "Warrior"}</span>
            </h1>
            <p className="text-muted-foreground">Your AI-powered health journey starts here.</p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="text-muted-foreground hover:text-white"
              onClick={() => supabase.auth.signOut().then(() => router.push("/"))}
            >
              Sign Out
            </Button>
            <Badge variant="outline" className="px-4 py-2 text-md border-primary/50 text-primary bg-primary/10">
              {status?.hasSubscription ? "Active Subscription" : "No Active Subscription"}
            </Badge>
          </div>
        </header>

        <div className="grid gap-8">
          {/* Missing Steps Card */}
          {!status?.hasIntake && (
            <Card className="border-yellow-500/50 bg-yellow-500/10 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <ClipboardList className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <CardTitle className="text-yellow-500 text-xl">Incomplete Intake</CardTitle>
                  <CardDescription className="text-zinc-400">Please fill out your fitness assessment to get your personalized plan.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/intake">
                  <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-12 px-8">
                    Complete Intake Form
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {!status?.hasSubscription && status?.hasIntake && (
            <Card className="border-blue-500/50 bg-blue-500/10 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-blue-500 text-xl">Activation Required</CardTitle>
                  <CardDescription className="text-zinc-400">Choose a subscription plan to unlock your AI Coach and custom routines.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/#pricing">
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white font-bold h-12 px-8">
                    View Pricing Plans
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Plan Section */}
          <AnimatePresence mode="wait">
            {status?.hasSubscription && status?.hasIntake && (
              <>
                {!status?.latestPlan?.isReleased ? (
                  <motion.div
                    key="locked"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="border-primary/20 bg-card/50 backdrop-blur-xl overflow-hidden relative">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-primary"></div>
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-2xl">
                          <Timer className="w-6 h-6 text-primary" />
                          Custom Plan Unlocking In
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                          <div className="text-6xl font-black tracking-tighter text-primary">
                            {timeLeft || "--:--"}
                          </div>
                          <div className="flex-1 max-w-md">
                            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                              <Lock className="w-4 h-4" />
                              Why the delay?
                            </h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                              Our AI Coach is analyzing your intake data and cross-referencing our knowledge base to build a plan that is 100% unique to your body and goals.
                            </p>
                          </div>
                          
                          <Dialog open={isStarterOpen} onOpenChange={setIsStarterOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="h-14 px-8 text-lg font-semibold border-primary/30 hover:bg-primary/10">
                                View Starter Plan
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-950 border-white/10 text-white">
                              <DialogHeader>
                                <DialogTitle className="text-3xl font-black text-primary italic uppercase tracking-tighter flex items-center gap-2">
                                  <Zap className="w-6 h-6 fill-primary text-black" />
                                  Generic Starter Plan
                                </DialogTitle>
                                <DialogDescription className="text-zinc-400 text-lg">
                                  A balanced foundation to get you moving while we finalize your custom roadmap.
                                </DialogDescription>
                              </DialogHeader>

                              <div className="grid md:grid-cols-2 gap-8 py-6">
                                <div className="space-y-4">
                                  <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                    <Utensils className="w-5 h-5 text-primary" /> Baseline Diet
                                  </h3>
                                  <div className="space-y-3">
                                    {starterPlanData.diet.map((item: any, i: number) => (
                                      <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-primary/30 transition-colors">
                                        <p className="text-xs font-bold text-primary uppercase tracking-widest">{item.time}</p>
                                        <p className="text-zinc-200 font-medium">{item.meal}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                    <Dumbbell className="w-5 h-5 text-primary" /> Mobility & Strength
                                  </h3>
                                  <div className="space-y-3">
                                    {starterPlanData.workout.map((item: string, i: number) => (
                                      <div key={i} className="flex gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                                        <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                                          {i + 1}
                                        </div>
                                        <p className="text-zinc-200">{item}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex gap-4 items-start">
                                <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-zinc-300 italic">
                                  <strong>Note:</strong> This is a generic plan. Please ensure you are medically cleared before starting any new fitness regime. Your custom plan will be ready soon!
                                </p>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    key="unlocked"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Tabs defaultValue="diet" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 h-14 bg-muted/30 p-1 mb-6">
                        <TabsTrigger value="diet" className="text-lg gap-2">
                          <ChefHat className="w-5 h-5" /> Diet
                        </TabsTrigger>
                        <TabsTrigger value="workout" className="text-lg gap-2">
                          <Dumbbell className="w-5 h-5" /> Workout
                        </TabsTrigger>
                        <TabsTrigger value="grocery" className="text-lg gap-2">
                          <ShoppingCart className="w-5 h-5" /> Grocery
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="diet">
                        <Card className="bg-muted/10 border-muted">
                          <CardHeader>
                            <CardTitle>Daily Nutrition Plan</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <pre className="text-zinc-300 whitespace-pre-wrap">
                              {JSON.stringify(status.latestPlan.jsonPlan, null, 2)}
                            </pre>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
