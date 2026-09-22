import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, FileWarning, X } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAppData } from "@/state/AppDataContext";
import type { ReportVoteType } from "@/types";

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser, reports, reportVotes, voteOnReport } = useAppData();
  const [comment, setComment] = useState("");
  const report = reports.find((item) => item.id === id);

  if (!report) {
    return (
      <div>
        <div className="px-5 pt-6">
          <h1 className="font-display text-2xl font-semibold text-ink">Report not found</h1>
        </div>
        <div className="px-5">
          <EmptyState icon={FileWarning} title="We couldn't find that report" />
          <Link to="/reports" className="mt-4 block text-center text-sm font-medium text-sage-700">
            Back to reports
          </Link>
        </div>
      </div>
    );
  }

  const votes = reportVotes[report.id] ?? [];
  const agreeCount = votes.filter((vote) => vote.vote === "agree").length;
  const disagreeCount = votes.filter((vote) => vote.vote === "disagree").length;
  const isReporter = report.reportedBy === currentUser.userId;
  const isTarget = report.targetUserId === currentUser.userId;
  const alreadyVoted = votes.some((vote) => vote.userId === currentUser.userId);
  const canVote = !isReporter && !isTarget && report.status === "open";
  const reportId = report.id;

  function submitVote(vote: ReportVoteType) {
    if (!canVote) {
      return;
    }
    voteOnReport(reportId, vote, comment);
    setComment("");
  }

  return (
    <div>
      <div className="flex items-center gap-2 px-5 pt-6">
        <Link
          to="/reports"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5"
          aria-label="Back to reports"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </Link>
      </div>

      <div className="px-5 pb-2 pt-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold leading-tight text-ink">举报 {report.targetUserName}</h1>
          <StatusBadge status={report.status} />
        </div>
        <p className="mt-1 text-sm text-ink-soft">Reported by {report.reportedByName}</p>
      </div>

      <div className="flex flex-col gap-4 px-5">
        <section className="pinned-card">
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="flex-shrink-0 text-ink-soft">Comments</dt>
              <dd className="text-right text-ink">{report.comments}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Clears after</dt>
              <dd className="font-mono text-xs text-ink">{formatDate(report.expiresAt)}</dd>
            </div>
          </dl>
        </section>

        <section className="pinned-card">
          <p className="font-display text-base font-semibold text-ink">Vote summary</p>
          <p className="mt-1 text-sm text-ink-soft">
            {agreeCount} agree · {disagreeCount} disagree · needs {report.requiredAgreementCount} of{" "}
            {report.eligibleVoterCount}
          </p>

          {votes.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-2">
              {votes.map((vote) => (
                <li key={vote.userId} className="text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-ink">{vote.userName}</span>
                    <span className={`font-mono text-xs uppercase ${vote.vote === "agree" ? "text-sage-700" : "text-clay-700"}`}>
                      {vote.vote}
                    </span>
                  </div>
                  {vote.comment ? <p className="mt-0.5 text-ink-soft">{vote.comment}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">No votes yet.</p>
          )}
        </section>

        <section>
          <p className="mb-2 text-center text-xs text-ink-soft">
            {isReporter || isTarget ? "Reporter and reported member do not vote." : alreadyVoted ? "Your latest vote is recorded." : "Add a comment with your vote."}
          </p>
          {canVote ? (
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Comment optional"
              rows={2}
              className="mb-3 w-full rounded-card border border-ink/10 px-3 py-2 text-sm outline-none focus:border-sage-500"
            />
          ) : null}
          <div className="flex gap-3">
            <button
              type="button"
              disabled={!canVote}
              onClick={() => submitVote("disagree")}
              className="flex flex-1 items-center justify-center gap-2 rounded-card border-2 border-clay-500/40 py-3 font-medium text-clay-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
              Disagree
            </button>
            <button
              type="button"
              disabled={!canVote}
              onClick={() => submitVote("agree")}
              className="flex flex-1 items-center justify-center gap-2 rounded-card border-2 border-sage-500/50 py-3 font-medium text-sage-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
              Agree
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}
