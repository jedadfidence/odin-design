"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AnimationPhase = "idle" | "shimmer" | "cascade" | "done";

export interface AISummaryProps {
  variant: "full" | "compact";
  text: string;
  shimmerDuration?: number;
  initialDelay?: number;
  onDismiss?: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Mock AI Responses
// ---------------------------------------------------------------------------

type AIAction = "explain" | "summarize" | "analyze";

const WIDGET_RESPONSES: Record<string, Record<AIAction, string>> = {
  "kpi-revenue": {
    explain:
      "Revenue represents the total income generated from all product lines before expenses. This KPI tracks gross revenue on a rolling 30-day basis.",
    summarize:
      "Revenue is up 12% month-over-month, reaching $1.24M. Growth is primarily driven by enterprise plan upgrades.",
    analyze:
      "Revenue growth has accelerated for 3 consecutive months. The enterprise segment accounts for 68% of new revenue. Churn-adjusted net revenue retention is 118%, indicating strong expansion within existing accounts.",
  },
  "kpi-users": {
    explain:
      "Active users measures unique accounts that performed at least one meaningful action in the last 30 days, excluding bot and test accounts.",
    summarize:
      "Active users reached 45.2K, up 8% from last month. Mobile users now represent 62% of all active sessions.",
    analyze:
      "User growth is steady but slowing — the 8% MoM rate is down from 11% two months ago. Retention at day-30 improved to 42%, suggesting better onboarding. Power users (5+ sessions/week) grew 15%, a positive signal for long-term engagement.",
  },
  "kpi-conversion": {
    explain:
      "Conversion rate tracks the percentage of free-trial users who upgrade to a paid plan within their 14-day trial window.",
    summarize:
      "Trial-to-paid conversion is 3.2%, up 0.4pp from last month. The new onboarding flow appears to be contributing.",
    analyze:
      "Conversion improved across all cohorts. Users who complete the guided setup convert at 5.8% vs 1.9% for those who skip it. Recommend making the guided setup the default path and A/B testing a 21-day trial window.",
  },
  "revenue-chart": {
    explain:
      "This chart shows daily revenue over the selected time range, broken down by plan tier (free, pro, enterprise).",
    summarize:
      "Revenue shows a steady upward trend with weekly seasonality. Enterprise revenue grew fastest at 18% MoM.",
    analyze:
      "Weekend revenue dips average 22% — mostly from SMB segments. Enterprise revenue is remarkably stable day-to-day. There's a notable spike around the 15th of each month correlating with billing cycles. Consider aligning promotions with these natural peaks.",
  },
  "user-activity": {
    explain:
      "The user activity chart tracks daily active users (DAU) and weekly active users (WAU) with engagement intensity heatmapping.",
    summarize:
      "DAU/WAU ratio is 0.38, indicating healthy but not exceptional stickiness. Peak activity occurs Tuesday–Thursday.",
    analyze:
      "Engagement follows a strong weekday pattern with 3x higher activity on Tuesdays vs Sundays. Session duration increased 12% after the latest release. The DAU/WAU ratio of 0.38 is above the 0.3 benchmark but below best-in-class (0.5+). Focus on weekend engagement could significantly move this metric.",
  },
  transactions: {
    explain:
      "The transactions table lists individual payment events including amount, status, customer, and timestamp for audit and reconciliation.",
    summarize:
      "847 transactions processed today totaling $128.4K. Failure rate is 1.2%, within normal bounds. Average transaction value is $151.60.",
    analyze:
      "Transaction volume is up 14% but average value dropped 3%, suggesting more small-value purchases. Failed transactions cluster around 2–4 AM UTC — likely a payment processor maintenance window. Three customers account for 18% of total volume; concentration risk should be monitored.",
  },
};

const SECTION_RESPONSES: Record<string, Record<AIAction, string>> = {
  kpis: {
    explain:
      "Key Performance Indicators provide a high-level snapshot of business health across revenue, user growth, and conversion efficiency.",
    summarize:
      "All three KPIs are trending positive. Revenue leads at +12%, users at +8%, and conversion improved by 0.4 percentage points.",
    analyze:
      "The KPI trifecta is aligned — revenue growth outpaces user growth, meaning ARPU is expanding. Conversion gains amplify this effect. If current trends hold, you're on track to exceed Q1 targets by ~8%. The main risk is the deceleration in user acquisition.",
  },
  analytics: {
    explain:
      "The analytics section combines revenue trends and user activity patterns to give a comprehensive view of product-market fit and growth dynamics.",
    summarize:
      "Revenue and engagement are both growing. Revenue is up 12% with enterprise leading, while DAU/WAU ratio sits at 0.38 with strong weekday patterns.",
    analyze:
      "Revenue and engagement metrics are positively correlated (r=0.73), confirming that product usage drives monetization. The weekday-heavy engagement pattern suggests this is primarily a work tool — weekend campaigns may have limited ROI. Focus on deepening weekday habits instead.",
  },
  transactions: {
    explain:
      "The transactions section provides a detailed ledger of all payment activity, enabling financial reconciliation and anomaly detection.",
    summarize:
      "Transaction volume is healthy at 847/day with a 1.2% failure rate. Total daily throughput is $128.4K with no anomalies detected.",
    analyze:
      "Transaction health is good but not optimal. The 1.2% failure rate costs ~$1.5K/day in failed revenue. Implementing automatic retry with exponential backoff could recover 60–70% of failures. Customer concentration (top 3 = 18%) warrants a key-account risk framework.",
  },
};

export function getMockResponse(
  widgetId: string,
  action: AIAction,
): string {
  return (
    WIDGET_RESPONSES[widgetId]?.[action] ??
    "No analysis available for this widget."
  );
}

export function getSectionMockResponse(
  section: string,
  action: AIAction,
): string {
  const key = section.toLowerCase();
  return (
    SECTION_RESPONSES[key]?.[action] ??
    "No analysis available for this section."
  );
}

// ---------------------------------------------------------------------------
// Shimmer Skeleton
// ---------------------------------------------------------------------------

function ShimmerSkeleton({ className }: { className?: string }) {
  return (
    <>
      <style>
        {`
          @keyframes ai-shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}
      </style>
      <div className={cn("space-y-2", className)}>
        <div
          className="h-3 w-full rounded"
          style={{
            background:
              "linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted-foreground) / 0.08) 50%, hsl(var(--muted)) 75%)",
            backgroundSize: "200% 100%",
            animation: "ai-shimmer 1.5s ease-in-out infinite",
          }}
        />
        <div
          className="h-3 w-4/5 rounded"
          style={{
            background:
              "linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted-foreground) / 0.08) 50%, hsl(var(--muted)) 75%)",
            backgroundSize: "200% 100%",
            animation: "ai-shimmer 1.5s ease-in-out infinite",
            animationDelay: "0.15s",
          }}
        />
        <div
          className="h-3 w-3/5 rounded"
          style={{
            background:
              "linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted-foreground) / 0.08) 50%, hsl(var(--muted)) 75%)",
            backgroundSize: "200% 100%",
            animation: "ai-shimmer 1.5s ease-in-out infinite",
            animationDelay: "0.3s",
          }}
        />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Word Cascade
// ---------------------------------------------------------------------------

function WordCascade({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const words = text.split(" ");

  return (
    <p className={cn("text-sm leading-relaxed", className)}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: i * 0.035,
            duration: 0.25,
            ease: "easeOut",
          }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </p>
  );
}

// ---------------------------------------------------------------------------
// AI Summary Component
// ---------------------------------------------------------------------------

export function AISummary({
  variant,
  text,
  shimmerDuration = 1500,
  initialDelay = 0,
  onDismiss,
  className,
}: AISummaryProps) {
  const [phase, setPhase] = useState<AnimationPhase>("idle");
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [text]);

  const startAnimation = useCallback(() => {
    setPhase("shimmer");

    const shimmerTimer = setTimeout(() => {
      setPhase("cascade");
    }, shimmerDuration);

    return () => clearTimeout(shimmerTimer);
  }, [shimmerDuration]);

  useEffect(() => {
    if (initialDelay > 0) {
      const delayTimer = setTimeout(startAnimation, initialDelay);
      return () => clearTimeout(delayTimer);
    } else {
      const cleanup = startAnimation();
      return cleanup;
    }
  }, [initialDelay, startAnimation]);

  // Transition from cascade → done after all words have animated
  useEffect(() => {
    if (phase !== "cascade") return;

    const wordCount = text.split(" ").length;
    const cascadeDuration = wordCount * 35 + 300; // 35ms per word + buffer

    const doneTimer = setTimeout(() => {
      setPhase("done");
    }, cascadeDuration);

    return () => clearTimeout(doneTimer);
  }, [phase, text]);

  if (variant === "full") {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "relative rounded-lg border bg-card p-4 shadow-sm",
          className,
        )}
      >
        <div className="absolute right-2 top-2 flex items-center gap-0.5">
          {(phase === "cascade" || phase === "done") && (
            <button
              onClick={handleCopy}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Copy summary"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Dismiss summary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs text-primary">AI</span>
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            AI Summary
          </span>
        </div>

        <AnimatePresence mode="wait">
          {(phase === "idle" || phase === "shimmer") && (
            <motion.div
              key="shimmer"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ShimmerSkeleton />
            </motion.div>
          )}
          {(phase === "cascade" || phase === "done") && (
            <motion.div
              key="cascade"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <WordCascade text={text} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Compact variant (inline per-widget)
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "mt-2 rounded-md bg-muted/50 px-3 py-2",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          AI Insight
        </span>
        <div className="flex items-center gap-0.5">
          {(phase === "cascade" || phase === "done") && (
            <button
              onClick={handleCopy}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Copy insight"
            >
              {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Dismiss insight"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {(phase === "idle" || phase === "shimmer") && (
          <motion.div
            key="shimmer"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ShimmerSkeleton className="space-y-1.5" />
          </motion.div>
        )}
        {(phase === "cascade" || phase === "done") && (
          <motion.div
            key="cascade"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <WordCascade
              text={text}
              className="text-xs leading-relaxed"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
