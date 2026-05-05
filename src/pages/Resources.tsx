import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BookOpen, Eye, Heart, Loader2, Lock, Plus, Search, Trash2, Upload, Download } from "lucide-react";
import { PdfViewer } from "@/components/PdfViewer";
import { z } from "zod";
import { FileDropzone } from "@/components/FileDropzone";

interface Resource {
  id: string; uploader_id: string; title: string; subject: string; description: string | null;
  branch: string; year: number; semester: number; file_path: string; file_name: string;
  status: "pending" | "approved" | "rejected"; like_count: number; created_at: string;
}

const PAGE_SIZE = 12;

const resourceSchema = z.object({
  title: z.string().trim().min(2).max(150),
  subject: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  branch: z.string().trim().min(1).max(40),
  semester: z.coerce.number().int().min(1).max(8),
});

export default function Resources() {
  const { user, profile, isVerified } = useAuth();
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [semester, setSemester] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set());
  const [openUpload, setOpenUpload] = useState(false);
  const [viewing, setViewing] = useState<Resource | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  // debounce
  useEffect(() => { const t = setTimeout(() => setDebounced(search), 300); return () => clearTimeout(t); }, [search]);

  // year-based filter
  const accessibleYears = useMemo(() => {
    if (!profile?.year) return [1, 2, 3, 4];
    return Array.from({ length: profile.year }, (_, i) => i + 1);
  }, [profile?.year]);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("resources")
      .select("*", { count: "exact" })
      .eq("status", "approved")
      .in("year", accessibleYears)
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (semester !== "all") q = q.eq("semester", Number(semester));
    if (debounced) q = q.or(`title.ilike.%${debounced}%,subject.ilike.%${debounced}%`);
    const { data, count } = await q;
    setItems((data as Resource[]) ?? []);
    setTotal(count ?? 0);
    setLoading(false);

    if (user && data?.length) {
      const ids = data.map((d: any) => d.id);
      const { data: likes } = await supabase.from("resource_likes").select("resource_id").eq("user_id", user.id).in("resource_id", ids);
      setLikedSet(new Set((likes ?? []).map((l: any) => l.resource_id)));
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [debounced, semester, page, accessibleYears.join(",")]);

  const toggleLike = async (r: Resource) => {
    if (!user || !isVerified) { toast.error("Verified users only"); return; }
    const liked = likedSet.has(r.id);
    // optimistic
    setLikedSet((s) => { const n = new Set(s); liked ? n.delete(r.id) : n.add(r.id); return n; });
    setItems((arr) => arr.map((x) => x.id === r.id ? { ...x, like_count: x.like_count + (liked ? -1 : 1) } : x));
    if (liked) {
      await supabase.from("resource_likes").delete().eq("user_id", user.id).eq("resource_id", r.id);
    } else {
      const { error } = await supabase.from("resource_likes").insert({ user_id: user.id, resource_id: r.id });
      if (error) { load(); toast.error(error.message); }
    }
  };

  const view = async (r: Resource) => {
    if (!isVerified) { toast.error("Get verified to open files"); return; }
    const { data, error } = await supabase.storage.from("resources").createSignedUrl(r.file_path, 3600);
    if (error || !data) { toast.error("Could not load file"); return; }
    const isPdf = r.file_name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      // PPT/PPTX — open download in new tab since browsers can't render natively
      window.open(data.signedUrl, "_blank");
      return;
    }
    setSignedUrl(data.signedUrl);
    setViewing(r);
  };

  const remove = async (r: Resource) => {
    if (!confirm("Delete this resource?")) return;
    await supabase.storage.from("resources").remove([r.file_path]);
    const { error } = await supabase.from("resources").delete().eq("id", r.id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  return (
    <Layout>
      <div className="container py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" /> Resource Hub
            </h1>
            <p className="text-muted-foreground mt-1">Notes, papers and materials shared by your peers.</p>
          </div>
          <Button variant="hero" onClick={() => isVerified ? setOpenUpload(true) : toast.error("Verified users only")}>
            <Plus className="h-4 w-4" /> Upload resource
          </Button>
        </div>

        <Card className="p-4 flex flex-wrap gap-3 items-center mb-6">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search title or subject…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
          </div>
          <Select value={semester} onValueChange={(v) => { setSemester(v); setPage(0); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Semester" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All semesters</SelectItem>
              {[1,2,3,4,5,6,7,8].map((s) => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}
            </SelectContent>
          </Select>
        </Card>

        {!isVerified && (
          <Card className="p-4 mb-6 border-secondary/40 bg-secondary/5 flex items-center gap-3 text-sm">
            <Lock className="h-4 w-4 text-secondary" />
            You can browse listings, but you'll need to <a href="/profile" className="underline font-medium">get verified</a> to open files.
          </Card>
        )}

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-5 animate-pulse h-48 bg-muted/40" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">No resources match your filters.</Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((r) => (
              <Card key={r.id} className="p-5 flex flex-col hover:shadow-elegant transition-smooth">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{r.subject} · Sem {r.semester}</p>
                    <h3 className="font-display font-semibold text-lg leading-snug mt-1">{r.title}</h3>
                  </div>
                  <Badge variant="outline">Y{r.year}</Badge>
                </div>
                {r.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{r.description}</p>}
                <div className="flex items-center justify-between mt-auto pt-4">
                  <button onClick={() => toggleLike(r)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-secondary transition-smooth">
                    <Heart className={`h-4 w-4 ${likedSet.has(r.id) ? "fill-secondary text-secondary" : ""}`} /> {r.like_count}
                  </button>
                  <div className="flex gap-1">
                    {r.uploader_id === user?.id && (
                      <Button variant="ghost" size="icon" onClick={() => remove(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => view(r)}><Eye className="h-4 w-4" /> View</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {page + 1} of {Math.ceil(total / PAGE_SIZE)}</span>
            <Button variant="outline" size="sm" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        )}
      </div>

      <UploadDialog open={openUpload} onOpenChange={setOpenUpload} onUploaded={load} />

      <Dialog open={!!viewing} onOpenChange={(o) => { if (!o) { setViewing(null); setSignedUrl(null); } }}>
        <DialogContent className="max-w-5xl h-[85vh] p-0 flex flex-col">
          <DialogHeader className="px-6 pt-5">
            <DialogTitle>{viewing?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 px-6 pb-6 min-h-0">
            {signedUrl && <PdfViewer url={signedUrl} />}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function UploadDialog({ open, onOpenChange, onUploaded }: { open: boolean; onOpenChange: (v: boolean) => void; onUploaded: () => void }) {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({ title: "", subject: "", description: "", branch: "", semester: "1" });
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const ALLOWED = [
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];

  const submit = async () => {
    const file = files[0];
    if (!user || !file) { toast.error("Please choose a PDF or PPT/PPTX"); return; }
    const ext = file.name.toLowerCase().split(".").pop();
    if (!ALLOWED.includes(file.type) && !["pdf","ppt","pptx"].includes(ext || "")) {
      toast.error("Only PDF or PPT/PPTX files allowed"); return;
    }
    if (file.size > 25 * 1024 * 1024) { toast.error("Max 25MB"); return; }
    const parsed = resourceSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
      const { error: upErr } = await supabase.storage.from("resources").upload(path, file, { contentType: file.type || "application/octet-stream" });
      if (upErr) throw upErr;
      const { error } = await supabase.from("resources").insert({
        uploader_id: user.id,
        title: parsed.data.title,
        subject: parsed.data.subject,
        description: parsed.data.description || null,
        branch: parsed.data.branch,
        year: profile?.year ?? 1,
        semester: parsed.data.semester,
        file_path: path,
        file_name: file.name,
      });
      if (error) throw error;
      toast.success("Submitted for approval");
      onOpenChange(false);
      setForm({ title: "", subject: "", description: "", branch: "", semester: "1" });
      setFiles([]);
      onUploaded();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Upload a resource</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            <div><Label>Branch</Label><Input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} placeholder="e.g. CSE" /></div>
          </div>
          <div>
            <Label>Semester</Label>
            <Select value={form.semester} onValueChange={(v) => setForm({ ...form, semester: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{[1,2,3,4,5,6,7,8].map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Description (optional)</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div>
            <Label>File (PDF or PPT/PPTX — notes accepted)</Label>
            <FileDropzone accept=".pdf,.ppt,.pptx,application/pdf" files={files} onFiles={setFiles} hint="Drag & drop, click, or paste a file (max 25MB)" />
          </div>
          <Button variant="hero" className="w-full" onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-4 w-4" /> Submit for approval</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
