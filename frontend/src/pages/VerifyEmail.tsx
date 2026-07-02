import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

type Status = "verifying" | "success" | "error";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");

  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("Verifying your email, please wait...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("This verification link is missing its token. Please use the link from your email, or request a new one.");
      return;
    }

    let isMounted = true;

    api
      .get("/auth/verify-email", { params: { token } })
      .then((res) => {
        if (!isMounted) return;
        setStatus("success");
        setMessage(res.data?.message || "Email verified successfully.");
      })
      .catch((err) => {
        if (!isMounted) return;
        setStatus("error");
        setMessage(
          err.response?.data?.message ||
            "This verification link is invalid or has expired. Please request a new one."
        );
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        {status === "verifying" && (
          <>
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary" />
            <h1 className="mb-2 text-xl font-semibold">Verifying your email</h1>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-green-600" />
            <h1 className="mb-2 text-xl font-semibold">Email verified</h1>
            <p className="mb-6 text-muted-foreground">{message}</p>
            <Button asChild className="w-full">
              <Link to="/auth">Continue to Login</Link>
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="mx-auto mb-4 h-10 w-10 text-destructive" />
            <h1 className="mb-2 text-xl font-semibold">Verification failed</h1>
            <p className="mb-6 text-muted-foreground">{message}</p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/auth">Back to Login</Link>
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
