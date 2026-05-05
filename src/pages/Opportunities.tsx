import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Briefcase, Calendar, ExternalLink, Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

interface Opportunity {
  id: string; company: string; role: string; description: string; apply_url: string;
  category: string; type: string; location: string | null; deadline: string | null;
  status: "open" | "closed"; created_at: string; created_by: string;
}

const schema = z.object({
  company: z.string().trim().min(1).max(100),
  role: z.string().trim().min(1).max(100),
  description: z.string().trim().min(5).max(2000),
  apply_url: z.string().trim().url().max(500),
  category: z.string().trim().min(1).max(40),
  type: z.string().trim().min(1).max(40),
  location: z.string().trim().max(80).optional(),
  deadline: z.string().optional(),
});

export default function Opportunities() {
  const { isKhabri, isAdmin, user } = useAuth();
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("opportunities").select("*").order("created_at", { ascending: false });
    setItems((data as Opportunity[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this opportunity?")) return;
    const { error } = await supabase.from("opportunities").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  return (
    <Layout>
      <div className="container py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-primary" /> Opportunities
            </h1>
            <p className="text-muted-foreground mt-1">Curated jobs, internships and contests, posted by Khabri admins.</p>
          </div>
          {(isKhabri && isAdmin) && (
            <Button variant="hero" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Post opportunity</Button>
          )}
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">{Array.from({length:4}).map((_,i)=><Card key={i} className="p-5 h-40 animate-pulse bg-muted/40"/>)}</div>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">No opportunities yet.</Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {items.map((o) => (
              <Card key={o.id} className="p-6 hover:shadow-elegant transition-smooth flex flex-col">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-secondary font-medium">{o.category} · {o.type}</p>
                    <h3 className="font-display font-bold text-xl mt-1">{o.role}</h3>
                    <p className="text-sm text-muted-foreground">{o.company}</p>
                  </div>
                  <Badge variant={o.status === "open" ? "default" : "secondary"}>{o.status}</Badge>
                </div>
                <p className="text-sm mt-3 line-clamp-3">{o.description}</p>
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                  {o.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {o.location}</span>}
                  {o.deadline && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(o.deadline), "PP")}</span>}
                </div>
                <div className="flex gap-2 mt-auto pt-4">
                  <Button asChild variant="hero" size="sm" className="flex-1">
                    <a href={o.apply_url} target="_blank" rel="noopener noreferrer">Apply <ExternalLink className="h-3.5 w-3.5" /></a>
                  </Button>
                  {(isKhabri && isAdmin && o.created_by === user?.id) || isAdmin ? (
                    <Button variant="outline" size="icon" onClick={() => remove(o.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      <CreateDialog open={open} onOpenChange={setOpen} onCreated={load} />
    </Layout>
  );
}

function CreateDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v:boolean)=>void; onCreated: ()=>void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ company:"", role:"", description:"", apply_url:"", category:"Internship", type:"Full-time", location:"", deadline:"" });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.from("opportunities").insert({
      ...parsed.data,
      location: parsed.data.location || null,
      deadline: parsed.data.deadline || null,
      created_by: user!.id,
    });
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Posted"); onOpenChange(false); onCreated(); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New opportunity</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Company</Label><Input value={form.company} onChange={(e)=>setForm({...form,company:e.target.value})}/></div>
            <div><Label>Role</Label><Input value={form.role} onChange={(e)=>setForm({...form,role:e.target.value})}/></div>
          </div>
          <div><Label>Description</Label><Textarea rows={4} value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})}/></div>
          <div><Label>Apply URL</Label><Input value={form.apply_url} onChange={(e)=>setForm({...form,apply_url:e.target.value})} placeholder="https://..."/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Category</Label><Input value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})}/></div>
            <div><Label>Type</Label><Input value={form.type} onChange={(e)=>setForm({...form,type:e.target.value})}/></div>
            <div><Label>Location</Label><Input value={form.location} onChange={(e)=>setForm({...form,location:e.target.value})}/></div>
            <div><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={(e)=>setForm({...form,deadline:e.target.value})}/></div>
          </div>
          <Button variant="hero" className="w-full" onClick={submit} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin"/> : "Publish"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
