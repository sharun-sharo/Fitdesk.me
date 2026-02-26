"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [readonlyRemoved, setReadonlyRemoved] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const removeReadonly = useCallback(() => {
    if (!readonlyRemoved) setReadonlyRemoved(true);
  }, [readonlyRemoved]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      let data: { error?: string; redirect?: string } = {};
      const contentType = res.headers.get("content-type") || "";
      try {
        if (contentType.includes("application/json")) {
          data = await res.json();
        } else {
          const text = await res.text();
          const snippet = text.slice(0, 80).replace(/\s+/g, " ");
          const hint = res.status >= 500
            ? "Server error. Check terminal for logs. Ensure .env has DATABASE_URL and you ran: npx prisma generate && npx prisma db push && npm run db:seed"
            : `Server returned ${res.status} (not JSON). ${snippet ? `Response: ${snippet}...` : ""}`;
          data = { error: hint };
        }
      } catch {
        data = { error: res.ok ? "" : "Invalid response from server" };
      }
      if (!res.ok) {
        const rawError = data.error || "Invalid credentials";
        const isDbUnreachable =
          /can't reach database|database server|localhost:5432|connection refused|P1001/i.test(rawError);
        const description = isDbUnreachable
          ? "Database not running. Start local PostgreSQL, or put a cloud DB URL in .env (see SETUP-DATABASE.md). Then run: npx prisma db push && npm run db:seed"
          : rawError;
        toast({
          title: "Login failed",
          description,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Welcome back!", variant: "success" });
      router.push(data.redirect || "/dashboard");
      router.refresh();
    } catch (err) {
      const isNetwork = err instanceof TypeError && (err.message === "Failed to fetch" || err.message.includes("network"));
      toast({
        title: "Error",
        description: isNetwork
          ? "Network error. Is the dev server running?"
          : "Something went wrong. Check the terminal for server errors.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground text-sm font-medium">
          Email
        </Label>
        <Input
          id="email"
          name="fitdesk-email"
          type="email"
          placeholder="you@gym.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={removeReadonly}
          required
          autoComplete="off"
          readOnly={!readonlyRemoved}
          className={cn(
            "h-11 rounded-xl border-border bg-background transition-colors placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30",
            !readonlyRemoved && "cursor-text"
          )}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="password" className="text-foreground text-sm font-medium">
            Password
          </Label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 rounded shrink-0"
          >
            Forgot password? Contact admin to reset
          </Link>
        </div>
        <Input
          id="password"
          name="fitdesk-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={removeReadonly}
          required
          autoComplete="new-password"
          readOnly={!readonlyRemoved}
          className={cn(
            "h-11 rounded-xl border-border bg-background transition-colors placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30",
            !readonlyRemoved && "cursor-text"
          )}
        />
      </div>
      <div className="flex items-center gap-3">
        <input
          id="remember"
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className={cn(
            "h-4 w-4 rounded border-input bg-background text-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 cursor-pointer transition-colors"
          )}
        />
        <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer select-none">
          Remember me
        </Label>
      </div>
      <Button
        type="submit"
        className="w-full h-11 rounded-xl font-semibold shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0"
        size="lg"
        disabled={loading}
      >
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
