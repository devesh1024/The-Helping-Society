import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Heart, Loader2, MessageCircle, Plus, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { z } from "zod";
import { FileDropzone } from "@/components/FileDropzone";

const cats = [
  { v: "lost_found", label: "Lost & Found" },
  { v: "rooms", label: "Rooms" },
  { v: "marketplace", label: "Marketplace" },
] as const;

interface Post {
  id: string; author_id: string; category: "lost_found"|"rooms"|"marketplace";
  title: string; content: string; tags: string[]; price: number | null; images: string[];
  metadata?: Record<string, string>;
  created_at: string;
}
interface Reply { id: string; post_id: string; author_id: string; content: string; created_at: string; }

const schema = z.object({
  title: z.string().trim().min(2).max(150),
  content: z.string().trim().min(2).max(2000),
});

export default function Community() {
  const { user, isVerified, isAdmin } = useAuth();
  const [tab, setTab] = useState<"lost_found"|"rooms"|"marketplace">("lost_found");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [openPost, setOpenPost] = useState<Post | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("community_posts").select("*").eq("category", tab).order("created_at", { ascending: false });
    setPosts((data as Post[]) ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, [tab]);

  const remove = async (p: Post) => {
    if (!confirm("Delete post?")) return;
    if (p.images?.length) await supabase.storage.from("community-images").remove(p.images);
    await supabase.from("community_posts").delete().eq("id", p.id);
    toast.success("Deleted"); load();
  };

  return (
    <Layout>
      <div className="container py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold flex items-center gap-3">
              <Heart className="h-8 w-8 text-primary" /> Community Hub
            </h1>
            <p className="text-muted-foreground mt-1">Talk to verified people on campus.</p>
          </div>
          <Button variant="hero" onClick={() => isVerified ? setOpenCreate(true) : toast.error("Verified users only")}>
            <Plus className="h-4 w-4" /> New post
          </Button>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mb-6">
          <TabsList>
            {cats.map((c) => <TabsTrigger key={c.v} value={c.v}>{c.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">{Array.from({length:4}).map((_,i)=><Card key={i} className="h-40 animate-pulse bg-muted/40"/>)}</div>
        ) : posts.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">Nothing here yet. Be the first.</Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {posts.map((p) => (
              <Card key={p.id} className="p-5 hover:shadow-elegant transition-smooth cursor-pointer" onClick={() => setOpenPost(p)}>
                {p.images?.[0] && (
                  <img src={supabase.storage.from("community-images").getPublicUrl(p.images[0]).data.publicUrl}
                       alt="" className="rounded-lg w-full h-44 object-cover mb-3" />
                )}
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-display font-semibold text-lg leading-snug">{p.title}</h3>
                  {(p.price != null || p.metadata?.price != null || p.metadata?.rent != null) && (
                    <Badge className="bg-secondary text-secondary-foreground">
                      {p.metadata?.rent ? p.metadata.rent : `₹${p.metadata?.price || p.price}`}
                    </Badge>
                  )}
                </div>
                {p.metadata?.location && <p className="text-xs text-muted-foreground mt-1">📍 {p.metadata.location} · 🛏️ {p.metadata.room_type}</p>}
                {p.metadata?.time_used && <p className="text-xs text-muted-foreground mt-1">⏳ Used: {p.metadata.time_used}</p>}
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.content}</p>
                <div className="flex justify-between mt-3 text-xs text-muted-foreground">
                  <span>{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                  {(p.author_id === user?.id || isAdmin) && (
                    <button onClick={(e) => { e.stopPropagation(); remove(p); }} className="text-destructive hover:underline flex items-center gap-1">
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateDialog open={openCreate} onOpenChange={setOpenCreate} category={tab} onCreated={load} />
      {openPost && <PostDialog post={openPost} onClose={() => setOpenPost(null)} />}
    </Layout>
  );
}

function CreateDialog({ open, onOpenChange, category, onCreated }:
  { open:boolean; onOpenChange:(v:boolean)=>void; category:"lost_found"|"rooms"|"marketplace"; onCreated:()=>void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ 
    title:"", content:"", price:"",
    room_type: "", room_type_other: "", allowed_for: "", contact_number: "",
    rent: "", location: "", furnishing: "", time_used: ""
  });
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const actualTitle = category === "rooms" ? `Room at ${form.location || "Location"}` : form.title;
    const actualContent = form.content || " ";
    const parsed = schema.safeParse({ title: actualTitle, content: actualContent });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    
    let metadata: any = {};
    if (category === "rooms") {
      metadata = {
        room_type: form.room_type === "other" ? form.room_type_other : form.room_type,
        allowed_for: form.allowed_for,
        location: form.location,
        furnishing: form.furnishing,
        rent: form.rent,
        contact: form.contact_number
      };
      if (!metadata.room_type || !metadata.location || !form.rent || !form.contact_number) {
         toast.error("Please fill all required room fields"); return;
      }
    } else if (category === "marketplace") {
      metadata = { time_used: form.time_used, contact: form.contact_number, price: form.price };
      if (!form.title || !form.price || !form.contact_number) {
         toast.error("Please fill all required marketplace fields"); return;
      }
    }
    
    if (files.length === 0) { toast.error("At least one image/video required"); return; }
    if (files.some(f => f.size > 50 * 1024 * 1024)) {
      toast.error("Videos/images cannot exceed 50MB"); return;
    }
    
    setBusy(true);
    try {
      const paths: string[] = [];
      for (const f of files) {
        const path = `${user!.id}/${Date.now()}-${f.name.replace(/[^a-z0-9.\-_]/gi,"_")}`;
        const { error } = await supabase.storage.from("community-images").upload(path, f);
        if (error) throw error;
        paths.push(path);
      }
      const { error } = await supabase.from("community_posts").insert({
        author_id: user!.id, category,
        title: actualTitle, content: actualContent,
        price: form.price && !isNaN(Number(form.price)) ? Number(form.price) : null,
        metadata,
        tags: [],
        images: paths,
      });
      if (error) throw error;
      toast.success("Posted"); onOpenChange(false); onCreated();
      setForm({ title:"", content:"", price:"", room_type:"", room_type_other:"", allowed_for:"", contact_number:"", rent:"", location:"", furnishing:"", time_used:"" }); 
      setFiles([]);
    } catch (e:any) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New post in {cats.find(c=>c.v===category)?.label}</DialogTitle>
          <DialogDescription className="sr-only">Create a new community post.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto px-1">
          {category === "rooms" && (
            <>
              <div><Label>Room Location</Label><Input value={form.location} onChange={(e)=>setForm({...form, location:e.target.value})} placeholder="e.g. Near North Gate" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Type of Room</Label>
                  <Select value={form.room_type} onValueChange={(v)=>setForm({...form, room_type: v})}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1bhk">1 BHK</SelectItem>
                      <SelectItem value="2bhk">2 BHK</SelectItem>
                      <SelectItem value="3bhk">3 BHK</SelectItem>
                      <SelectItem value="4+bhk">4+ BHK</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Allowed for</Label>
                  <Select value={form.allowed_for} onValueChange={(v)=>setForm({...form, allowed_for: v})}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boys">Boys</SelectItem>
                      <SelectItem value="girls">Girls</SelectItem>
                      <SelectItem value="any">Any</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.room_type === "other" && (
                <div><Label>Specify Room Type</Label><Input placeholder="e.g. 1 RK" value={form.room_type_other} onChange={(e)=>setForm({...form, room_type_other: e.target.value})} /></div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Furnishing</Label>
                  <Select value={form.furnishing} onValueChange={(v)=>setForm({...form, furnishing: v})}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unfurnished">Unfurnished</SelectItem>
                      <SelectItem value="semi-furnished">Semi-furnished</SelectItem>
                      <SelectItem value="fully-furnished">Fully Furnished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Rent per month</Label><Input type="text" value={form.rent} onChange={(e)=>setForm({...form, rent:e.target.value})} placeholder="e.g. ₹5000" /></div>
              </div>
              <div><Label>Contact Number</Label><Input type="tel" value={form.contact_number} onChange={(e)=>setForm({...form, contact_number:e.target.value})} /></div>
            </>
          )}

          {category === "marketplace" && (
            <>
              <div><Label>Item Name</Label><Input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Price</Label><Input type="text" value={form.price} onChange={(e)=>setForm({...form,price:e.target.value})} placeholder="e.g. ₹1200 or Negotiable"/></div>
                <div><Label>Time Used</Label><Input type="text" value={form.time_used} onChange={(e)=>setForm({...form,time_used:e.target.value})} placeholder="e.g. 6 months" /></div>
              </div>
              <div><Label>Contact Number</Label><Input type="tel" value={form.contact_number} onChange={(e)=>setForm({...form, contact_number:e.target.value})} /></div>
            </>
          )}

          {category === "lost_found" && (
            <div><Label>Title</Label><Input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})}/></div>
          )}
          
          <div><Label>Description / Details</Label><Textarea rows={4} value={form.content} onChange={(e)=>setForm({...form,content:e.target.value})}/></div>
          
          <div>
            <Label>Photos / Videos (Max 50MB) <span className="text-destructive">*</span></Label>
            <FileDropzone accept="image/*,video/*" multiple files={files} onFiles={setFiles} hint="Drag & drop, click, or paste images/videos" />
          </div>
          <Button variant="hero" className="w-full mt-2" onClick={submit} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin"/> : "Post"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PostDialog({ post, onClose }: { post: Post; onClose: ()=>void }) {
  const { user, isVerified } = useAuth();
  const [replies, setReplies] = useState<Reply[]>([]);
  const [authors, setAuthors] = useState<Record<string, { full_name: string; email: string }>>({});
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("community_replies").select("*").eq("post_id", post.id).order("created_at");
    const list = (data as Reply[]) ?? [];
    setReplies(list);
    const ids = Array.from(new Set(list.map((r) => r.author_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      const map: any = {};
      (profs ?? []).forEach((p: any) => { map[p.id] = { full_name: p.full_name, email: p.email }; });
      setAuthors(map);
    }
  };
  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, [post.id]);

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("community_replies").insert({ post_id: post.id, author_id: user!.id, content: text.trim() });
    setBusy(false);
    if (error) toast.error(error.message); else { setText(""); load(); }
  };

  return (
    <Dialog open onOpenChange={(o)=>!o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post.title}</DialogTitle>
          <DialogDescription className="sr-only">View post details.</DialogDescription>
        </DialogHeader>
        {(post.price != null || post.metadata?.price != null || post.metadata?.rent != null) && (
          <Badge className="bg-secondary text-secondary-foreground w-fit">
            {post.metadata?.rent ? post.metadata.rent : `₹${post.metadata?.price || post.price}`}
          </Badge>
        )}
        
        {post.metadata && Object.keys(post.metadata).length > 0 && (
          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-2 my-2 text-sm bg-muted/30 p-4 rounded-lg">
            {Object.entries(post.metadata).map(([k, v]) => (
              v && (
                <div key={k} className="flex gap-2">
                  <span className="font-semibold text-muted-foreground capitalize">{k.replace("_", " ")}: </span>
                  <span className="text-foreground font-medium">{v}</span>
                </div>
              )
            ))}
          </div>
        )}

        {post.images?.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {post.images.map((img,i)=>{
              const url = supabase.storage.from("community-images").getPublicUrl(img).data.publicUrl;
              const isVideo = img.match(/\.(mp4|webm|ogg)$/i);
              return isVideo ? (
                <video key={i} src={url} controls className="rounded-lg w-full h-40 object-cover bg-black" />
              ) : (
                <img key={i} src={url} className="rounded-lg w-full h-40 object-cover"/>
              );
            })}
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap mt-2">{post.content}</p>
        <div className="border-t border-border pt-4 mt-4">
          <p className="font-semibold text-sm mb-2 flex items-center gap-2"><MessageCircle className="h-4 w-4"/> Replies ({replies.length})</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {replies.map((r)=>{
              const a = authors[r.author_id];
              const name = a?.full_name || a?.email?.split("@")[0] || "User";
              return (
                <div key={r.id} className="bg-muted/50 rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-6 w-6 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center text-[10px] font-semibold">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-xs">{name}</span>
                    <span className="text-[10px] text-muted-foreground">· {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                  </div>
                  <p className="pl-8">{r.content}</p>
                </div>
              );
            })}
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
