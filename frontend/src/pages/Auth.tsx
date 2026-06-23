import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";
import { ArrowRight, Github, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const baseRegistrationNumberRegex = /^0701(cs|ce|ec|ee|me|cm)\d{2}(\d{4}|3d\d{2})$/i;
const studentEmailRegex = /^0701(cs|ce|ec|ee|me|cm)\d{2}(\d{4}|3d\d{2})@uecu\.ac\.in$/i;
const facultyEmailRegex = /^[a-zA-Z0-9._%+-]+@uecu\.ac\.in$/i;

const studentSignupSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters long"),
  email: z.string().trim().email("Invalid email address").regex(studentEmailRegex, {
    message: "Institutional email must match your registration number structure (e.g. 0701cs231026@uecu.ac.in)."
  }),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  registrationNumber: z.string().regex(baseRegistrationNumberRegex, {
    message: "Registration number must match regular UECU or direct-entry diploma formats."
  }),
  branch: z.enum(['cs', 'ce', 'ec', 'ee', 'me', 'cm']),
  yearOfRegistration: z.coerce.number().int().min(2000).max(new Date().getFullYear()),
  dob: z.string().min(1, "Date of birth is required"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").max(15),
}).refine((data) => {
  const emailPrefix = data.email.split('@')[0].toLowerCase();
  return emailPrefix === data.registrationNumber.toLowerCase();
}, {
  message: "Email must match your registration number.",
  path: ["email"]
});

const facultySignupSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters long"),
  email: z.string().trim().email("Invalid email address").regex(facultyEmailRegex, {
    message: "Faculty email must belong to the college domain (@uecu.ac.in)."
  }),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").max(15),
});

const contributorSignupSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters long"),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  organizationName: z.string().trim().min(2, "Organization name must be at least 2 characters long"),
  roleInOrganization: z.string().trim().min(2, "Role in organization must be at least 2 characters long"),
});

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function Auth() {
  const [params] = useSearchParams();
  const initialMode = params.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  
  // Auth state
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Common fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "faculty" | "contributor">("student");

  // Student specific fields
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [branch, setBranch] = useState<any>("");
  const [yearOfRegistration, setYearOfRegistration] = useState("");
  const [dob, setDob] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Contributor specific fields
  const [organizationName, setOrganizationName] = useState("");
  const [roleInOrganization, setRoleInOrganization] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        let payload: any = {};
        let url = "";

        if (role === "student") {
          const parsed = studentSignupSchema.safeParse({
            fullName,
            email,
            password,
            registrationNumber,
            branch,
            yearOfRegistration,
            dob,
            phoneNumber,
          });
          if (!parsed.success) {
            toast.error(parsed.error.issues[0].message);
            setLoading(false);
            return;
          }
          payload = parsed.data;
          url = "/auth/register/student";
        } else if (role === "faculty") {
          const parsed = facultySignupSchema.safeParse({
            fullName,
            email,
            password,
            phoneNumber,
          });
          if (!parsed.success) {
            toast.error(parsed.error.issues[0].message);
            setLoading(false);
            return;
          }
          payload = parsed.data;
          url = "/auth/register/faculty";
        } else if (role === "contributor") {
          const parsed = contributorSignupSchema.safeParse({
            fullName,
            email,
            password,
            organizationName,
            roleInOrganization,
          });
          if (!parsed.success) {
            toast.error(parsed.error.issues[0].message);
            setLoading(false);
            return;
          }
          payload = parsed.data;
          url = "/auth/register/contributor";
        }

        const res = await api.post(url, payload);
        toast.success(res.data.message || "Registration successful! Verification email sent.");
        setMode("login");
      } else {
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          setLoading(false);
          return;
        }
        const res = await api.post("/auth/login", parsed.data);
        const { accessToken } = res.data.data;
        
        await signIn(accessToken);
        toast.success("Signed in successfully");
        navigate("/");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || err.message || "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-secondary/30 blur-3xl" />
        <div className="absolute bottom-0 -left-10 h-96 w-96 rounded-full bg-primary-glow/40 blur-3xl" />
        <Link to="/" className="flex items-center gap-3 relative">
          <Logo className="h-10 w-10 brightness-0 invert" />
          <span className="font-display text-xl font-bold">The Helping Society</span>
        </Link>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative">
          <p className="text-sm uppercase tracking-widest opacity-80 mb-4">Verified · Moderated · Yours</p>
          <h2 className="font-display text-5xl font-bold leading-tight text-balance">
            One trusted space for everyone at UECU.
          </h2>
          <p className="mt-6 text-lg opacity-90 max-w-md">
            Resources, opportunities, community help — all in a single ecosystem only your college can access.
          </p>
        </motion.div>
        <p className="text-xs opacity-70 relative">© {new Date().getFullYear()} The Helping Society</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <Card className="w-full max-w-md p-8 shadow-elegant border-border/60 my-8">
          <div className="lg:hidden flex justify-center mb-6">
            <Logo className="h-12 w-12" />
          </div>
          <h1 className="font-display text-2xl font-bold">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signup" ? "Sign up with your details for full access." : "Sign in to continue."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <Label htmlFor="role">Account Type</Label>
                  <Select value={role} onValueChange={(val: any) => setRole(val)}>
                    <SelectTrigger id="role"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                      <SelectItem value="contributor">Contributor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder={role === "student" && mode === "signup" ? "0701cs231026@uecu.ac.in" : "you@example.com"} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            {mode === "signup" && role === "student" && (
              <>
                <div>
                  <Label htmlFor="regNum">Registration Number</Label>
                  <Input id="regNum" placeholder="e.g. 0701cs231026" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="branch">Branch</Label>
                    <Select value={branch} onValueChange={(val) => setBranch(val)}>
                      <SelectTrigger id="branch"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cs">CS</SelectItem>
                        <SelectItem value="ce">CE</SelectItem>
                        <SelectItem value="ec">EC</SelectItem>
                        <SelectItem value="ee">EE</SelectItem>
                        <SelectItem value="me">ME</SelectItem>
                        <SelectItem value="cm">CM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="yearReg">Year of Reg</Label>
                    <Input id="yearReg" type="number" placeholder="e.g. 2023" value={yearOfRegistration} onChange={(e) => setYearOfRegistration(e.target.value)} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="e.g. 9876543200" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                  </div>
                </div>
              </>
            )}

            {mode === "signup" && role === "faculty" && (
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="e.g. 9876543200" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
              </div>
            )}

            {mode === "signup" && role === "contributor" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="orgName">Organization</Label>
                  <Input id="orgName" placeholder="e.g. Google" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="orgRole">Role</Label>
                  <Input id="orgRole" placeholder="e.g. Engineer" value={roleInOrganization} onChange={(e) => setRoleInOrganization(e.target.value)} required />
                </div>
              </div>
            )}

            <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{mode === "signup" ? "Create account" : "Sign in"} <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" /> OR <div className="flex-1 h-px bg-border" />
          </div>

          <Button type="button" variant="outline" className="w-full cursor-not-allowed opacity-50" disabled>
            <Github className="h-4 w-4" /> Continue with GitHub (Local Only)
          </Button>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
            <button onClick={() => setMode(mode === "signup" ? "login" : "signup")} className="text-primary font-medium hover:underline">
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
}
