import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Copy, Tags, Trash2, X } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAppData } from "@/state/AppDataContext";
import { useLanguage } from "@/state/LanguageContext";
import type { VoteType } from "@/types";

export function PurchaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { currentUser, purchases, purchaseVotes, voteOnPurchase, deletePurchaseRequest } = useAppData();
  const [comment, setComment] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const purchase = purchases.find((item) => item.id === id);
  const votes = purchaseVotes[purchase?.id ?? ""] ?? [];
  const currentVote = votes.find((vote) => vote.userId === currentUser.userId);

  useEffect(() => {
    setComment(currentVote?.comment ?? "");
  }, [currentVote?.comment, currentVote?.vote, purchase?.id]);

  if (!purchase) {
    return (
      <div>
        <div className="px-5 pt-6">
          <h1 className="font-display text-2xl font-semibold text-ink">{t("requestNotFound")}</h1>
        </div>
        <div className="px-5">
          <EmptyState icon={Tags} title={t("requestNotFoundDescription")} />
          <Link to="/purchases" className="mt-4 block text-center text-sm font-medium text-sage-700">
            {t("backToRequests")}
          </Link>
        </div>
      </div>
    );
  }

  const approveCount = votes.filter((vote) => vote.vote === "approve").length;
  const rejectCount = votes.filter((vote) => vote.vote === "reject").length;
  const totalVoteCount = votes.length;
  const pendingVoteCount = Math.max(purchase.eligibleVoterCount - totalVoteCount, 0);
  const isRequester = purchase.requestedBy === currentUser.userId;
  const canVote = !isRequester && purchase.status !== "expired";
  const purchaseId = purchase.id;
  const productUrl = purchase.productUrl;

  function submitVote(vote: VoteType) {
    if (!canVote) {
      return;
    }
    voteOnPurchase(purchaseId, vote, comment);
  }

  async function handleDelete() {
    if (!window.confirm(t("confirmDeleteRequest"))) {
      return;
    }
    await deletePurchaseRequest(purchaseId);
    navigate("/purchases");
  }

  async function copyProductLink() {
    if (!productUrl) {
      return;
    }

    await navigator.clipboard.writeText(productUrl);
    setCopyMessage(t("copiedProductLink"));
    window.setTimeout(() => setCopyMessage(""), 1800);
  }

  return (
    <div>
      <div className="flex items-center gap-2 px-5 pt-6">
        <Link
          to="/purchases"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5"
          aria-label={t("backToRequests")}
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </Link>
      </div>

      <div className="px-5 pb-2 pt-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold leading-tight text-ink">{purchase.name}</h1>
          <StatusBadge status={purchase.status} />
        </div>
        <p className="mt-1 text-sm text-ink-soft">{t("requestedBy").replace("{name}", purchase.requestedByName)}</p>
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
                <dt className="text-ink-soft">{t("price")}</dt>
                <dd className="font-mono font-medium text-ink">{purchase.price}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="flex-shrink-0 text-ink-soft">{t("description")}</dt>
              <dd className="text-right text-ink">{purchase.description}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">{t("clearsAfter")}</dt>
              <dd className="font-mono text-xs text-ink">{formatDate(purchase.expiresAt, language)}</dd>
            </div>
            {productUrl ? (
              <div className="mt-1 rounded-card bg-ink/[0.04] p-3">
                <dt className="text-ink-soft">{t("productLink")}</dt>
                <dd className="mt-1 select-text break-all font-mono text-xs leading-relaxed text-ink">
                  {productUrl}
                </dd>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void copyProductLink()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-card bg-ink py-2 text-sm font-medium text-white"
                  >
                    <Copy className="h-4 w-4" strokeWidth={1.75} />
                    {t("copyProductLink")}
                  </button>
                </div>
                {copyMessage ? <p className="mt-2 text-center text-xs text-sage-700">{copyMessage}</p> : null}
              </div>
            ) : null}
          </dl>
          {purchase.imageDataUrl ? (
            <img
              src={purchase.imageDataUrl}
              alt={purchase.name}
              className="mt-3 max-h-[420px] w-full rounded-card object-cover"
            />
          ) : null}
        </section>

        <section className="pinned-card">
          <p className="font-display text-base font-semibold text-ink">{t("reviewMemorial")}</p>
          <p className="mt-1 text-sm text-ink-soft">
            {t("approvalProgress")
              .replace("{positive}", String(approveCount))
              .replace("{positiveLabel}", t("approveAction"))
              .replace("{negative}", String(rejectCount))
              .replace("{negativeLabel}", t("rejectAction"))
              .replace("{totalVotes}", String(totalVoteCount))
              .replace("{totalVoters}", String(purchase.eligibleVoterCount))}
          </p>
          <VoteProgressBar
            approveCount={approveCount}
            rejectCount={rejectCount}
            pendingCount={pendingVoteCount}
            totalCount={purchase.eligibleVoterCount}
          />
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <VoteStat colorClassName="bg-sage-500" label={t("approveAction")} value={approveCount} />
            <VoteStat colorClassName="bg-clay-500" label={t("rejectAction")} value={rejectCount} />
            <VoteStat colorClassName="bg-ink/20" label={t("pendingReview")} value={pendingVoteCount} />
          </div>

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
                        vote.vote === "approve" ? "bg-sage-100 text-sage-700" : "bg-clay-100 text-clay-700"
                      }`}
                    >
                      {vote.vote === "approve" ? t("approveAction") : t("rejectAction")}
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
            {isRequester ? t("requesterVoteHint") : currentVote ? t("changeVoteHint") : t("voteHint")}
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
              onClick={() => submitVote("reject")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-card border-2 py-3 font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                currentVote?.vote === "reject"
                  ? "border-clay-500 bg-clay-100 text-clay-700"
                  : "border-clay-500/40 text-clay-700"
              }`}
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
              {t("rejectAction")}
            </button>
            <button
              type="button"
              disabled={!canVote}
              onClick={() => submitVote("approve")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-card border-2 py-3 font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                currentVote?.vote === "approve"
                  ? "border-sage-500 bg-sage-100 text-sage-700"
                  : "border-sage-500/50 text-sage-700"
              }`}
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
              {t("approveAction")}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function VoteProgressBar({
  approveCount,
  rejectCount,
  pendingCount,
  totalCount,
}: {
  approveCount: number;
  rejectCount: number;
  pendingCount: number;
  totalCount: number;
}) {
  const safeTotal = Math.max(totalCount, 1);
  const segments = [
    { key: "approve", count: approveCount, className: "bg-sage-500" },
    { key: "reject", count: rejectCount, className: "bg-clay-500" },
    { key: "pending", count: pendingCount, className: "bg-ink/15" },
  ];

  return (
    <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-ink/10">
      {segments.map((segment) =>
        segment.count > 0 ? (
          <span
            key={segment.key}
            className={segment.className}
            style={{ width: `${(segment.count / safeTotal) * 100}%` }}
          />
        ) : null
      )}
    </div>
  );
}

function VoteStat({ colorClassName, label, value }: { colorClassName: string; label: string; value: number }) {
  return (
    <div className="rounded-card bg-ink/[0.04] px-2 py-2">
      <span className={`mb-1 block h-1.5 w-6 rounded-full ${colorClassName}`} />
      <span className="block text-ink-soft">{label}</span>
      <span className="font-mono text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}

function formatDate(value: string, language: string) {
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en", { month: "short", day: "numeric" }).format(new Date(value));
}
