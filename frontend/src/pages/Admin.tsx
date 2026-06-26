import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Ban, Check, Eye, FileCheck, Loader2, Search, ShieldCheck, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PdfViewer } from "@/components/PdfViewer";
import { Input } from "@/components/ui/input";

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
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-6"><UsersPanel /></TabsContent>
          <TabsContent value="resources" className="mt-6"><ResourcesPanel /></TabsContent>
          <TabsContent value="opportunities" className="mt-6"><OpportunitiesPanel /></TabsContent>
          <TabsContent value="audit" className="mt-6"><AuditPanel /></TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

const mapBackendUserToProfile = (u: any) => ({
  id: u._id || u.id,
  full_name: u.fullName || "",
  email: u.email || "",
  verified: u.status === 'active',
  is_disabled: u.status === 'disabled',
  is_banned: u.status === 'banned',
  role: u.role || 'student',
});

function UsersPanel() {
  const { user, isSuperAdmin } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/users?limit=100");
      const list = response.data?.data?.users || [];
      setProfiles(list.map(mapBackendUserToProfile));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const canModify = (targetProfile: any) => {
    if (targetProfile.id === user?.id) return false;
    return targetProfile.role !== "admin";
  };

  const setVerified = async (target: any, v: boolean) => {
    if (!canModify(target)) { toast.error("Unauthorized action."); return; }
    try {
      if (v) {
        await api.patch(`/admin/users/${target.id}/approve`);
      } else {
        await api.patch(`/admin/users/${target.id}/reject`);
      }
      toast.success("Updated");
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update user verification");
    }
  };

  const setDisabled = async (target: any, v: boolean) => {
    if (!canModify(target)) { toast.error("Unauthorized action."); return; }
    try {
      if (v) {
        await api.patch(`/admin/users/${target.id}/reject`);
      } else {
        await api.patch(`/admin/users/${target.id}/approve`);
      }
      toast.success("Updated");
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update user status");
    }
  };

  const setBanned = async (target: any, v: boolean) => {
    if (target.id === user?.id) { toast.error("Unauthorized action."); return; }
    try {
      if (v) {
        await api.patch(`/admin/users/${target.id}/ban`);
      } else {
        await api.patch(`/admin/users/${target.id}/unban`);
      }
      toast.success("Updated");
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update user ban status");
    }
  };

  const setRole = async (uid: string, role: string) => {
    try {
      await api.patch(`/admin/users/${uid}/role`, { role });
      toast.success("Role updated");
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="py-10 grid place-items-center"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
          className="pl-9" 
          placeholder="Search users by name or email..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="space-y-3">
        {filteredProfiles.map((p) => {
        const role = p.role;
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
              {role !== "student" && <Badge variant="outline">{role}</Badge>}
            </div>
            {isSuperAdmin && p.id !== user?.id && (
              <div className="flex gap-1.5">
                <Select value={role} onValueChange={(v) => setRole(p.id, v)}>
                  <SelectTrigger className="h-8 w-36"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">student</SelectItem>
                    <SelectItem value="faculty">faculty</SelectItem>
                    <SelectItem value="contributor">contributor</SelectItem>
                    <SelectItem value="alumni">alumni</SelectItem>
                    <SelectItem value="admin">admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-1">
              {p.id !== user?.id && canModify(p) && (
                <>
                  {!p.verified && (
                    <Button size="sm" variant="outline" onClick={() => setVerified(p, true)}>
                      Verify
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setDisabled(p, !p.is_disabled)}>
                    {p.is_disabled ? "Enable" : "Disable"}
                  </Button>
                </>
              )}
              {isSuperAdmin && p.id !== user?.id && (
                <Button size="sm" variant="destructive" onClick={() => setBanned(p, !p.is_banned)}>
                  <Ban className="h-3 w-3"/> {p.is_banned ? "Unban" : "Ban"}
                </Button>
              )}
            </div>
          </Card>
        );
      })}
      </div>
    </div>
  );
}

function ResourcesPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const [preview, setPreview] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      let list: any[] = [];
      if (filter === "pending" || filter === "rejected" || filter === "all") {
        const statusVal = filter === "all" ? undefined : filter;
        const resReqs = await api.get(`/resource-requests?limit=100${statusVal ? `&status=${statusVal}` : ""}`);
        const reqList = resReqs.data?.data?.requests || [];
        list = list.concat(reqList.map((r: any) => ({ ...r, id: r._id, isRequest: true })));
      }
      if (filter === "approved" || filter === "all") {
        const resDocs = await api.get("/resources?limit=100");
        const docList = resDocs.data?.data?.resources || [];
        list = list.concat(docList.map((r: any) => ({ ...r, id: r._id, status: "approved", isRequest: false })));
      }
      // Sort list by date
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setItems(list);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load resources");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [filter]);

  const setStatus = async (it: any, status: "approved"|"rejected") => {
    try {
      if (status === "approved") {
        await api.patch(`/resource-requests/${it.id}/approve`);
      } else {
        await api.patch(`/resource-requests/${it.id}/reject`);
      }
      toast.success("Updated");
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update request");
    }
  };

  const remove = async (it: any) => {
    if (!confirm("Delete?")) return;
    try {
      if (it.isRequest) {
        await api.patch(`/resource-requests/${it.id}/reject`);
      } else {
        await api.delete(`/resources/${it.id}`);
      }
      toast.success("Deleted");
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete");
    }
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
                <p className="text-xs text-muted-foreground capitalize">
                  {r.category?.replace('_', ' ')} · {(r.file?.fileSize / 1024 / 1024).toFixed(2)} MB · {r.file?.fileType?.toUpperCase()}
                </p>
              </div>
              <Badge variant={r.status==="approved"?"default":r.status==="rejected"?"destructive":"outline"}>{r.status}</Badge>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => setPreview(r)} title="Preview">
                  <Eye className="h-3 w-3"/>
                </Button>
                {r.status === "pending" && <>
                  <Button size="sm" variant="hero" onClick={()=>setStatus(r,"approved")}><Check className="h-3 w-3"/></Button>
                  <Button size="sm" variant="outline" onClick={()=>setStatus(r,"rejected")}><X className="h-3 w-3"/></Button>
                </>}
                <Button size="sm" variant="destructive" onClick={()=>remove(r)}><Trash2 className="h-3 w-3"/></Button>
              </div>
            </Card>
          ))}
          {items.length===0 && <Card className="p-8 text-center text-muted-foreground">Nothing here.</Card>}
        </div>}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Preview: {preview?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 bg-muted/20">
            {preview && (
              <PdfViewer url={preview.file?.secureUrl} />
            )}
          </div>
          <div className="p-4 border-t flex justify-end gap-2 bg-background">
            {preview?.status === "pending" && (
              <>
                <Button variant="hero" onClick={() => { setStatus(preview, "approved"); setPreview(null); }}>Approve</Button>
                <Button variant="outline" onClick={() => { setStatus(preview, "rejected"); setPreview(null); }}>Reject</Button>
              </>
            )}
            <Button variant="ghost" onClick={() => setPreview(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AuditPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const response = await api.get("/admin/audit-logs?limit=100");
        setItems(response.data?.data?.logs || []);
      } catch (error) {
        console.error("Failed to load audit logs:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="py-10 grid place-items-center"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="space-y-3">
      {items.map((a) => {
        const adminStr = a.actorId ? (a.actorId.fullName || a.actorId.email) : "Unknown Admin";
        
        return (
          <Card key={a._id || a.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <FileCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold capitalize">{a.action?.replace(/_/g, " ")}</p>
                <div className="text-xs text-muted-foreground flex flex-col gap-0.5">
                  <span><strong className="font-medium text-foreground">Details:</strong> {a.details || "—"}</span>
                  <span><strong className="font-medium text-foreground">By Admin:</strong> {adminStr}</span>
                </div>
              </div>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap bg-secondary/50 px-2 py-1 rounded-md self-start md:self-auto">
              {formatDistanceToNow(new Date(a.createdAt || a.created_at), { addSuffix: true })}
            </span>
          </Card>
        );
      })}
      {items.length === 0 && <Card className="p-8 text-center text-muted-foreground">No actions logged.</Card>}
    </div>
  );
}

function OpportunitiesPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");

  const load = async () => {
    setLoading(true);
    try {
      let list: any[] = [];
      if (filter === "pending" || filter === "rejected" || filter === "all") {
        const response = await api.get(`/opportunity-requests?limit=100`);
        const reqList = response.data?.data?.opportunities || [];
        list = list.concat(reqList.map((o: any) => ({ ...o, id: o._id, isRequest: true })));
      }
      if (filter === "approved" || filter === "all") {
        const response = await api.get("/opportunities?limit=100");
        const docList = response.data?.data?.opportunities || [];
        list = list.concat(docList.map((o: any) => ({ ...o, id: o._id, approvalStatus: "approved", isRequest: false })));
      }

      if (filter !== "all") {
        list = list.filter(item => (item.approvalStatus || item.status) === filter);
      }

      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setItems(list);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [filter]);

  const setStatus = async (it: any, status: "approved" | "rejected") => {
    try {
      if (status === "approved") {
        await api.patch(`/opportunity-requests/${it.id}/approve`);
      } else {
        await api.patch(`/opportunity-requests/${it.id}/reject`);
      }
      toast.success("Updated");
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update request");
    }
  };

  const remove = async (it: any) => {
    if (!confirm("Delete?")) return;
    try {
      if (it.isRequest && it.approvalStatus === "pending") {
        await api.patch(`/opportunity-requests/${it.id}/reject`);
      } else {
        await api.delete(`/opportunities/${it.id}`);
      }
      toast.success("Deleted");
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {["pending", "approved", "rejected", "all"].map((s) => (
          <Button key={s} size="sm" variant={filter === s ? "hero" : "outline"} onClick={() => setFilter(s)}>{s}</Button>
        ))}
      </div>
      {loading ? <div className="grid place-items-center py-10"><Loader2 className="animate-spin" /></div> :
        <div className="space-y-3">
          {items.map((o) => {
            const studentName = typeof o.createdBy === "object" && o.createdBy !== null ? o.createdBy.fullName : "Unknown User";
            const roleLabel = o.title;
            const companyLabel = o.company || o.conductedBy || "—";
            const approvalStatus = o.approvalStatus || o.status || "approved";
            return (
              <Card key={o.id} className="p-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-semibold">{roleLabel} at {companyLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    Submitted by: <strong className="font-medium text-foreground">@{studentName}</strong> · Type: <span className="capitalize">{o.type}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{o.description}</p>
                </div>
                <Badge variant={approvalStatus === "approved" ? "default" : approvalStatus === "rejected" ? "destructive" : "outline"}>{approvalStatus}</Badge>
                <div className="flex gap-1">
                  {approvalStatus === "pending" && (
                    <>
                      <Button size="sm" variant="hero" onClick={() => setStatus(o, "approved")} title="Approve"><Check className="h-3 w-3" /></Button>
                      <Button size="sm" variant="outline" onClick={() => setStatus(o, "rejected")} title="Reject"><X className="h-3 w-3" /></Button>
                    </>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => remove(o)} title="Delete"><Trash2 className="h-3 w-3" /></Button>
                </div>
              </Card>
            );
          })}
          {items.length === 0 && <Card className="p-8 text-center text-muted-foreground">Nothing here.</Card>}
        </div>}
    </div>
  );
}
