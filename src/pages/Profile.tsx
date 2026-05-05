import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, ShieldAlert, Loader2 } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  mobile_number: z.string().trim().max(20).optional().or(z.literal("")),
  branch: z.string().trim().max(80).optional().or(z.literal("")),
  year: z.coerce.number().int().min(1).max(4).optional().or(z.literal("" as any)),
});

export default function Profile() {
  const { profile, isVerified, refresh, loading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "", mobile_number: "", user_type: "student", branch: "", year: "" as any,
  });

  useEffect(() => {
    if (profile) setForm({
      full_name: profile.full_name || "",
      mobile_number: profile.mobile_number || "",
      user_type: profile.user_type,
      branch: profile.branch || "",
      year: profile.year ?? ("" as any),
    });
  }, [profile]);

  const save = async () => {
    setSaving(true);
    try {
      const parsed = schema.safeParse(form);
      if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
      const { error } = await supabase.from("profiles").update({
        full_name: form.full_name,
        mobile_number: form.mobile_number || null,
        user_type: form.user_type as any,
        branch: form.branch || null,
        year: form.year ? Number(form.year) : null,
      }).eq("id", profile!.id);
      if (error) throw error;
      toast.success("Profile updated");
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setSaving(false); }
  };

  if (loading) return <Layout><div className="container py-20 grid place-items-center"><Loader2 className="animate-spin" /></div></Layout>;
  if (!profile) return <Layout><div className="container py-20">Not signed in.</div></Layout>;

  return (
    <Layout>
      <div className="container py-10 max-w-3xl">
        <h1 className="font-display text-3xl font-bold">Your profile</h1>
        <p className="text-muted-foreground mt-1">Manage personal details & verification.</p>

        <Card className={`mt-6 p-5 flex items-start gap-4 ${isVerified ? "border-primary/40 bg-primary/5" : "border-secondary/40 bg-secondary/5"}`}>
          {isVerified ? <CheckCircle2 className="h-6 w-6 text-primary mt-0.5" /> : <ShieldAlert className="h-6 w-6 text-secondary mt-0.5" />}
          <div className="flex-1">
            <p className="font-semibold">{isVerified ? "Verified member" : "Not verified yet"}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isVerified
                ? "You have full access to upload, comment, like and create posts."
                : <>Sign up with an <span className="text-primary font-medium">@uecu.ac.in</span> email to get instant verification, or wait for admin approval.</>}
            </p>
          </div>
          {isVerified && <Badge className="bg-primary text-primary-foreground">Verified</Badge>}
        </Card>

        <Card className="mt-6 p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input value={profile.email} disabled />
            </div>
            <div>
              <Label>Full name</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <Label>Mobile</Label>
              <Input value={form.mobile_number} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} />
            </div>
            <div>
              <Label>User type</Label>
              <Select value={form.user_type} onValueChange={(v) => setForm({ ...form, user_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="alumni">Alumni</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Branch</Label>
              <Input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} placeholder="e.g. CSE" />
            </div>
            <div>
              <Label>Year</Label>
              <Select value={String(form.year || "")} onValueChange={(v) => setForm({ ...form, year: v as any })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button variant="hero" onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}</Button>
        </Card>
      </div>
    </Layout>
  );
}
