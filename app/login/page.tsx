"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiClient } from "@/lib/api";
import { setTokens } from "@/lib/auth";
import { CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";

interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: false });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isChecking) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiClient<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      setTokens(data.accessToken, data.refreshToken);
      router.push(CONFIG.ROUTES.DASHBOARD);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="backdrop-blur-xl bg-white/80 dark:bg-purple-950/50 border border-white/70 dark:border-purple-800/40 shadow-xl shadow-purple-900/10 rounded-3xl p-8 max-w-md w-full space-y-6">
        <div className="space-y-1.5 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 mb-2 shadow-2xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-purple-950 dark:text-purple-100">
            Welcome Back
          </h1>
          <p className="text-xs text-purple-700/80 dark:text-purple-300/80">
            Enter your credentials to access the MySQL dashboard.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 text-xs text-red-600 bg-red-50/90 dark:bg-red-950/60 rounded-xl border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-xs font-semibold text-purple-900">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="e.g. lsuarez"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-white/80 dark:bg-purple-900/30 border-purple-200/80 rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-purple-900">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-white/80 dark:bg-purple-900/30 border-purple-200/80 rounded-xl text-xs"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs font-medium text-xs py-2.5"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Sign In"}
          </Button>

          <p className="text-xs text-center text-purple-700/80 pt-2">
            Don&apos;t have an account?{" "}
            <Link
              href={CONFIG.ROUTES.REGISTER}
              className="text-purple-900 font-semibold underline underline-offset-4 hover:text-purple-950"
            >
              Register here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
