import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";
import { ArrowRight, Github, Loader2 } from "lucide-react";

const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Name too short").max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8, "Min 8 characters").max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(72),
});

export default function Auth() {
  const [params] = useSearchParams();
  const initialMode = params.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const parsed = signupSchema.safeParse({ full_name: fullName, email, password });
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: parsed.data.full_name },
          },
        });
        if (error) throw error;
        toast.success("Account created. Welcome!");
        navigate("/profile");
      } else {
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
        toast.success("Signed in");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const githubSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) toast.error("GitHub OAuth not configured. Enable it in your backend settings.");
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

      <div className="flex items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-md p-8 shadow-elegant border-border/60">
          <div className="lg:hidden flex justify-center mb-6">
            <Logo className="h-12 w-12" />
          </div>
          <h1 className="font-display text-2xl font-bold">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signup" ? "Sign up with your college email for full access." : "Sign in to continue."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@uecu.ac.in" value={email} onChange={(e) => setEmail(e.target.value)} required />
              {mode === "signup" && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Use your <span className="text-primary font-medium">@uecu.ac.in</span> email to get verified instantly.
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{mode === "signup" ? "Create account" : "Sign in"} <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" /> OR <div className="flex-1 h-px bg-border" />
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={githubSignIn}>
            <Github className="h-4 w-4" /> Continue with GitHub
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
