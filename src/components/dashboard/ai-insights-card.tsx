"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { getDashboardInsights, type DashboardInsightInput } from "@/lib/ai-insights";

type Props = DashboardInsightInput;

export function AIInsightsCard(props: Props) {
  const insights = getDashboardInsights(props);

  if (insights.length === 0) return null;

  return (
    <Card className="min-w-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
      <CardHeader className="min-w-0">
        <CardTitle className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5 shrink-0 text-primary" />
          </span>
          AI Insights
        </CardTitle>
        <p className="mt-0.5 text-sm font-medium text-muted-foreground">
          Smart analysis of your gym performance
        </p>
      </CardHeader>
      <CardContent className="min-w-0 overflow-hidden">
        <ul className="min-w-0 space-y-2">
          {insights.map((text, i) => (
            <li key={i} className="flex min-w-0 gap-2 rounded-lg py-1.5 text-sm transition-colors hover:bg-muted/50">
              <span className="mt-0.5 shrink-0 font-semibold text-primary">•</span>
              <span className="min-w-0 flex-1 font-medium text-muted-foreground">{text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
