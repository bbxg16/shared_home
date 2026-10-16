import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, FileWarning, Pencil, Trash2, X } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAppData } from "@/state/AppDataContext";
import { useLanguage } from "@/state/LanguageContext";
import type { ReportVoteType } from "@/types";

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { currentUser, reports, reportVotes, voteOnReport, updateReport, deleteReport, respondToReport } = useAppData();
  const [comment, setComment] = useState("");
  const [isEditingReport, setIsEditingReport] = useState(false);
  const [editComments, setEditComments] = useState("");
  const [targetResponse, setTargetResponse] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const report = reports.find((item) => item.id === id);
  const votes = reportVotes[report?.id ?? ""] ?? [];
  const currentVote = votes.find((vote) => vote.userId === currentUser.userId);

  useEffect(() => {
    setTargetResponse(report?.targetResponse ?? "");
  }, [report?.targetResponse]);

  useEffect(() => {
    if (!report || isEditingReport) {
      return;
    }
    setEditComments(report.comments);
    setEditMessage(null);
  }, [isEditingReport, report]);

  useEffect(() => {
    setComment(currentVote?.comment ?? "");
  }, [currentVote?.comment, currentVote?.vote, report?.id]);

  if (!report) {
    return (
      <div>
        <div className="px-5 pt-6">
          <h1 className="font-display text-2xl font-semibold text-ink">{t("reportNotFound")}</h1>
        </div>
        <div className="px-5">
          <EmptyState icon={FileWarning} title={t("reportNotFoundDescription")} />
          <Link to="/reports" className="mt-4 block text-center text-sm font-medium text-sage-700">
            {t("backToReports")}
          </Link>
        </div>
      </div>
    );
  }

  const agreeCount = votes.filter((vote) => vote.vote === "agree").length;
  const disagreeCount = votes.filter((vote) => vote.vote === "disagree").length;
  const totalVoteCount = votes.length;
  const isReporter = report.reportedBy === currentUser.userId;
  const isTarget = report.targetUserId === currentUser.userId;
  const canVote = report.status !== "expired";
  const reportId = report.id;

  function submitVote(vote: ReportVoteType) {
    if (!canVote) {
      return;
    }
    voteOnReport(reportId, vote, comment);
  }

  async function handleDelete() {
    if (!window.confirm(t("confirmDeleteReport"))) {
      return;
    }
    await deleteReport(reportId);
    navigate("/reports");
  }

  function startEditingReport() {
    if (!report) {
      return;
    }
    setEditComments(report.comments);
    setEditMessage(null);
    setIsEditingReport(true);
  }

  async function handleSaveReportEdit() {
    if (!editComments.trim()) {
      return;
    }

    setIsSavingEdit(true);
    setEditMessage(null);
    try {
      await updateReport(reportId, { comments: editComments.trim() });
      setIsEditingReport(false);
      setEditMessage(t("postUpdated"));
    } catch (error) {
      setEditMessage(error instanceof Error ? error.message : t("couldNotUpdatePost"));
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleSaveResponse() {
    setMessage(null);
    try {
      await respondToReport(reportId, targetResponse);
      setMessage(t("responseSaved"));
    } catch (responseError) {
      setMessage(responseError instanceof Error ? responseError.message : t("couldNotSaveResponse"));
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 px-5 pt-6">
        <Link
          to="/reports"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5"
          aria-label={t("backToReports")}
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </Link>
      </div>

      <div className="px-5 pb-2 pt-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold leading-tight text-ink">
            {t("reportTitle").replace("{name}", report.targetUserName)}
          </h1>
          <StatusBadge status={report.status} />
        </div>
        <p className="mt-1 text-sm text-ink-soft">{t("reportedBy").replace("{name}", report.reportedByName)}</p>
      </div>

      <div className="flex flex-col gap-4 px-5">
        {isReporter ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={isEditingReport ? () => setIsEditingReport(false) : startEditingReport}
              className="flex items-center justify-center gap-2 rounded-card border border-sage-500/40 bg-white py-2.5 text-sm font-medium text-sage-700"
            >
              <Pencil className="h-4 w-4" strokeWidth={1.75} />
              {isEditingReport ? t("cancel") : t("editPost")}
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              className="flex items-center justify-center gap-2 rounded-card border border-clay-500/40 bg-white py-2.5 text-sm font-medium text-clay-700"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              {t("deleteReport")}
            </button>
          </div>
        ) : null}

        {isEditingReport ? (
          <section className="pinned-card flex flex-col gap-3">
            <textarea
              value={editComments}
              onChange={(event) => setEditComments(event.target.value)}
              placeholder={t("comments")}
              rows={3}
              className="rounded-card border border-ink/10 px-3 py-2 text-sm outline-none focus:border-sage-500"
            />
            <button
              type="button"
              disabled={isSavingEdit || !editComments.trim()}
              onClick={() => void handleSaveReportEdit()}
              className="rounded-card bg-sage-500 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSavingEdit ? t("working") : t("saveChanges")}
            </button>
            {editMessage ? <p className="text-sm text-ink-soft">{editMessage}</p> : null}
          </section>
        ) : null}

        <section className="pinned-card memorial-note">
          <dl className="flex flex-col text-left text-sm">
            <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-baseline gap-x-4 sm:grid-cols-[6rem_minmax(0,1fr)]">
              <dt className="text-ink-soft">{t("comments")}</dt>
              <dd className="min-w-0 whitespace-pre-wrap break-words leading-6 text-ink">{report.comments}</dd>
            </div>
          </dl>
          <p className="mt-5 border-t border-ink/[0.06] pt-3 text-left text-xs text-ink-soft">
            {t("clearsAfter")} · {formatDate(report.expiresAt, language)}
          </p>
        </section>

        {isTarget || report.targetResponse ? (
          <section className="pinned-card">
            <p className="font-display text-base font-semibold text-ink">{t("targetResponse")}</p>
            {isTarget ? (
              <>
                <textarea
                  value={targetResponse}
                  onChange={(event) => setTargetResponse(event.target.value)}
                  placeholder={t("targetResponsePlaceholder")}
                  rows={3}
                  className="mt-3 w-full rounded-card border border-ink/10 px-3 py-2 text-sm outline-none focus:border-sage-500"
                />
                <button
                  type="button"
                  disabled={!targetResponse.trim()}
                  onClick={() => void handleSaveResponse()}
                  className="mt-3 w-full rounded-card bg-sage-500 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                >
                  {t("saveResponse")}
                </button>
                {message ? <p className="mt-2 text-sm text-ink-soft">{message}</p> : null}
              </>
            ) : (
              <p className="mt-2 text-sm text-ink-soft">{report.targetResponse}</p>
            )}
            {report.targetRespondedAt ? (
              <p className="mt-2 font-mono text-xs text-ink-soft">{formatDate(report.targetRespondedAt, language)}</p>
            ) : null}
          </section>
        ) : null}

        <section className="pinned-card">
          <p className="font-display text-base font-semibold text-ink">{t("reviewMemorial")}</p>
          <p className="mt-1 text-sm text-ink-soft">
            {t("approvalProgress")
              .replace("{positive}", String(agreeCount))
              .replace("{positiveLabel}", t("agreeAction"))
              .replace("{negative}", String(disagreeCount))
              .replace("{negativeLabel}", t("disagreeAction"))
              .replace("{totalVotes}", String(totalVoteCount))
              .replace("{totalVoters}", String(report.eligibleVoterCount))}
          </p>

          {votes.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-2">
              {votes.map((vote) => (
                <li key={vote.userId} className="rounded-card bg-ink/[0.04] px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate font-medium text-ink">
                      {vote.userId === currentUser.userId ? t("currentUser") : vote.userName}
                    </span>
                    <span
                      className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        vote.vote === "agree" ? "bg-sage-100 text-sage-700" : "bg-clay-100 text-clay-700"
                      }`}
                    >
                      {vote.vote === "agree" ? t("agreeAction") : t("disagreeAction")}
                    </span>
                  </div>
                  {vote.comment ? <p className="mt-2 whitespace-pre-wrap leading-relaxed text-ink-soft">{vote.comment}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">{t("noVoteDetails")}</p>
          )}
        </section>

        <section>
          <p className="mb-2 text-center text-xs text-ink-soft">
            {currentVote ? t("changeVoteHint") : t("voteHint")}
          </p>
          {canVote ? (
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={t("commentOptional")}
              rows={2}
              className="mb-3 w-full rounded-card border border-ink/10 px-3 py-2 text-sm outline-none focus:border-sage-500"
            />
          ) : null}
          <div className="flex gap-3">
            <button
              type="button"
              disabled={!canVote}
              onClick={() => submitVote("disagree")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-card border-2 py-3 font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                currentVote?.vote === "disagree"
                  ? "border-clay-500 bg-clay-100 text-clay-700"
                  : "border-clay-500/40 text-clay-700"
              }`}
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
              {t("disagreeAction")}
            </button>
            <button
              type="button"
              disabled={!canVote}
              onClick={() => submitVote("agree")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-card border-2 py-3 font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                currentVote?.vote === "agree"
                  ? "border-sage-500 bg-sage-100 text-sage-700"
                  : "border-sage-500/50 text-sage-700"
              }`}
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
              {t("agreeAction")}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function formatDate(value: string, language: string) {
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en", { month: "short", day: "numeric" }).format(new Date(value));
}
