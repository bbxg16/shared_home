import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, FileWarning, Plus, Trash2 } from "lucide-react";
import { AppHeader } from "@/components/common/AppHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAppData } from "@/state/AppDataContext";
import { useLanguage } from "@/state/LanguageContext";
import type { Report, ReportStatus } from "@/types";

type TabKey = "open" | "mine" | "history";

const TABS: { key: TabKey; label: string; statuses?: ReportStatus[] }[] = [
  { key: "open", label: "Open", statuses: ["open"] },
  { key: "mine", label: "Mine" },
  { key: "history", label: "History", statuses: ["agreed", "disagreed", "expired"] },
];

export function ReportsPage() {
  const {
    currentUser,
    currentHouse,
    error,
    isFirebaseMode,
    members,
    reports,
    reportVotes,
    weeklyReportSummaries,
    createReport,
    deleteReport,
  } = useAppData();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>("open");
  const [showForm, setShowForm] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportableMembers = members.filter((member) => member.userId !== currentUser.userId);

  const visibleReports = useMemo(() => {
    const tab = TABS.find((item) => item.key === activeTab)!;
    if (activeTab === "mine") {
      return reports.filter((report) => report.reportedBy === currentUser.userId || report.targetUserId === currentUser.userId);
    }
    return reports.filter((report) => tab.statuses?.includes(report.status));
  }, [activeTab, currentUser.userId, reports]);

  async function submitReport() {
    if (!targetUserId || !comments.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createReport({
        targetUserId,
        comments: comments.trim(),
      });
      setTargetUserId("");
      setComments("");
      setShowForm(false);
      setActiveTab("mine");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <AppHeader
        title={t("reports")}
        subtitle="Reports expire after 7 days"
        action={
          <button
            type="button"
            onClick={() => setShowForm((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white"
            aria-label="Create report"
          >
            <Plus className="h-5 w-5" strokeWidth={2.25} />
          </button>
        }
      />

      <div className="px-5 pb-3">
        <section className="pinned-card">
          <p className="mb-3 font-display text-base font-semibold text-ink">{t("weeklySummary")}</p>
          <div className="grid grid-cols-2 gap-2">
            {weeklyReportSummaries.map((summary) => (
              <div key={summary.userId} className="rounded-card bg-ink/[0.04] p-3">
                <p className="font-medium text-ink">{summary.userName}</p>
                <p className="font-mono text-xs text-ink-soft">
                  {summary.receivedCount} received · {summary.agreedCount} agreed
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="flex gap-1 px-5 pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key ? "bg-ink text-white" : "bg-white text-ink-soft"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 px-5">
        {isFirebaseMode && !currentHouse ? (
          <p className="rounded-card bg-honey-100 p-3 text-sm text-honey-700">{t("noHomeReport")}</p>
        ) : null}
        {error ? <p className="rounded-card bg-clay-100 p-3 text-sm text-clay-700">{error}</p> : null}

        {showForm ? (
          <section className="pinned-card flex flex-col gap-3">
            <select
              value={targetUserId}
              onChange={(event) => setTargetUserId(event.target.value)}
              className="rounded-card border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-sage-500"
            >
              <option value="">{t("chooseMember")}</option>
              {reportableMembers.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.displayName}
                </option>
              ))}
            </select>
            <textarea
              value={comments}
              onChange={(event) => setComments(event.target.value)}
              placeholder={t("comments")}
              rows={3}
              className="rounded-card border border-ink/10 px-3 py-2 text-sm outline-none focus:border-sage-500"
            />
            <button
              type="button"
              disabled={isSubmitting || (isFirebaseMode && !currentHouse)}
              onClick={() => void submitReport()}
              className="rounded-card bg-clay-500 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : t("submitReport")}
            </button>
          </section>
        ) : null}

        {visibleReports.length === 0 ? (
          <EmptyState icon={FileWarning} title="No reports here" description="Reports will show up as members vote." />
        ) : (
          visibleReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              agreeCount={(reportVotes[report.id] ?? []).filter((vote) => vote.vote === "agree").length}
              canDelete={report.reportedBy === currentUser.userId}
              onDelete={() => deleteReport(report.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ReportCard({
  report,
  agreeCount,
  canDelete,
  onDelete,
}: {
  report: Report;
  agreeCount: number;
  canDelete: boolean;
  onDelete: () => Promise<void>;
}) {
  const { t } = useLanguage();

  async function handleDelete() {
    if (!window.confirm(t("confirmDeleteReport"))) {
      return;
    }
    await onDelete();
  }

  return (
    <article className="pinned-card">
      <Link to={`/reports/${report.id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold leading-tight text-ink">{report.targetUserName}</p>
            <p className="mt-0.5 text-sm text-ink-soft">Reported by {report.reportedByName}</p>
          </div>
          <StatusBadge status={report.status} />
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{report.comments}</p>
      </Link>
      <div className="mt-3 flex items-center justify-between gap-3 text-sm text-ink-soft">
        <Link to={`/reports/${report.id}`} className="min-w-0 flex-1">
          <span>Clears {formatDate(report.expiresAt)}</span>
          <span className="ml-2 inline-flex items-center gap-1 font-mono text-xs">
            {agreeCount}/{report.requiredAgreementCount}
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
        </Link>
        {canDelete ? (
          <button
            type="button"
            onClick={() => void handleDelete()}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-clay-700 hover:bg-clay-100"
            aria-label={t("deleteReport")}
            title={t("deleteReport")}
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
          </button>
        ) : null}
      </div>
    </article>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}
