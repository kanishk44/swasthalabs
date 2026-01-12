"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  FileText,
  Activity,
  Database,
  Unlock,
  Trash2,
  RefreshCcw,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Plus,
  AlertTriangle,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { createClientComponentClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [newAsset, setNewAsset] = useState({ title: "", bucketPath: "" });
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin");
      if (res.status === 401 || res.status === 403) {
        setAuthorized(false);
        return;
      }
      const result = await res.json();
      setData(result);
      setAuthorized(true);
    } catch (error) {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirect=/admin");
        return;
      }
      fetchAdminData();
    }
    checkAdmin();
  }, [supabase, router]);

  const handlePlanAction = async (versionId: string, action: string) => {
    try {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId, action }),
      });
      if (res.ok) {
        toast.success(`Plan ${action}ed successfully`);
        fetchAdminData();
      }
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const handleIngest = async (fileAssetId: string) => {
    toast.info("Ingestion started...");
    try {
      const res = await fetch("/api/admin/ingest-guides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileAssetId }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message);
        fetchAdminData();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Ingestion failed");
    }
  };

  const handleAddAsset = async () => {
    if (!newAsset.title || !newAsset.bucketPath) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const res = await fetch("/api/admin/file-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAsset),
      });
      if (res.ok) {
        toast.success("Document added to knowledge base");
        setIsAddAssetOpen(false);
        setNewAsset({ title: "", bucketPath: "" });
        fetchAdminData();
      } else {
        const err = await res.json();
        toast.error(err.error);
      }
    } catch (error) {
      toast.error("Failed to add document");
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (
      !confirm(
        "Are you sure? This will remove the document from the knowledge base."
      )
    )
      return;

    try {
      const res = await fetch("/api/admin/file-assets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success("Document removed");
        fetchAdminData();
      }
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  if (authorized === false) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <Lock className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-zinc-500 text-center max-w-sm mb-8">
          You do not have the required permissions to access the Admin Terminal.
        </p>
        <Button onClick={() => router.push("/dashboard")}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  if (loading && !data)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <RefreshCcw className="h-8 w-8 text-primary animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <header className="flex justify-between items-center mb-12">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <h1 className="text-4xl font-black tracking-tighter uppercase italic text-primary">
              Admin Terminal
            </h1>
          </div>
          <p className="text-zinc-500">System Monitoring & Manual Overrides</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" size="sm" onClick={fetchAdminData}>
            <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
          >
            User View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <Card className="bg-zinc-900/50 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 uppercase">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.users?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 uppercase">
              Pending Plans
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data?.pendingPlans?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 uppercase">
              Failed Webhooks
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">
              {data?.troubledWebhooks?.filter((w: any) => w.status === "FAILED")
                .length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 uppercase">
              Active Guides
            </CardTitle>
            <Database className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data?.fileAssets?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList className="bg-zinc-900/50 border border-white/5 p-1">
          <TabsTrigger value="plans">Pending Plans</TabsTrigger>
          <TabsTrigger value="users">User Directory</TabsTrigger>
          <TabsTrigger value="rag">RAG Knowledge</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <Card className="bg-zinc-900/50 border-white/5">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-zinc-400 uppercase text-xs">
                    User
                  </TableHead>
                  <TableHead className="text-zinc-400 uppercase text-xs">
                    Generated At
                  </TableHead>
                  <TableHead className="text-zinc-400 uppercase text-xs">
                    Release At
                  </TableHead>
                  <TableHead className="text-zinc-400 uppercase text-xs text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.pendingPlans?.map((version: any) => (
                  <TableRow
                    key={version.id}
                    className="border-white/5 hover:bg-white/5"
                  >
                    <TableCell className="font-medium">
                      {version.plan.user.email}
                    </TableCell>
                    <TableCell>
                      {format(new Date(version.createdAt), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell className="text-blue-500 font-bold">
                      {format(new Date(version.releaseAt), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-primary/20 text-primary hover:bg-primary/10"
                        onClick={() => handlePlanAction(version.id, "unlock")}
                      >
                        <Unlock className="h-3.5 w-3.5 mr-1" /> Unlock Now
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => handlePlanAction(version.id, "delete")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {data?.pendingPlans?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-10 text-zinc-500"
                    >
                      No pending plans found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="bg-zinc-900/50 border-white/5">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-zinc-400 uppercase text-xs">
                    User
                  </TableHead>
                  <TableHead className="text-zinc-400 uppercase text-xs">
                    Subscription
                  </TableHead>
                  <TableHead className="text-zinc-400 uppercase text-xs">
                    Joined
                  </TableHead>
                  <TableHead className="text-zinc-400 uppercase text-xs text-right">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.users?.map((user: any) => (
                  <TableRow
                    key={user.id}
                    className="border-white/5 hover:bg-white/5"
                  >
                    <TableCell>
                      <div className="font-bold">
                        {user.profile?.name || "Unknown User"}
                      </div>
                      <div className="text-xs text-zinc-500">{user.email}</div>
                    </TableCell>
                    <TableCell>
                      {user.subscriptions[0] ? (
                        <Badge
                          variant="outline"
                          className="border-green-500/50 text-green-500 bg-green-500/10 uppercase text-[10px]"
                        >
                          {user.subscriptions[0].planType}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-zinc-700 text-zinc-500 uppercase text-[10px]"
                        >
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        className={
                          user.role === "ADMIN"
                            ? "bg-primary text-black"
                            : "bg-zinc-800"
                        }
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="rag">
          <div className="flex justify-end mb-4">
            <Dialog open={isAddAssetOpen} onOpenChange={setIsAddAssetOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-black font-bold h-10 px-6">
                  <Plus className="h-4 w-4 mr-2" /> Add Document
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle>Register New PDF Guide</DialogTitle>
                  <DialogDescription className="text-zinc-400">
                    Enter the details of the PDF you uploaded to Supabase
                    Storage.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Document Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g. Vegetarian Nutrition Guide"
                      className="bg-white/5 border-white/10"
                      value={newAsset.title}
                      onChange={(e) =>
                        setNewAsset({ ...newAsset, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="path">Bucket Path (Filename)</Label>
                    <Input
                      id="path"
                      placeholder="e.g. veg-guide.pdf"
                      className="bg-white/5 border-white/10"
                      value={newAsset.bucketPath}
                      onChange={(e) =>
                        setNewAsset({ ...newAsset, bucketPath: e.target.value })
                      }
                    />
                    <p className="text-[10px] text-zinc-500 italic">
                      Make sure this exact file exists in your Supabase 'guides'
                      bucket.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setIsAddAssetOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-primary text-black font-bold"
                    onClick={handleAddAsset}
                  >
                    Register Document
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-zinc-900/50 border-white/5 p-6">
            {data?.fileAssets?.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                <Database className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-1">Knowledge Base Empty</h3>
                <p className="text-zinc-500 text-sm max-w-xs mx-auto mb-6">
                  You haven't registered any PDF guides yet. Add documents to
                  enable AI retrieval.
                </p>
                <Button
                  variant="outline"
                  className="border-white/10"
                  onClick={() => setIsAddAssetOpen(true)}
                >
                  Add Your First Document
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.fileAssets?.map((asset: any) => (
                  <div
                    key={asset.id}
                    className="p-4 rounded-xl bg-black border border-white/5 space-y-4 group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => handleDeleteAsset(asset.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex justify-between items-start pr-8">
                      <h3 className="font-bold text-lg leading-tight">
                        {asset.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-primary/5 text-primary border-primary/20"
                      >
                        v{asset.version}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                      <ExternalLink className="h-3 w-3" /> {asset.bucketPath}
                    </div>
                    <div className="flex items-center gap-4 pt-2 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        {asset.chunkCount || 0} chunks
                      </span>
                      {asset.checksum && (
                        <span
                          className="font-mono text-[10px] text-zinc-600 truncate max-w-[120px]"
                          title={asset.checksum}
                        >
                          SHA: {asset.checksum.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-zinc-500">
                        {asset.ingestedAt
                          ? `Ingested: ${format(
                              new Date(asset.ingestedAt),
                              "MMM d"
                            )}`
                          : "Not Ingested"}
                      </span>
                      <Button
                        size="sm"
                        variant={asset.ingestedAt ? "secondary" : "default"}
                        className="h-8 text-xs font-bold px-4"
                        onClick={() => handleIngest(asset.id)}
                      >
                        {asset.ingestedAt ? "Re-Ingest" : "Ingest Now"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card className="bg-zinc-900/50 border-white/5">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-zinc-400 uppercase text-xs">
                    Event ID
                  </TableHead>
                  <TableHead className="text-zinc-400 uppercase text-xs">
                    Source
                  </TableHead>
                  <TableHead className="text-zinc-400 uppercase text-xs">
                    Attempts
                  </TableHead>
                  <TableHead className="text-zinc-400 uppercase text-xs text-right">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.troubledWebhooks?.map((webhook: any) => (
                  <TableRow
                    key={webhook.id}
                    className="border-white/5 hover:bg-white/5"
                  >
                    <TableCell className="font-mono text-xs text-zinc-400">
                      {webhook.event_id}
                    </TableCell>
                    <TableCell className="uppercase text-xs font-bold tracking-widest">
                      {webhook.source}
                    </TableCell>
                    <TableCell>{webhook.attemptCount}/5</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        className={
                          webhook.status === "FAILED"
                            ? "bg-red-500/20 text-red-500"
                            : "bg-yellow-500/20 text-yellow-500"
                        }
                      >
                        {webhook.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {data?.troubledWebhooks?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-10 text-zinc-500"
                    >
                      No active webhook alerts
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
