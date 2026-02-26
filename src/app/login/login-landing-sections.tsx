import {
  Dumbbell,
  Users,
  BarChart3,
  CheckCircle2,
  XCircle,
  Phone,
  MessageCircle,
  Zap,
  Shield,
  IndianRupee,
  ArrowRight,
} from "lucide-react";
import {
  LANDING_PHONE,
  LANDING_PHONE_TEL,
  LANDING_WHATSAPP_URL,
} from "./landing-constants";
/* LANDING_WHATSAPP_URL used in Contact section buttons only */

const PROBLEM_AGITATION = [
  "Members training but not paying—and you don't know who's due until it's too late.",
  "Staff forgetting follow-ups. WhatsApp reminders ignored. Cash stuck as 'pending'.",
  "Excel sheets lying to you. You think you made profit—but the money isn't in the bank.",
  "Revenue leaking every month. No control. No visibility. Just hope.",
];

const HERO_BENEFITS = [
  "Recover up to 40% of pending dues—without chasing members. Who's due, who paid, in one place.",
  "Send payment links in 1 click. Get paid before members walk out. Professional invoices, zero hassle.",
  "See exactly what's collected this week, this month. Real cash flow—not guesswork.",
  "Cut 10+ hours of admin a month. Less staff dependency. You stay in control.",
  "Built for gyms and studios worldwide. Works on mobile. Secure. Your data, your business.",
];

const OBJECTIONS_STILL_EXCEL = [
  {
    objection: "My staff won't use this.",
    answer: "Staff adoption takes 1 day. Simple enough for reception. We'll get you set up.",
  },
  {
    objection: "Too expensive.",
    answer: "One unpaid member = 1 month subscription fee. FitDesk pays for itself with recovered revenue.",
  },
  {
    objection: "Takes time to set up.",
    answer: "Setup in under 10 minutes. Create your gym or studio, add members, record first payment. Done.",
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Get started in minutes",
    description: "Create your gym or studio profile. No credit card. No long forms.",
    icon: Zap,
  },
  {
    step: 2,
    title: "Add members & record payments",
    description: "Add or import clients. Record payments, send invoices—often in under a day.",
    icon: Users,
  },
  {
    step: 3,
    title: "See revenue and control from one place",
    description: "Know who paid, who's due, and how the month is shaping up—no guesswork.",
    icon: BarChart3,
  },
];

const WHO_FOR = [
  { label: "Gym & studio owners", icon: Dumbbell },
  { label: "CrossFit boxes", icon: Dumbbell },
  { label: "Yoga studios", icon: Dumbbell },
  { label: "Personal trainers", icon: Users },
];

const WHY_FITDESK = [
  {
    fitdesk: "One dashboard: members, payments, invoices, reports",
    manual: "Spreadsheets, notebooks, and lost receipts",
  },
  {
    fitdesk: "Instant professional invoices & payment tracking",
    manual: "Manual billing and chasing payments",
  },
  {
    fitdesk: "Revenue and growth insights in real time",
    manual: "Guessing numbers at month-end",
  },
  {
    fitdesk: "Secure, cloud-based—works on phone and desktop",
    manual: "Files on one laptop or paper only",
  },
];

const TRUST_STAT = "Gyms and studios using FitDesk reduce pending dues by 32% in 60 days.";

const TESTIMONIALS = [
  {
    quote:
      "Pending dues dropped in the first month. Invoices on WhatsApp—members pay faster. We finally see what's actually collected.",
    name: "Rahul M.",
    metric: "40% fewer pending dues",
  },
  {
    quote:
      "Ditched Excel in a day. Renewals and payments tracked. I got 10+ hours back every month.",
    name: "Priya S.",
    metric: "10+ hours saved per month",
  },
  {
    quote:
      "We know exactly where we stand. Revenue visibility changed how we plan and collect.",
    name: "Vikram K.",
    metric: "Clear revenue, better control",
  },
];

