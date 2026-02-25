"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  FileBarChart,
  Download,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  useReport,
  type ReportType,
  type ReportParams,
} from "@/hooks/use-report";

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  {
    value: "campaign_performance",
    label: "Campaign Performance",
    description: "Deep dive into campaign spending, top/bottom performers, and daily trends",
  },
  {
    value: "weekly_digest",
    label: "Weekly Digest",
    description: "Week-over-week comparison with key changes and anomalies",
  },
  {
    value: "platform_comparison",
    label: "Platform Comparison",
    description: "Cross-platform performance comparison and spend allocation",
  },
  {
    value: "custom",
    label: "Custom Report",
    description: "General overview with KPIs, trends, and top campaigns",
  },
];

const PLATFORMS = [
  "Meta",
  "Google Ads",
  "DV360",
  "TikTok",
  "The Trade Desk",
  "Snapchat",
  "Amazon DSP",
  "YouTube",
];

function getDefaultDateRange(): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split("T")[0];
  const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  return { from, to };
}

interface ReportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportSheet({ open, onOpenChange }: ReportSheetProps) {
  const defaults = getDefaultDateRange();
  const [reportType, setReportType] = useState<ReportType>("campaign_performance");
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [customDescription, setCustomDescription] = useState("");

  const { status, error, generate, downloadPdf, reset } = useReport();

  const handleGenerate = () => {
    const params: ReportParams = {
      report_type: reportType,
      date_from: dateFrom,
      date_to: dateTo,
      filters: selectedPlatforms.length > 0 ? { platforms: selectedPlatforms } : {},
      custom_description: customDescription,
    };
    generate(params);
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform],
    );
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) reset();
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        data-testid="report-sheet"
        className="sm:max-w-md overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-primary" />
            Generate Report
          </SheetTitle>
          <SheetDescription>
            Select a template, date range, and filters to generate a branded PDF report.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-1 pt-4">
          <div>
            <Label className="mb-2 block text-sm font-medium">Report Template</Label>
            <div className="grid gap-2">
              {REPORT_TYPES.map((rt) => (
                <button
                  key={rt.value}
                  type="button"
                  onClick={() => setReportType(rt.value)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    reportType === rt.value
                      ? "border-primary bg-accent"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                  disabled={status === "generating"}
                >
                  <div className="text-sm font-medium">{rt.label}</div>
                  <div className="text-xs text-muted-foreground">{rt.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date-from" className="mb-1 block text-sm">
                From
              </Label>
              <input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                disabled={status === "generating"}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="date-to" className="mb-1 block text-sm">
                To
              </Label>
              <input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                disabled={status === "generating"}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium">
              Platforms{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  disabled={status === "generating"}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    selectedPlatforms.includes(p)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-muted-foreground/30"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {reportType === "custom" && (
            <div>
              <Label htmlFor="custom-desc" className="mb-1 block text-sm">
                Description
              </Label>
              <textarea
                id="custom-desc"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                disabled={status === "generating"}
                placeholder="Describe what you want in this report..."
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          )}

          {status === "idle" && (
            <Button
              onClick={handleGenerate}
              className="w-full"
              data-testid="generate-report-btn"
            >
              <FileBarChart className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          )}

          {status === "generating" && (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-primary/20 bg-accent p-6">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">
                Generating your report...
              </p>
              <p className="text-xs text-muted-foreground">
                This may take up to a minute
              </p>
            </div>
          )}

          {status === "done" && (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Report ready!
              </p>
              <Button
                onClick={() => downloadPdf()}
                className="w-full"
                data-testid="download-report-btn"
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button
                variant="ghost"
                onClick={reset}
                className="w-full text-sm"
              >
                Generate another report
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
              <AlertCircle className="h-6 w-6 text-red-500 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <Button
                variant="ghost"
                onClick={reset}
                className="text-sm text-red-600 dark:text-red-400"
              >
                Try again
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
