import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Plus, Tags } from "lucide-react";
import { AppHeader } from "@/components/common/AppHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAppData } from "@/state/AppDataContext";
import { useLanguage } from "@/state/LanguageContext";
import type { Purchase, PurchaseStatus } from "@/types";

type TabKey = "pending" | "mine" | "history";

const TABS: { key: TabKey; label: string; statuses?: PurchaseStatus[] }[] = [
  { key: "pending", label: "Pending", statuses: ["pending"] },
  { key: "mine", label: "Mine" },
  { key: "history", label: "History", statuses: ["approved", "rejected", "expired"] },
];

export function PurchasesPage() {
  const { currentUser, currentHouse, error, isFirebaseMode, purchases, purchaseVotes, createPurchaseRequest } = useAppData();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const visiblePurchases = useMemo(() => {
    const tab = TABS.find((item) => item.key === activeTab)!;
    if (activeTab === "mine") {
      return purchases.filter((purchase) => purchase.requestedBy === currentUser.userId);
    }
    return purchases.filter((purchase) => tab.statuses?.includes(purchase.status));
  }, [activeTab, currentUser.userId, purchases]);

  async function submitRequest() {
    if (!name.trim() || !description.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createPurchaseRequest({
        name: name.trim(),
        productUrl: productUrl.trim() || undefined,
        price: price.trim() || undefined,
        description: description.trim(),
      });
      setName("");
      setPrice("");
      setProductUrl("");
      setDescription("");
      setShowForm(false);
      setActiveTab("mine");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <AppHeader
        title={t("requests")}
        subtitle="Purchase requests expire after 7 days"
        action={
          <button
            type="button"
            onClick={() => setShowForm((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white"
            aria-label="Create purchase request"
          >
            <Plus className="h-5 w-5" strokeWidth={2.25} />
          </button>
        }
      />

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
          <p className="rounded-card bg-honey-100 p-3 text-sm text-honey-700">{t("noHomeRequest")}</p>
        ) : null}
        {error ? <p className="rounded-card bg-clay-100 p-3 text-sm text-clay-700">{error}</p> : null}

        {showForm ? (
          <section className="pinned-card flex flex-col gap-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="What do you want to buy?"
              className="rounded-card border border-ink/10 px-3 py-2 text-sm outline-none focus:border-sage-500"
            />
            <input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              inputMode="text"
              placeholder={t("price")}
              className="rounded-card border border-ink/10 px-3 py-2 text-sm outline-none focus:border-sage-500"
            />
            <input
              value={productUrl}
              onChange={(event) => setProductUrl(event.target.value)}
              placeholder={t("productLinkOptional")}
              className="rounded-card border border-ink/10 px-3 py-2 text-sm outline-none focus:border-sage-500"
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t("description")}
              rows={3}
              className="rounded-card border border-ink/10 px-3 py-2 text-sm outline-none focus:border-sage-500"
            />
            <button
              type="button"
              disabled={isSubmitting || (isFirebaseMode && !currentHouse)}
              onClick={() => void submitRequest()}
              className="rounded-card bg-sage-500 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : t("submitRequest")}
            </button>
          </section>
        ) : null}

        {visiblePurchases.length === 0 ? (
          <EmptyState icon={Tags} title="Nothing here yet" description="Requests will show up as they move." />
        ) : (
          visiblePurchases.map((purchase) => (
            <PurchaseCard
              key={purchase.id}
              purchase={purchase}
              approveCount={(purchaseVotes[purchase.id] ?? []).filter((vote) => vote.vote === "approve").length}
            />
          ))
        )}
      </div>
    </div>
  );
}

function PurchaseCard({ purchase, approveCount }: { purchase: Purchase; approveCount: number }) {
  return (
    <Link to={`/purchases/${purchase.id}`} className="pinned-card block overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold leading-tight text-ink">{purchase.name}</p>
          {purchase.price ? <p className="mt-0.5 font-mono text-sm text-ink-soft">{purchase.price}</p> : null}
        </div>
        <StatusBadge status={purchase.status} />
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{purchase.description}</p>
      <div className="mt-3 flex items-center justify-between text-sm text-ink-soft">
        <span>By {purchase.requestedByName}</span>
        <span className="flex items-center gap-1 font-mono text-xs">
          {approveCount}/{purchase.requiredApprovals}
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      </div>
    </Link>
  );
}
