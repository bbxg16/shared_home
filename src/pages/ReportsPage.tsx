import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, FileWarning, Plus, Trash2 } from "lucide-react";
import { AppHeader } from "@/components/common/AppHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAppData } from "@/state/AppDataContext";
import { useLanguage } from "@/state/LanguageContext";
import type { Report, ReportVote, WeeklyReportSummary } from "@/types";

type TabKey = "all" | "mine";

const TABS: { key: TabKey; labelKey: "all" | "mine" }[] = [
  { key: "all", labelKey: "all" },
  { key: "mine", labelKey: "mine" },
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
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [showForm, setShowForm] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportableMembers = members.filter((member) => member.userId !== currentUser.userId);

  const visibleReports = useMemo(() => {
    const activeStatuses = new Set(["open", "agreed", "disagreed"]);
    const visible = reports.filter((report) => activeStatuses.has(report.status));
    if (activeTab === "mine") {
      return sortReports(
        visible.filter((report) => report.reportedBy === currentUser.userId || report.targetUserId === currentUser.userId)
      );
    }
    return sortReports(visible);
  }, [activeTab, currentUser.userId, reports]);

  const openReports = visibleReports.filter((report) => report.status === "open");
  const resolvedReports = visibleReports.filter((report) => report.status !== "open");

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
        subtitle={t("reportExpiry")}
        action={
          <button
            type="button"
            onClick={() => setShowForm((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white"
            aria-label={t("createReport")}
          >
            <Plus className="h-5 w-5" strokeWidth={2.25} />
          </button>
        }
      />

      <div className="px-5 pb-3">
        <WeeklyReportChart summaries={weeklyReportSummaries} />
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
            {t(tab.labelKey)}
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
              {isSubmitting ? t("submitting") : t("submitReport")}
            </button>
          </section>
        ) : null}

        {visibleReports.length === 0 ? (
          <EmptyState icon={FileWarning} title={t("noReportsTitle")} description={t("noReportsDescription")} />
        ) : (
          <>
            {openReports.length > 0 ? (
              <ReportSection
                title={t("activeMemorials")}
                reports={openReports}
                reportVotes={reportVotes}
                currentUserId={currentUser.userId}
                onDelete={deleteReport}
              />
            ) : null}
            {resolvedReports.length > 0 ? (
              <ReportSection
                title={t("resolvedMemorials")}
                reports={resolvedReports}
                reportVotes={reportVotes}
                currentUserId={currentUser.userId}
                onDelete={deleteReport}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function WeeklyReportChart({ summaries }: { summaries: WeeklyReportSummary[] }) {
  const { t } = useLanguage();
  const sortedSummaries = [...summaries].sort((left, right) => right.receivedCount - left.receivedCount);
  const maxReceived = Math.max(...sortedSummaries.map((summary) => summary.receivedCount), 0);

  return (
    <section className="pinned-card">
      <p className="mb-3 font-display text-base font-semibold text-ink">{t("weeklySummary")}</p>
      {maxReceived === 0 ? (
        <p className="text-sm text-ink-soft">{t("weeklySummaryEmpty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sortedSummaries.map((summary) => {
            const width = summary.receivedCount === 0 ? "0%" : `${Math.max((summary.receivedCount / maxReceived) * 100, 8)}%`;
            return (
              <li key={summary.userId}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-ink">{summary.userName}</span>
                  <span className="font-mono text-xs text-ink-soft">
                    {t("receivedReportsCount").replace("{count}", String(summary.receivedCount))}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-ink/[0.06]">
                  <div className="h-full rounded-full bg-clay-500" style={{ width }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ReportSection({
  title,
  reports,
  reportVotes,
  currentUserId,
  onDelete,
}: {
  title: string;
  reports: Report[];
  reportVotes: Record<string, ReportVote[]>;
  currentUserId: string;
  onDelete: (reportId: string) => Promise<void>;
}) {
  return (
    <section className="flex flex-col gap-3">
      <p className="px-1 text-xs font-medium uppercase tracking-wide text-ink-soft">{title}</p>
      {reports.map((report) => (
        <ReportCard
          key={report.id}
          report={report}
          agreeCount={(reportVotes[report.id] ?? []).filter((vote) => vote.vote === "agree").length}
          totalVoteCount={(reportVotes[report.id] ?? []).length}
          canDelete={report.reportedBy === currentUserId}
          onDelete={() => onDelete(report.id)}
        />
      ))}
    </section>
  );
}

function ReportCard({
  report,
  agreeCount,
  totalVoteCount,
  canDelete,
  onDelete,
}: {
  report: Report;
  agreeCount: number;
  totalVoteCount: number;
  canDelete: boolean;
  onDelete: () => Promise<void>;
}) {
  const { language, t } = useLanguage();

  async function handleDelete() {
    if (!window.confirm(t("confirmDeleteReport"))) {
      return;
    }
    await onDelete();
  }

  return (
    <article className={`pinned-card ${report.status === "open" ? "border border-clay-300 bg-clay-100/45" : ""}`}>
      <Link to={`/reports/${report.id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold leading-tight text-ink">{report.targetUserName}</p>
            <p className="mt-0.5 text-sm text-ink-soft">{t("reportedBy").replace("{name}", report.reportedByName)}</p>
          </div>
          <StatusBadge status={report.status} />
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{report.comments}</p>
      </Link>
      <div className="mt-3 flex items-center justify-between gap-3 text-sm text-ink-soft">
        <Link to={`/reports/${report.id}`} className="min-w-0 flex-1">
          <span>{t("clears").replace("{date}", formatDate(report.expiresAt, language))}</span>
          <span className="ml-2 inline-flex items-center gap-1 font-mono text-xs">
            {t("cardVoteSummary")
              .replace("{positiveLabel}", t("agreeAction"))
              .replace("{positive}", String(agreeCount))
              .replace("{totalVotes}", String(totalVoteCount))
              .replace("{totalVoters}", String(report.eligibleVoterCount))}
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

function formatDate(value: string, language: string) {
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en", { month: "short", day: "numeric" }).format(new Date(value));
}

function sortReports(reports: Report[]) {
  return [...reports].sort((left, right) => {
    const leftActive = left.status === "open" ? 1 : 0;
    const rightActive = right.status === "open" ? 1 : 0;
    if (leftActive !== rightActive) {
      return rightActive - leftActive;
    }
    return new Date(right.lastActivityAt).getTime() - new Date(left.lastActivityAt).getTime();
  });
}
