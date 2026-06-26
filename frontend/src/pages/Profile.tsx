import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { CheckCircle2, ShieldAlert, Loader2 } from "lucide-react";

export default function Profile() {
  const { profile, isVerified, refresh, loading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phoneNumber: "",
    branch: "",
    yearOfRegistration: "" as any,
    dob: "",
    organizationName: "",
    roleInOrganization: "",
    yearOfGraduation: "" as any,
    currentCompany: "",
    currentRole: "",
    linkedin: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.full_name || "",
        phoneNumber: profile.mobile_number || "",
        branch: profile.branch || "",
        yearOfRegistration: profile.yearOfRegistration ?? "",
        dob: profile.dob || "",
        organizationName: profile.organizationName || "",
        roleInOrganization: profile.roleInOrganization || "",
        yearOfGraduation: profile.yearOfGraduation ?? "",
        currentCompany: profile.currentCompany || "",
        currentRole: profile.currentRole || "",
        linkedin: profile.linkedin || "",
      });
    }
  }, [profile]);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const payload: any = {
        fullName: form.fullName,
      };

      if (profile.user_type === "student") {
        if (!form.fullName || form.fullName.trim().length < 2) {
          toast.error("Full name must be at least 2 characters long");
          setSaving(false);
          return;
        }
        if (!form.phoneNumber || form.phoneNumber.trim().length < 10) {
          toast.error("Phone number must be at least 10 digits");
          setSaving(false);
          return;
        }
        if (!form.branch) {
          toast.error("Please select your branch");
          setSaving(false);
          return;
        }
        if (!form.yearOfRegistration) {
          toast.error("Please enter your year of registration");
          setSaving(false);
          return;
        }

        const revMap: Record<string, string> = {
          "Computer Science Engineering": "cs",
          "Electronics and communication engineering": "ec",
          "Electrical Engineering": "ee",
          "Chemical Engineering": "cm",
          "Mechanical engineering": "me",
          "Civil Engineering": "ce",
        };
        const branchCode = revMap[form.branch] || form.branch;

        payload.phoneNumber = form.phoneNumber;
        payload.branch = branchCode;
        payload.yearOfRegistration = Number(form.yearOfRegistration);
        payload.dob = form.dob;
      } else if (profile.user_type === "faculty") {
        if (!form.fullName || form.fullName.trim().length < 2) {
          toast.error("Full name must be at least 2 characters long");
          setSaving(false);
          return;
        }
        if (!form.phoneNumber || form.phoneNumber.trim().length < 10) {
          toast.error("Phone number must be at least 10 digits");
          setSaving(false);
          return;
        }
        payload.phoneNumber = form.phoneNumber;
      } else if (profile.user_type === "contributor") {
        if (!form.fullName || form.fullName.trim().length < 2) {
          toast.error("Full name must be at least 2 characters long");
          setSaving(false);
          return;
        }
        if (!form.organizationName || form.organizationName.trim().length < 2) {
          toast.error("Organization name must be at least 2 characters long");
          setSaving(false);
          return;
        }
        if (!form.roleInOrganization || form.roleInOrganization.trim().length < 2) {
          toast.error("Role in organization must be at least 2 characters long");
          setSaving(false);
          return;
        }
        payload.organizationName = form.organizationName;
        payload.roleInOrganization = form.roleInOrganization;
      } else if (profile.user_type === "alumni") {
        if (!form.fullName || form.fullName.trim().length < 2) {
          toast.error("Full name must be at least 2 characters long");
          setSaving(false);
          return;
        }
        if (!form.phoneNumber || form.phoneNumber.trim().length < 10) {
          toast.error("Phone number must be at least 10 digits");
          setSaving(false);
          return;
        }
        if (!form.branch) {
          toast.error("Please select your branch");
          setSaving(false);
          return;
        }
        if (!form.yearOfGraduation) {
          toast.error("Please enter your graduation year");
          setSaving(false);
          return;
        }
        if (!form.currentCompany || form.currentCompany.trim().length < 1) {
          toast.error("Current company is required");
          setSaving(false);
          return;
        }
        if (!form.currentRole || form.currentRole.trim().length < 1) {
          toast.error("Current role is required");
          setSaving(false);
          return;
        }
        if (form.linkedin) {
          const isUrl = /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/i.test(form.linkedin);
          if (!isUrl) {
            toast.error("Invalid LinkedIn URL");
            setSaving(false);
            return;
          }
        }

        const revMap: Record<string, string> = {
          "Computer Science Engineering": "cs",
          "Electronics and communication engineering": "ec",
          "Electrical Engineering": "ee",
          "Chemical Engineering": "cm",
          "Mechanical engineering": "me",
          "Civil Engineering": "ce",
        };
        const branchCode = revMap[form.branch] || form.branch;

        payload.phoneNumber = form.phoneNumber;
        payload.branch = branchCode;
        payload.yearOfGraduation = Number(form.yearOfGraduation);
        payload.currentCompany = form.currentCompany;
        payload.currentRole = form.currentRole;
        payload.linkedin = form.linkedin || undefined;
      } else if (profile.user_type === "admin") {
        if (!form.fullName || form.fullName.trim().length < 2) {
          toast.error("Full name must be at least 2 characters long");
          setSaving(false);
          return;
        }
      }

      await api.patch("/users/profile", payload);
      toast.success("Profile updated");
      await refresh();
    } catch (e: any) {
      const msg = e.response?.data?.message || e.response?.data?.errors?.[0]?.message || e.message || "Failed to update profile";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><div className="container py-20 grid place-items-center"><Loader2 className="animate-spin" /></div></Layout>;
  if (!profile) return <Layout><div className="container py-20">Not signed in.</div></Layout>;

  const roleLabelMap: Record<string, string> = {
    student: "Student",
    faculty: "Faculty",
    contributor: "Contributor",
    admin: "Administrator",
    alumni: "Alumni",
  };

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
                : "Please wait for email verification and/or admin approval to get full access."}
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
              <Label>Account Role</Label>
              <Input value={roleLabelMap[profile.user_type] || profile.user_type} disabled />
            </div>
            <div>
              <Label>Full name</Label>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>

            {profile.user_type === "student" && (
              <>
                <div>
                  <Label>Registration Number</Label>
                  <Input value={profile.registrationNumber || ""} disabled />
                </div>
                <div>
                  <Label>Mobile Number</Label>
                  <Input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
                </div>
                <div>
                  <Label>Branch</Label>
                  <Select value={form.branch} onValueChange={(v) => setForm({ ...form, branch: v })}>
                    <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Computer Science Engineering">Computer Science Engineering</SelectItem>
                      <SelectItem value="Electronics and communication engineering">Electronics and communication engineering</SelectItem>
                      <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                      <SelectItem value="Chemical Engineering">Chemical Engineering</SelectItem>
                      <SelectItem value="Mechanical engineering">Mechanical engineering</SelectItem>
                      <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Year of Registration</Label>
                  <Input type="number" placeholder="e.g. 2023" value={form.yearOfRegistration} onChange={(e) => setForm({ ...form, yearOfRegistration: e.target.value })} />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
                </div>
              </>
            )}

            {profile.user_type === "faculty" && (
              <div>
                <Label>Mobile Number</Label>
                <Input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
              </div>
            )}

            {profile.user_type === "contributor" && (
              <>
                <div>
                  <Label>Organization Name</Label>
                  <Input value={form.organizationName} onChange={(e) => setForm({ ...form, organizationName: e.target.value })} />
                </div>
                <div>
                  <Label>Role in Organization</Label>
                  <Input value={form.roleInOrganization} onChange={(e) => setForm({ ...form, roleInOrganization: e.target.value })} />
                </div>
              </>
            )}

            {profile.user_type === "alumni" && (
              <>
                <div>
                  <Label>Mobile Number</Label>
                  <Input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
                </div>
                <div>
                  <Label>Branch</Label>
                  <Select value={form.branch} onValueChange={(v) => setForm({ ...form, branch: v })}>
                    <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Computer Science Engineering">Computer Science Engineering</SelectItem>
                      <SelectItem value="Electronics and communication engineering">Electronics and communication engineering</SelectItem>
                      <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                      <SelectItem value="Chemical Engineering">Chemical Engineering</SelectItem>
                      <SelectItem value="Mechanical engineering">Mechanical engineering</SelectItem>
                      <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Year of Graduation</Label>
                  <Input type="number" placeholder="e.g. 2022" value={form.yearOfGraduation} onChange={(e) => setForm({ ...form, yearOfGraduation: e.target.value })} />
                </div>
                <div>
                  <Label>Current Company</Label>
                  <Input placeholder="e.g. Microsoft" value={form.currentCompany} onChange={(e) => setForm({ ...form, currentCompany: e.target.value })} />
                </div>
                <div>
                  <Label>Current Role</Label>
                  <Input placeholder="e.g. Software Engineer" value={form.currentRole} onChange={(e) => setForm({ ...form, currentRole: e.target.value })} />
                </div>
                <div>
                  <Label>LinkedIn Profile</Label>
                  <Input placeholder="e.g. https://linkedin.com/in/username" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
                </div>
              </>
            )}
          </div>
          <Button variant="hero" onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}</Button>
        </Card>
      </div>
    </Layout>
  );
}
