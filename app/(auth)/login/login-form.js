"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { isClientFirebaseConfigured } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const { loginEmail, loginGoogle, devMode } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const firebaseReady = isClientFirebaseConfigured() || devMode;

  async function handleDevLogin() {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dev: true }),
    });
    router.push(searchParams.get("next") || "/");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginEmail(email, password);
      router.push(searchParams.get("next") || "/");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Firebase Authentication secures your personal automation hub.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!firebaseReady && (
          <p className="text-sm text-amber-400">
            Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* env vars or enable DEV_BYPASS_AUTH for local
            development.
          </p>
        )}

        {devMode && (
          <Button className="w-full" onClick={handleDevLogin}>
            Continue as dev user
          </Button>
        )}

        {firebaseReady && !devMode && (
          <>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign in with email"}
              </Button>
            </form>
            <Button type="button" variant="outline" className="w-full" onClick={() => loginGoogle()}>
              Sign in with Google
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