export function LoginLandingSections() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section
        id="hero"
        className="relative overflow-hidden px-6 py-12 sm:px-10 lg:px-16 xl:px-24 lg:py-16 bg-gradient-to-br from-primary/5 via-primary/8 to-primary/12 lg:border-r border-border/50"
      >
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary landing-animate">
            Revenue recovery for gyms and studios
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] landing-animate" style={{ animationDelay: "0.1s" }}>
            Run your fitness business smarter, not harder.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed landing-animate" style={{ animationDelay: "0.15s" }}>
            FitDesk is not software. It’s a revenue recovery engine. Gyms and studios use it to recover 30–40% of pending dues, turn unpaid memberships into collected revenue, and run a tighter, more profitable business. AI-powered insights help you spot gaps and act before revenue slips.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 landing-animate" style={{ animationDelay: "0.2s" }}>
            <a href="#contact" className="landing-cta-primary">
              <MessageCircle className="mr-2 h-4 w-4" />
              Claim my 14 days free trial
            </a>
            <a href="#problem" className="landing-cta-secondary">
              See how much I’m losing
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground landing-animate" style={{ animationDelay: "0.25s" }}>
            No credit card · 5-min setup · Cancel anytime · Works on mobile
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-primary/70" />
            Trusted by 100+ gyms and studios worldwide · Secure · Your data protected
          </p>
        </div>
      </section>

      {/* Problem agitation */}
      <section id="problem" className="border-t border-border/50 bg-rose-500/5 px-6 py-10 sm:px-10 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-2xl">
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            Sound familiar?
          </h3>
          <ul className="mt-6 space-y-3">
            {PROBLEM_AGITATION.map((line, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500/80" />
                {line}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-lg font-semibold text-foreground">
            Here’s how FitDesk fixes that.
          </p>
        </div>
      </section>

      {/* Benefit bullets (revenue multipliers) */}
      <section className="border-t border-border/50 bg-background px-6 py-12 sm:px-10 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-2xl">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">
            More money. Less effort. Full control.
          </h3>
          <ul className="mt-8 space-y-4">
            {HERO_BENEFITS.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm font-medium text-primary">
            {TRUST_STAT}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#contact" className="landing-cta-primary">
              Start recovering revenue
            </a>
            <a href="#how-it-works" className="landing-cta-secondary">
              How it works
            </a>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            No credit card · 5-min setup · Trusted by 100+ gyms and studios
          </p>
        </div>
      </section>

      {/* Still Using Excel? (Objections) */}
      <section className="border-t border-border/50 bg-card/30 px-6 py-12 sm:px-10 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-3xl">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">
            Still using Excel?
          </h3>
          <p className="mt-2 text-muted-foreground">
            Three excuses. Three answers.
          </p>
          <div className="mt-8 space-y-5">
            {OBJECTIONS_STILL_EXCEL.map((item, i) => (
              <div
                key={i}
                className="landing-card-hover rounded-xl border border-border/50 bg-card p-4 shadow-sm"
              >
                <p className="font-semibold text-foreground">{item.objection}</p>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <a href="#contact" className="landing-cta-primary">
              Fix my collections now
            </a>
            <p className="mt-2 text-xs text-muted-foreground">
              Setup in under 10 minutes · No credit card
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-t border-border/50 bg-card/30 px-6 py-12 sm:px-10 lg:px-16 xl:px-24"
      >
        <div className="mx-auto max-w-3xl">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">
            How it works
          </h3>
          <p className="mt-2 text-muted-foreground">
            Three steps. Most gyms and studios are running in a day.
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="landing-card-hover rounded-2xl border border-border/50 bg-card p-6 shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-sm font-semibold text-primary">
                    Step {item.step}
                  </p>
                  <h4 className="mt-1 text-lg font-semibold text-foreground">
                    {item.title}
                  </h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <a href="#contact" className="landing-cta-primary">
              Start recovering revenue
            </a>
            <p className="mt-2 text-xs text-muted-foreground">
              No credit card · 5-min setup · We’ll help you get started
            </p>
          </div>
        </div>
      </section>

      {/* Simple Pricing */}
      <section className="border-t border-border/50 bg-muted/20 px-6 py-14 sm:px-10 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-md">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">
            Simple pricing
          </h3>
          <p className="mt-2 text-muted-foreground">
            One plan. Everything you need to run your gym or studio.
          </p>
          <div className="mt-8 rounded-2xl border border-border/50 bg-card p-6 sm:p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-primary/20 border-l-4 border-l-primary overflow-hidden">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                <IndianRupee className="h-6 w-6" />
              </span>
              <div>
                <span className="font-bold text-lg text-foreground">Simple Pricing</span>
                <p className="text-xs text-muted-foreground mt-0.5">Transparent, no surprises</p>
              </div>
            </div>
            <div className="mt-6 flex items-baseline gap-1.5">
              <span className="text-sm font-medium text-muted-foreground">Starts </span>
              <span className="text-3xl font-bold tracking-tight text-primary tabular-nums">₹1,500</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            <ul className="mt-6 space-y-4">
              {[
                "1 gym or studio",
                "Members & payments",
                "Full access for a month",
                "No hidden charges",
                "Discounts on yearly plans",
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-lg px-4 py-3">
              Perfect for single-location gyms, studios, and growing fitness businesses.
            </p>
            <a
              href="#contact"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 group"
            >
              Start free trial
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </section>

      {/* Who is this for */}
      <section className="border-t border-border/50 bg-background px-6 py-12 sm:px-10 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-3xl">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">
            Who is this for
          </h3>
          <p className="mt-2 text-muted-foreground">
            Built for fitness businesses that want to grow without the chaos.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            {WHO_FOR.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="landing-card-hover flex items-center gap-3 rounded-xl border border-border/50 bg-card px-5 py-4 shadow-sm"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="font-medium text-foreground">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why FitDesk */}
      <section className="border-t border-border/50 bg-card/30 px-6 py-12 sm:px-10 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-3xl">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">
            Why choose FitDesk
          </h3>
          <p className="mt-2 text-muted-foreground">
            Stop juggling spreadsheets and paper.
          </p>
          <div className="mt-8 space-y-4">
            {WHY_FITDESK.map((row, i) => (
              <div
                key={i}
                className="landing-card-hover grid gap-4 rounded-xl border border-border/50 bg-card p-4 shadow-sm sm:grid-cols-2"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      With FitDesk
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-foreground">
                      {row.fitdesk}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500/80" />
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Manual / spreadsheets
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {row.manual}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-border/50 bg-background px-6 py-12 sm:px-10 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-4xl">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">
            What gym and studio owners say
          </h3>
          <p className="mt-2 text-muted-foreground">
            Real revenue impact. Real gyms and studios worldwide.
          </p>
          <p className="mt-4 text-sm font-medium text-primary">
            {TRUST_STAT}
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="landing-card-hover rounded-2xl border border-border/50 bg-card p-6 shadow-sm"
              >
                <p className="text-sm text-muted-foreground leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="mt-4 font-semibold text-foreground">{t.name}</p>
                <p className="mt-2 text-xs font-medium text-primary">
                  {t.metric}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA block */}
      <section className="border-t border-border/50 bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 py-16 sm:px-10 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-2xl text-center">
          <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Take back control of your revenue.
          </h3>
          <p className="mt-3 text-muted-foreground">
            Join 100+ gyms and studios. Claim your 14 days free trial—no credit card. We’ll get you set up.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href={LANDING_PHONE_TEL}
              className="landing-cta-primary"
            >
              <Phone className="mr-2 h-4 w-4" />
              Call now
            </a>
            <a
              href={LANDING_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="landing-cta-secondary"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp now
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Call or WhatsApp. We’re here—no bots, no runaround.
          </p>
        </div>
      </section>

      {/* Contact Us */}
      <section
        id="contact"
        className="border-t border-border/50 bg-card px-6 py-12 sm:px-10 lg:px-16 xl:px-24"
      >
        <div className="mx-auto max-w-xl">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">
            Contact us
          </h3>
          <p className="mt-2 text-muted-foreground">
            Call or WhatsApp. Free trial, setup help, or just a quick question—we’re here.
          </p>
          <p className="mt-4 text-lg font-semibold text-foreground">
            {LANDING_PHONE.replace(/(\+91)(\d{5})(\d{5})/, "$1 $2 $3")}
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <a
              href={LANDING_PHONE_TEL}
              className="landing-cta-primary"
            >
              <Phone className="mr-2 h-4 w-4" />
              Call now
            </a>
            <a
              href={LANDING_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="landing-cta-secondary"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp now
            </a>
          </div>
          <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4" />
            Secure · 99.9% uptime · Trusted by 100+ gyms and studios worldwide · Your data protected
          </p>
        </div>
      </section>
    </div>
  );
}
