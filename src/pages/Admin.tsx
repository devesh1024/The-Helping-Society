import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Ban, Check, FileCheck, Loader2, ShieldCheck, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Admin() {
  return (
    <Layout>
      <div className="container py-10">
        <h1 className="font-display text-3xl md:text-4xl font-bold flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-secondary" /> Admin Panel
        </h1>
        <p className="text-muted-foreground mt-1">Moderate users, content and support requests.</p>

        <Tabs defaultValue="users" className="mt-8">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-6"><UsersPanel /></TabsContent>
          <TabsContent value="resources" className="mt-6"><ResourcesPanel /></TabsContent>
          <TabsContent value="audit" className="mt-6"><AuditPanel /></TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function UsersPanel() {
  const { user, isSuperAdmin } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, { role: string; admin_type: string | null }[]>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: p } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
    const { data: r } = await supabase.from("user_roles").select("user_id, role, admin_type");
    setProfiles(p ?? []);
    const map: any = {};
    (r ?? []).forEach((row: any) => { (map[row.user_id] ||= []).push(row); });
    setRoles(map);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const log = async (action_type: string, target_id: string, details?: any) => {
    await supabase.from("admin_actions").insert({ admin_id: user!.id, action_type, target_id, details });
  };

  const setVerified = async (id: string, v: boolean) => {
    await supabase.from("profiles").update({ verified: v }).eq("id", id);
    await log(v ? "verify_user" : "unverify_user", id);
    toast.success("Updated"); load();
  };
  const setDisabled = async (id: string, v: boolean) => {
    await supabase.from("profiles").update({ is_disabled: v }).eq("id", id);
    await log(v ? "disable_user" : "enable_user", id);
    toast.success("Updated"); load();
  };
  const setBanned = async (id: string, v: boolean) => {
    if (!isSuperAdmin) { toast.error("Super admin only"); return; }
    await supabase.from("profiles").update({ is_banned: v }).eq("id", id);
    await log(v ? "ban_user" : "unban_user", id);
    toast.success("Updated"); load();
  };

  const setRole = async (uid: string, role: "admin"|"super_admin"|"user", admin_type: string | null) => {
    if (!isSuperAdmin) { toast.error("Super admin only"); return; }
    // remove existing
    await supabase.from("user_roles").delete().eq("user_id", uid);
    await supabase.from("user_roles").insert({ user_id: uid, role: role as any, admin_type: admin_type as any });
    await log("assign_role", uid, { role, admin_type });
    toast.success("Role updated"); load();
  };

  if (loading) return <div className="py-10 grid place-items-center"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="space-y-3">
      {profiles.map((p) => {
        const userRoles = roles[p.id] || [];
        const role = userRoles[0]?.role || "user";
        const at = userRoles[0]?.admin_type || "none";
        return (
          <Card key={p.id} className="p-4 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <p className="font-semibold">{p.full_name || "—"}</p>
              <p className="text-xs text-muted-foreground">{p.email}</p>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {p.verified ? <Badge className="bg-primary text-primary-foreground">Verified</Badge> : <Badge variant="outline">Unverified</Badge>}
              {p.is_disabled && <Badge variant="secondary">Disabled</Badge>}
              {p.is_banned && <Badge className="bg-destructive text-destructive-foreground">Banned</Badge>}
              {role !== "user" && <Badge variant="outline">{role}</Badge>}
            </div>
            {isSuperAdmin && (
              <div className="flex gap-1.5">
                <Select value={role} onValueChange={(v) => setRole(p.id, v as any, v === "user" ? null : (at === "none" ? null : at))}>
                  <SelectTrigger className="h-8 w-32"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">user</SelectItem>
                    <SelectItem value="admin">admin</SelectItem>
                    <SelectItem value="super_admin">super_admin</SelectItem>
                  </SelectContent>
                </Select>
                {(role === "admin" || role === "super_admin") && (
                  <Select value={at} onValueChange={(v) => setRole(p.id, role as any, v === "none" ? null : v)}>
                    <SelectTrigger className="h-8 w-36"><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">no admin type</SelectItem>
                      <SelectItem value="khabri">khabri</SelectItem>
                      <SelectItem value="professor">professor</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => setVerified(p.id, !p.verified)}>
                {p.verified ? "Unverify" : "Verify"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDisabled(p.id, !p.is_disabled)}>
                {p.is_disabled ? "Enable" : "Disable"}
              </Button>
              {isSuperAdmin && (
                <Button size="sm" variant="destructive" onClick={() => setBanned(p.id, !p.is_banned)}>
                  <Ban className="h-3 w-3"/> {p.is_banned ? "Unban" : "Ban"}
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ResourcesPanel() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");

  const load = async () => {
    setLoading(true);
    let q = supabase.from("resources").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter as any);
    const { data } = await q;
    setItems(data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, [filter]);

  const log = async (a: string, t: string) => {
    await supabase.from("admin_actions").insert({ admin_id: user!.id, action_type: a, target_id: t });
  };

  const setStatus = async (id: string, status: "approved"|"rejected") => {
    const { error } = await supabase.from("resources").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { await log("resource_"+status, id); toast.success("Updated"); load(); }
  };
  const remove = async (it: any) => {
    if (!confirm("Delete?")) return;
    await supabase.storage.from("resources").remove([it.file_path]);
    await supabase.from("resources").delete().eq("id", it.id);
    await log("resource_delete", it.id);
    toast.success("Deleted"); load();
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {["pending","approved","rejected","all"].map((s) => (
          <Button key={s} size="sm" variant={filter===s?"hero":"outline"} onClick={()=>setFilter(s)}>{s}</Button>
        ))}
      </div>
      {loading ? <div className="grid place-items-center py-10"><Loader2 className="animate-spin"/></div> :
        <div className="space-y-3">
          {items.map((r) => (
            <Card key={r.id} className="p-4 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <p className="font-semibold">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.subject} · Y{r.year} · Sem {r.semester} · {r.branch}</p>
              </div>
              <Badge variant={r.status==="approved"?"default":r.status==="rejected"?"destructive":"outline"}>{r.status}</Badge>
              <div className="flex gap-1">
                {r.status === "pending" && <>
                  <Button size="sm" variant="hero" onClick={()=>setStatus(r.id,"approved")}><Check className="h-3 w-3"/></Button>
                  <Button size="sm" variant="outline" onClick={()=>setStatus(r.id,"rejected")}><X className="h-3 w-3"/></Button>
                </>}
                <Button size="sm" variant="destructive" onClick={()=>remove(r)}><Trash2 className="h-3 w-3"/></Button>
              </div>
            </Card>
          ))}
          {items.length===0 && <Card className="p-8 text-center text-muted-foreground">Nothing here.</Card>}
        </div>}
    </div>
  );
}

function AuditPanel() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("admin_actions").select("*").order("created_at",{ascending:false}).limit(100)
      .then(({ data }) => setItems(data ?? []));
  }, []);
  return (
    <div className="space-y-2">
      {items.map((a) => (
        <Card key={a.id} className="p-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileCheck className="h-4 w-4 text-primary"/>
            <div>
              <p className="text-sm font-medium">{a.action_type}</p>
              <p className="text-xs text-muted-foreground">target: {a.target_id?.slice(0,8) || "—"}</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(a.created_at),{addSuffix:true})}</span>
        </Card>
      ))}
      {items.length===0 && <Card className="p-8 text-center text-muted-foreground">No actions logged.</Card>}
    </div>
  );
}
