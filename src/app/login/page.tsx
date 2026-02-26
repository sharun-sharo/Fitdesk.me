import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Dumbbell, Shield } from "lucide-react";
import Link from "next/link";
import { LoginForm } from "./login-form";
import { LoginLandingSections } from "./login-landing-sections";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "SUPER_ADMIN" ? "/admin" : "/dashboard");
  }
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left: Scrollable marketing / landing (order-2 on mobile so login shows first) */}
      <div className="order-2 lg:order-1 flex-1 overflow-auto min-h-0">
        <LoginLandingSections />
      </div>

      {/* Right: Sticky login panel */}
      <div className="order-1 lg:order-2 lg:sticky lg:top-0 lg:h-screen lg:w-[420px] xl:w-[480px] lg:shrink-0 flex flex-col justify-center px-6 py-10 lg:py-12 lg:px-10 xl:px-14 border-b lg:border-b-0 lg:border-l border-border/50 bg-gradient-to-b from-background to-muted/20 lg:bg-card shadow-sm lg:shadow-none">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/login"
            className="logo-brand inline-flex items-center gap-2.5 text-2xl font-bold tracking-tight transition-transform duration-300 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 rounded-lg"
          >
            <span className="logo-dot flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Dumbbell className="h-5 w-5 text-primary" />
            </span>
            <span>
              <span className="text-slate-800 dark:text-slate-100">FitDesk</span><span className="text-primary">.me</span>
            </span>
          </Link>

          <div className="mt-10 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/5 px-2.5 py-1 text-xs text-muted-foreground">
              <Shield className="h-3 w-3 text-primary/70" aria-hidden />
              Secure login
            </span>
            <span className="inline-flex items-center rounded-full bg-primary/5 px-2.5 py-1 text-xs text-muted-foreground">
              Your data protected
            </span>
            <span className="inline-flex items-center rounded-full bg-primary/5 px-2.5 py-1 text-xs text-muted-foreground">
              99.9% uptime
            </span>
          </div>
          <div className="mt-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Sign in
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Gym or studio email and password.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-border/50 bg-card/95 p-6 shadow-md ring-1 ring-black/5 transition-shadow hover:shadow-lg focus-within:shadow-lg focus-within:ring-2 focus-within:ring-primary/10 border-l-4 border-l-primary/50">
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to FitDesk?{" "}
            <a
              href="#contact"
              className="font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 rounded px-0.5 py-0.5"
            >
              Claim my 14 days free trial
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
