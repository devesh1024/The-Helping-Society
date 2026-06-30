import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { LifeBuoy, Loader2, Lock, MessageCircle, Plus, Send, Siren, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { z } from "zod";

interface Req {
  id: string; author_id: string; subject: string; description: string;
  urgency: "standard"|"emergency"; anonymous: boolean;
  status: "pending"|"approved"|"resolved"; created_at: string;
  author_name?: string;
}
interface Reply { id: string; request_id: string; author_id: string; message: string; created_at: string; }

const schema = z.object({
  subject: z.string().trim().min(3).max(150),
  description: z.string().trim().min(5).max(500, "Description cannot exceed 500 characters"),
});

const mapBackendToReq = (r: any): Req => ({
  id: r._id || r.id,
  author_id: typeof r.ownerId === "object" && r.ownerId ? r.ownerId?._id : r.ownerId,
  author_name: typeof r.ownerId === "object" && r.ownerId ? r.ownerId?.fullName : "",
  subject: r.title,
  description: r.description,
  urgency: r.isEmergency ? "emergency" : "standard",
  anonymous: r.anonymous || false,
  status: r.status,
  created_at: r.createdAt || new Date().toISOString(),
});

const mapBackendToReply = (r: any): Reply => ({
  id: r._id || r.id,
  request_id: r.supportRequestId,
  author_id: typeof r.authorId === "object" ? r.authorId?._id : r.authorId,
  message: r.message,
  created_at: r.createdAt || new Date().toISOString(),
});

export default function Support() {
  const { user, isVerified, isAdmin } = useAuth();
  const [items, setItems] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [openReq, setOpenReq] = useState<Req | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get("/support-requests?limit=100");
      const list = response.data?.data?.posts || [];
      setItems(list.map(mapBackendToReq));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load support requests");
    } finally {
      setLoading(false);
    }
  };
  useEffect(()=>{ load(); }, [isAdmin]);

  return (
    <Layout>
      <div className="container py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold flex items-center gap-3">
              <LifeBuoy className="h-8 w-8 text-primary" /> Support
            </h1>
            <p className="text-muted-foreground mt-1">Ask for help. Medical emergencies go live instantly.</p>
          </div>
          <Button variant="hero" onClick={() => isVerified ? setOpen(true) : toast.error("Verified users only")}>
            <Plus className="h-4 w-4" /> New request
          </Button>
        </div>

        {!isVerified && (
          <Card className="p-4 mb-6 border-secondary/40 bg-secondary/5 flex items-center gap-3 text-sm">
            <Lock className="h-4 w-4 text-secondary" />
            You can see the list, but you'll need to <a href="/profile" className="underline font-medium">get verified</a> to see full descriptions and join discussions.
          </Card>
        )}

        {loading ? (
          <div className="space-y-3">{Array.from({length:4}).map((_,i)=><Card key={i} className="h-24 animate-pulse bg-muted/40"/>)}</div>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">No requests yet.</Card>
        ) : (
          <div className="space-y-8">
            {items.filter(r => r.urgency === "emergency").length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-destructive"><Siren className="h-5 w-5"/> Emergency Queue</h2>
                <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
                  {items.filter(r => r.urgency === "emergency").map(r => (
                    <Card key={r.id} onClick={() => isVerified ? setOpenReq(r) : toast.error("Get verified to see details")}
                      className="p-5 cursor-pointer hover:shadow-elegant transition-smooth border-destructive/40 bg-destructive/5 min-w-[300px] sm:min-w-[400px] snap-start flex-shrink-0">
                      {(!r.anonymous || isAdmin || r.author_id === user?.id) && r.author_name && (
                        <p className="text-xs font-semibold text-destructive/80 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                          {r.author_name}
                        </p>
                      )}
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-destructive text-destructive-foreground"><Siren className="h-3 w-3 mr-1"/> Emergency</Badge>
                            <Badge variant={r.status === "resolved" ? "secondary" : r.status === "approved" ? "default" : "outline"}>{r.status}</Badge>
                            {r.anonymous && (isAdmin || r.author_id === user?.id) && <Badge variant="outline">Anonymous</Badge>}
                          </div>
                          <h3 className="font-display font-semibold text-lg mt-2 line-clamp-1">
                            {r.anonymous && !isAdmin && r.author_id !== user?.id ? "Anonymous request" : r.subject}
                          </h3>
                          {!(r.anonymous && !isAdmin && r.author_id !== user?.id) && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{r.description}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {items.filter(r => r.urgency !== "emergency").length > 0 && (
              <div className="space-y-3">
                {items.filter(r => r.urgency === "emergency").length > 0 && <h2 className="text-xl font-semibold mb-4 text-foreground/80">Standard Requests</h2>}
                <div className="space-y-3">
                  {items.filter(r => r.urgency !== "emergency").map(r => (
                    <Card key={r.id} onClick={() => isVerified ? setOpenReq(r) : toast.error("Get verified to see details")}
                      className="p-5 cursor-pointer hover:shadow-elegant transition-smooth">
                      {(!r.anonymous || isAdmin || r.author_id === user?.id) && r.author_name && (
                        <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                          {r.author_name}
                        </p>
                      )}
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={r.status === "resolved" ? "secondary" : r.status === "approved" ? "default" : "outline"}>{r.status}</Badge>
                            {r.anonymous && (isAdmin || r.author_id === user?.id) && <Badge variant="outline">Anonymous</Badge>}
                          </div>
                          <h3 className="font-display font-semibold text-lg mt-2">
                            {r.anonymous && !isAdmin && r.author_id !== user?.id ? "Anonymous request" : r.subject}
                          </h3>
                          {!(r.anonymous && !isAdmin && r.author_id !== user?.id) && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{r.description}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <CreateDialog open={open} onOpenChange={setOpen} onCreated={load} />
      {openReq && <ReqDialog req={openReq} onClose={()=>{ setOpenReq(null); load(); }} />}
    </Layout>
  );
}

function CreateDialog({ open, onOpenChange, onCreated }: { open:boolean; onOpenChange:(v:boolean)=>void; onCreated:()=>void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ subject:"", description:"" });
  const [emergency, setEmergency] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    try {
      await api.post("/support-requests", {
        title: parsed.data.subject,
        description: parsed.data.description,
        isEmergency: emergency,
        anonymous,
        contactNumber: user?.mobile_number || "9999999999",
        location: "Campus"
      });

      toast.success("Request submitted");
      onOpenChange(false);
      setForm({ subject:"", description:"" }); setEmergency(false); setAnonymous(false);
      onCreated();
    } catch (e: any) { 
      toast.error(e.response?.data?.message || e.message || "Failed to submit request"); 
    } finally { 
      setBusy(false); 
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New support request</DialogTitle>
          <DialogDescription className="sr-only">Submit a new support request.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>Subject</Label><Input value={form.subject} onChange={(e)=>setForm({...form,subject:e.target.value})}/></div>
          <div><Label>Describe the issue</Label><Textarea rows={5} value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})}/></div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium flex items-center gap-2"><Siren className="h-4 w-4 text-destructive"/> Medical emergency</p>
              <p className="text-xs text-muted-foreground">Goes live immediately, skips approval.</p>
            </div>
            <Switch checked={emergency} onCheckedChange={setEmergency}/>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Post anonymously</p>
              <p className="text-xs text-muted-foreground">Hidden from peers. Visible only to admins.</p>
            </div>
            <Switch checked={anonymous} onCheckedChange={setAnonymous}/>
          </div>
          <Button variant={emergency ? "destructive" : "hero"} className="w-full" onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin"/> : "Submit request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReqDialog({ req, onClose }: { req: Req; onClose: ()=>void }) {
  const { user, isVerified, isAdmin } = useAuth();
  const [replies, setReplies] = useState<Reply[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const showAuthor = !req.anonymous || isAdmin || req.author_id === user?.id;

  const handleDelete = async () => {
    if (!confirm("Delete this support request?")) return;
    setDeleting(true);
    try {
      await api.delete(`/support-requests/${req.id}`);
      toast.success("Deleted successfully");
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete support request");
    } finally {
      setDeleting(false);
    }
  };

  const load = async () => {
    try {
      const response = await api.get(`/support-requests/${req.id}/replies`);
      const list = response.data?.data?.replies || [];
      setReplies(list.map(mapBackendToReply));
    } catch (err: any) {
      console.error("Failed to load replies:", err);
    }
  };
  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, [req.id]);

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await api.post(`/support-requests/${req.id}/replies`, { message: text.trim() });
      setText(""); 
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to post reply");
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (status: "approved"|"resolved") => {
    try {
      if (status === "approved") {
        await api.patch(`/support-requests/${req.id}/approve`);
      } else {
        await api.patch(`/support-requests/${req.id}/resolve`);
      }
      toast.success("Updated"); 
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  return (
    <Dialog open onOpenChange={(o)=>!o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{showAuthor ? req.subject : "Anonymous request"}</DialogTitle>
          <DialogDescription className="sr-only">Support request details.</DialogDescription>
        </DialogHeader>
        {showAuthor && req.author_name && (
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center text-xs font-semibold">
              {req.author_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold">{req.author_name}</p>
              <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}</p>
            </div>
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          {req.urgency==="emergency" && <Badge className="bg-destructive text-destructive-foreground"><Siren className="h-3 w-3 mr-1"/>Emergency</Badge>}
          <Badge>{req.status}</Badge>
        </div>
        {showAuthor && <p className="text-sm whitespace-pre-wrap">{req.description}</p>}
        <div className="flex gap-2 flex-wrap">
          {isAdmin && req.status !== "resolved" && (
            <>
              {req.status === "pending" && <Button size="sm" variant="hero" onClick={()=>setStatus("approved")}>Approve</Button>}
              <Button size="sm" variant="outline" onClick={()=>setStatus("resolved")}>Mark resolved</Button>
            </>
          )}
          {(req.author_id === user?.id || isAdmin) && (
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin"/> : <><Trash2 className="h-4 w-4 mr-1" /> Delete</>}
            </Button>
          )}
        </div>
        <div className="border-t border-border pt-4 mt-2">
          <p className="font-semibold text-sm mb-2 flex items-center gap-2"><MessageCircle className="h-4 w-4"/> Replies ({replies.length})</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {replies.map((r)=>(
              <div key={r.id} className="bg-muted/50 rounded-lg p-3 text-sm">
                <p>{r.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</p>
              </div>
            ))}
          </div>
          {isVerified && (
            <div className="flex gap-2 mt-3">
              <Input value={text} onChange={(e)=>setText(e.target.value)} placeholder="Write a reply…" onKeyDown={(e)=>e.key==="Enter"&&send()}/>
              <Button onClick={send} disabled={busy}><Send className="h-4 w-4"/></Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
