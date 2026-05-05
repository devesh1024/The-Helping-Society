import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { LifeBuoy, Loader2, MessageCircle, Plus, Send, Siren } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { z } from "zod";

interface Req {
  id: string; author_id: string; subject: string; description: string;
  urgency: "standard"|"emergency"; anonymous: boolean;
  status: "pending"|"approved"|"resolved"; created_at: string;
}
interface Reply { id: string; request_id: string; author_id: string; message: string; created_at: string; }

const schema = z.object({
  subject: z.string().trim().min(3).max(150),
  description: z.string().trim().min(5).max(2000),
});

export default function Support() {
  const { user, isVerified, isAdmin } = useAuth();
  const [items, setItems] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [openReq, setOpenReq] = useState<Req | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("support_requests").select("*").order("created_at", { ascending: false });
    setItems((data as Req[]) ?? []); setLoading(false);
  };
  useEffect(()=>{ load(); }, []);

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

        {loading ? (
          <div className="space-y-3">{Array.from({length:4}).map((_,i)=><Card key={i} className="h-24 animate-pulse bg-muted/40"/>)}</div>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">No requests yet.</Card>
        ) : (
          <div className="space-y-3">
            {items.map((r) => (
              <Card key={r.id}
                onClick={() => setOpenReq(r)}
                className={`p-5 cursor-pointer hover:shadow-elegant transition-smooth ${r.urgency === "emergency" ? "border-destructive/40 bg-destructive/5" : ""}`}>
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {r.urgency === "emergency" && <Badge className="bg-destructive text-destructive-foreground"><Siren className="h-3 w-3 mr-1"/> Emergency</Badge>}
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
    const { error } = await supabase.from("support_requests").insert({
      author_id: user!.id,
      subject: parsed.data.subject,
      description: parsed.data.description,
      urgency: emergency ? "emergency" : "standard",
      anonymous,
    });
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Submitted"); onOpenChange(false); onCreated();
      setForm({ subject:"", description:"" }); setEmergency(false); setAnonymous(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New support request</DialogTitle></DialogHeader>
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
  const showAuthor = !req.anonymous || isAdmin || req.author_id === user?.id;

  const load = async () => {
    const { data } = await supabase.from("support_replies").select("*").eq("request_id", req.id).order("created_at");
    setReplies((data as Reply[]) ?? []);
  };
  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, [req.id]);

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("support_replies").insert({ request_id: req.id, author_id: user!.id, message: text.trim() });
    setBusy(false);
    if (error) toast.error(error.message); else { setText(""); load(); }
  };

  const setStatus = async (status: "approved"|"resolved") => {
    const { error } = await supabase.from("support_requests").update({ status }).eq("id", req.id);
    if (error) toast.error(error.message); else { toast.success("Updated"); onClose(); }
  };

  return (
    <Dialog open onOpenChange={(o)=>!o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{showAuthor ? req.subject : "Anonymous request"}</DialogTitle></DialogHeader>
        <div className="flex gap-2 flex-wrap">
          {req.urgency==="emergency" && <Badge className="bg-destructive text-destructive-foreground"><Siren className="h-3 w-3 mr-1"/>Emergency</Badge>}
          <Badge>{req.status}</Badge>
        </div>
        {showAuthor && <p className="text-sm whitespace-pre-wrap">{req.description}</p>}
        {isAdmin && req.status !== "resolved" && (
          <div className="flex gap-2">
            {req.status === "pending" && <Button size="sm" variant="hero" onClick={()=>setStatus("approved")}>Approve</Button>}
            <Button size="sm" variant="outline" onClick={()=>setStatus("resolved")}>Mark resolved</Button>
          </div>
        )}
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
