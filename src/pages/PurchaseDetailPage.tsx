import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, ExternalLink, Tags, Trash2, X } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAppData } from "@/state/AppDataContext";
import { useLanguage } from "@/state/LanguageContext";
import type { VoteType } from "@/types";

export function PurchaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { currentUser, purchases, purchaseVotes, voteOnPurchase, deletePurchaseRequest } = useAppData();
  const [comment, setComment] = useState("");
  const purchase = purchases.find((item) => item.id === id);

  if (!purchase) {
    return (
      <div>
        <div className="px-5 pt-6">
          <h1 className="font-display text-2xl font-semibold text-ink">Request not found</h1>
        </div>
        <div className="px-5">
          <EmptyState icon={Tags} title="We couldn't find that request" />
          <Link to="/purchases" className="mt-4 block text-center text-sm font-medium text-sage-700">
            Back to requests
          </Link>
        </div>
      </div>
    );
  }

  const votes = purchaseVotes[purchase.id] ?? [];
  const approveCount = votes.filter((vote) => vote.vote === "approve").length;
  const rejectCount = votes.filter((vote) => vote.vote === "reject").length;
  const isRequester = purchase.requestedBy === currentUser.userId;
  const alreadyVoted = votes.some((vote) => vote.userId === currentUser.userId);
  const canVote = !isRequester && purchase.status === "pending";
  const purchaseId = purchase.id;

  function submitVote(vote: VoteType) {
    if (!canVote) {
      return;
    }
    voteOnPurchase(purchaseId, vote, comment);
    setComment("");
  }

  async function handleDelete() {
    if (!window.confirm(t("confirmDeleteRequest"))) {
      return;
    }
    await deletePurchaseRequest(purchaseId);
    navigate("/purchases");
  }

  return (
    <div>
      <div className="flex items-center gap-2 px-5 pt-6">
        <Link
          to="/purchases"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5"
          aria-label="Back to requests"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </Link>
      </div>

      <div className="px-5 pb-2 pt-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold leading-tight text-ink">{purchase.name}</h1>
          <StatusBadge status={purchase.status} />
        </div>
        <p className="mt-1 text-sm text-ink-soft">Requested by {purchase.requestedByName}</p>
      </div>

      <div className="flex flex-col gap-4 px-5">
        {isRequester ? (
          <button
            type="button"
            onClick={() => void handleDelete()}
            className="flex items-center justify-center gap-2 rounded-card border border-clay-500/40 bg-white py-2.5 text-sm font-medium text-clay-700"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            {t("deleteRequest")}
          </button>
        ) : null}

        <section className="pinned-card">
          <dl className="flex flex-col gap-2 text-sm">
            {purchase.price ? (
              <div className="flex justify-between">
                <dt className="text-ink-soft">Price</dt>
                <dd className="font-mono font-medium text-ink">{purchase.price}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="flex-shrink-0 text-ink-soft">Description</dt>
              <dd className="text-right text-ink">{purchase.description}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Clears after</dt>
              <dd className="font-mono text-xs text-ink">{formatDate(purchase.expiresAt)}</dd>
            </div>
            {purchase.productUrl ? (
              <a
                href={purchase.productUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 flex items-center justify-between text-harbor-500"
              >
                View product link
                <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
              </a>
            ) : null}
          </dl>
        </section>

        <section className="pinned-card">
          <p className="font-display text-base font-semibold text-ink">Approval summary</p>
          <p className="mt-1 text-sm text-ink-soft">
            {approveCount} approve · {rejectCount} reject · needs {purchase.requiredApprovals} of{" "}
            {purchase.eligibleVoterCount}
          </p>

          {votes.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-2">
              {votes.map((vote) => (
                <li key={vote.userId} className="text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-ink">{vote.userName}</span>
                    <span className={`font-mono text-xs uppercase ${vote.vote === "approve" ? "text-sage-700" : "text-clay-700"}`}>
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
            {isRequester ? "You can track status here. Other members vote." : alreadyVoted ? "Your latest vote is recorded." : "Add a comment with your vote."}
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
              onClick={() => submitVote("reject")}
              className="flex flex-1 items-center justify-center gap-2 rounded-card border-2 border-clay-500/40 py-3 font-medium text-clay-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
              Reject
            </button>
            <button
              type="button"
              disabled={!canVote}
              onClick={() => submitVote("approve")}
              className="flex flex-1 items-center justify-center gap-2 rounded-card border-2 border-sage-500/50 py-3 font-medium text-sage-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
              Approve
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
