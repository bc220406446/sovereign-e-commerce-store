"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import StoreLayout from "@/components/store/StoreLayout";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, CheckCircle2, Loader2, Mail, ShieldCheck, Watch, LockKeyhole } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { STORE_NAME } from "@/lib/store";
import { toast } from "sonner";

function AuthContent() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/account";

  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const loginRedirecting = useRef(false);

  useEffect(() => {
    if (searchParams.get("mode") === "reset-password") setMode("reset");
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && user && !loginRedirecting.current) {
      router.replace(isAdmin && !searchParams.get("returnTo") ? "/admin" : returnTo);
    }
  }, [authLoading, user, isAdmin, returnTo, router, searchParams]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth?mode=reset-password`,
        });
        if (error) throw error;
        setSent(true);
        toast.success("Password reset email sent.");
      } else if (mode === "register") {
        if (!name.trim() || password.length < 6) {
          throw new Error("Enter your name and a password of at least 6 characters.");
        }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { name: name.trim() },
            emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(returnTo)}`,
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          toast.success("Check your email to verify your account.");
        }
      } else {
        loginRedirecting.current = true;
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (data.user) {
          const profileResponse = await fetch(`/api/auth/profile?userId=${data.user.id}`);
          const profileData = profileResponse.ok ? await profileResponse.json() : null;
          const destination = profileData?.profile?.role === "admin" ? "/admin" : returnTo;
          router.replace(destination);
        }
      }
    } catch (err: any) {
      loginRedirecting.current = false;
      toast.error(err.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StoreLayout>
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <Card className="glass w-full max-w-md border-0 shadow-2xl rounded-3xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Watch className="size-6" strokeWidth={1.8} />
            </div>
            <CardTitle className="font-display text-2xl font-semibold text-slate-900">
              Welcome to {STORE_NAME}
            </CardTitle>
            <CardDescription className="text-slate-500">
              {mode === "register" ? "Create your customer account" : mode === "reset" ? "Reset your account password" : "Sign in to your customer account"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {sent ? (
              <div className="glass-soft rounded-2xl p-6 text-center space-y-3">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="size-6" />
                </div>
                <h3 className="font-semibold text-slate-800">Check your inbox</h3>
                <p className="text-xs text-slate-500">
                  {mode === "reset" ? <>We've sent a password reset link to <strong>{email}</strong>.</> : <>We've sent a verification link to <strong>{email}</strong>. Verify your email, then return here to log in.</>}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full mt-2"
                  onClick={() => setSent(false)}
                >
                  Use a different email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleAuth} className="space-y-4">
                {mode === "register" && (
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-xs font-semibold text-slate-700">Full Name</label>
                    <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="rounded-xl bg-white/70 text-sm" />
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-semibold text-slate-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="rounded-xl pl-9 bg-white/70 text-sm"
                    />
                    <Mail className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  </div>
                </div>

                {mode !== "reset" && (
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-xs font-semibold text-slate-700">Password</label>
                    <div className="relative">
                      <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="rounded-xl pl-9 bg-white/70 text-sm" />
                      <LockKeyhole className="absolute left-3 top-2.5 size-4 text-slate-400" />
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full rounded-full" size="lg" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : mode === "register" ? "Create Account" : mode === "reset" ? "Send Reset Email" : "Log In"}
                  {!isLoading && mode !== "reset" && <ArrowRight className="ml-2 size-4" />}
                </Button>
                {mode === "login" && <button type="button" onClick={() => setMode("reset")} className="w-full text-xs text-primary hover:underline">Forgot password?</button>}
              </form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2 text-center text-xs text-slate-400">
            <button type="button" onClick={() => { setSent(false); setMode(mode === "login" ? "register" : "login"); }} className="text-primary hover:underline">
              {mode === "login" ? "Create a new account" : "Already have an account? Log in"}
            </button>
            <p>
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    </StoreLayout>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse">Loading auth...</div></div>}>
      <AuthContent />
    </Suspense>
  );
}
