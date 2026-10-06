import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Image as ImageIcon, Plus, Tags, Trash2, X } from "lucide-react";
import { AppHeader } from "@/components/common/AppHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAppData } from "@/state/AppDataContext";
import { useLanguage } from "@/state/LanguageContext";
import type { Purchase } from "@/types";

type TabKey = "all" | "mine";

const TABS: { key: TabKey; labelKey: "all" | "mine" }[] = [
  { key: "all", labelKey: "all" },
  { key: "mine", labelKey: "mine" },
];

const MAX_IMAGE_DATA_URL_LENGTH = 750_000;

export function PurchasesPage() {
  const {
    currentUser,
    currentHouse,
    error,
    isFirebaseMode,
    purchases,
    purchaseVotes,
    createPurchaseRequest,
    deletePurchaseRequest,
  } = useAppData();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const [imageError, setImageError] = useState("");
  const [imageInputVersion, setImageInputVersion] = useState(0);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const visiblePurchases = useMemo(() => {
    const activeStatuses = new Set(["pending", "approved", "rejected"]);
    const visible = purchases.filter((purchase) => activeStatuses.has(purchase.status));
    if (activeTab === "mine") {
      return sortPurchases(visible.filter((purchase) => purchase.requestedBy === currentUser.userId));
    }
    return sortPurchases(visible);
  }, [activeTab, currentUser.userId, purchases]);

  const pendingPurchases = visiblePurchases.filter((purchase) => purchase.status === "pending");
  const resolvedPurchases = visiblePurchases.filter((purchase) => purchase.status !== "pending");

  async function submitRequest() {
    if (!name.trim() || !description.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createPurchaseRequest({
        name: name.trim(),
        productUrl: productUrl.trim() || undefined,
        imageDataUrl,
        price: price.trim() || undefined,
        description: description.trim(),
      });
      setName("");
      setPrice("");
      setProductUrl("");
      setImageDataUrl(undefined);
      setImageError("");
      setImageInputVersion((current) => current + 1);
      setDescription("");
      setShowForm(false);
      setActiveTab("mine");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleImageChange(file?: File) {
    setImageError("");
    if (!file) {
      return;
    }

    try {
      const nextImageDataUrl = await compressImage(file);
      if (nextImageDataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
        setImageError(t("imageTooLarge"));
        return;
      }
      setImageDataUrl(nextImageDataUrl);
    } catch {
      setImageError(t("imageReadFailed"));
    }
  }

  function removeImage() {
    setImageDataUrl(undefined);
    setImageError("");
    setImageInputVersion((current) => current + 1);
  }

  return (
    <div>
      <AppHeader
        title={t("requests")}
        subtitle={t("requestExpiry")}
        action={
          <button
            type="button"
            onClick={() => setShowForm((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white"
            aria-label={t("createRequest")}
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
            {t(tab.labelKey)}
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
              placeholder={t("requestNamePlaceholder")}
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
              inputMode="url"
              placeholder={t("productLinkOptional")}
              className="rounded-card border border-ink/10 px-3 py-2 text-sm outline-none focus:border-sage-500"
            />
            <div className="rounded-card border border-ink/10 p-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-card bg-ink/[0.05] py-2 text-sm font-medium text-ink-soft">
                <ImageIcon className="h-4 w-4" strokeWidth={1.75} />
                {t("imageOptional")}
                <input
                  key={imageInputVersion}
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handleImageChange(event.target.files?.[0])}
                  className="sr-only"
                />
              </label>
              {imageDataUrl ? (
                <div className="mt-3">
                  <img src={imageDataUrl} alt="" className="max-h-56 w-full rounded-card object-cover" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-card border border-clay-500/40 py-2 text-sm font-medium text-clay-700"
                  >
                    <X className="h-4 w-4" strokeWidth={1.75} />
                    {t("removeImage")}
                  </button>
                </div>
              ) : null}
              {imageError ? <p className="mt-2 text-sm text-clay-700">{imageError}</p> : null}
            </div>
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
              {isSubmitting ? t("submitting") : t("submitRequest")}
            </button>
          </section>
        ) : null}

        {visiblePurchases.length === 0 ? (
          <EmptyState icon={Tags} title={t("noRequestsTitle")} description={t("noRequestsDescription")} />
        ) : (
          <>
            {pendingPurchases.length > 0 ? (
              <PurchaseSection
                title={t("activeMemorials")}
                purchases={pendingPurchases}
                purchaseVotes={purchaseVotes}
                currentUserId={currentUser.userId}
                onDelete={deletePurchaseRequest}
              />
            ) : null}
            {resolvedPurchases.length > 0 ? (
              <PurchaseSection
                title={t("resolvedMemorials")}
                purchases={resolvedPurchases}
                purchaseVotes={purchaseVotes}
                currentUserId={currentUser.userId}
                onDelete={deletePurchaseRequest}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

async function compressImage(file: File) {
  const image = await readImage(file);
  const maxSize = 900;
  const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
  const width = Math.max(Math.round(image.width * scale), 1);
  const height = Math.max(Math.round(image.height * scale), 1);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is unavailable.");
  }
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

function readImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = String(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function PurchaseSection({
  title,
  purchases,
  purchaseVotes,
  currentUserId,
  onDelete,
}: {
  title: string;
  purchases: Purchase[];
  purchaseVotes: Record<string, { vote: "approve" | "reject"; userId: string }[]>;
  currentUserId: string;
  onDelete: (purchaseId: string) => Promise<void>;
}) {
  return (
    <section className="flex flex-col gap-3">
      <p className="px-1 text-xs font-medium uppercase tracking-wide text-ink-soft">{title}</p>
      {purchases.map((purchase) => (
        <PurchaseCard
          key={purchase.id}
          purchase={purchase}
          approveCount={(purchaseVotes[purchase.id] ?? []).filter((vote) => vote.vote === "approve").length}
          totalVoteCount={(purchaseVotes[purchase.id] ?? []).length}
          canDelete={purchase.requestedBy === currentUserId}
          onDelete={() => onDelete(purchase.id)}
        />
      ))}
    </section>
  );
}

function PurchaseCard({
  purchase,
  approveCount,
  totalVoteCount,
  canDelete,
  onDelete,
}: {
  purchase: Purchase;
  approveCount: number;
  totalVoteCount: number;
  canDelete: boolean;
  onDelete: () => Promise<void>;
}) {
  const { t } = useLanguage();

  async function handleDelete() {
    if (!window.confirm(t("confirmDeleteRequest"))) {
      return;
    }
    await onDelete();
  }

  return (
    <article className={`pinned-card overflow-hidden ${purchase.status === "pending" ? "border border-honey-300 bg-honey-100/60" : ""}`}>
      <Link to={`/purchases/${purchase.id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold leading-tight text-ink">{purchase.name}</p>
            {purchase.price ? <p className="mt-0.5 font-mono text-sm text-ink-soft">{purchase.price}</p> : null}
          </div>
          <StatusBadge status={purchase.status} />
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{purchase.description}</p>
      </Link>
      <div className="mt-3 flex items-center justify-between gap-3 text-sm text-ink-soft">
        <Link to={`/purchases/${purchase.id}`} className="min-w-0 flex-1">
          <span>{t("byUser").replace("{name}", purchase.requestedByName)}</span>
          <span className="ml-2 inline-flex items-center gap-1 font-mono text-xs">
            {t("cardVoteSummary")
              .replace("{positiveLabel}", t("approveAction"))
              .replace("{positive}", String(approveCount))
              .replace("{totalVotes}", String(totalVoteCount))
              .replace("{totalVoters}", String(purchase.eligibleVoterCount))}
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
        </Link>
        {canDelete ? (
          <button
            type="button"
            onClick={() => void handleDelete()}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-clay-700 hover:bg-clay-100"
            aria-label={t("deleteRequest")}
            title={t("deleteRequest")}
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
          </button>
        ) : null}
      </div>
    </article>
  );
}

function sortPurchases(purchases: Purchase[]) {
  return [...purchases].sort((left, right) => {
    const leftActive = left.status === "pending" ? 1 : 0;
    const rightActive = right.status === "pending" ? 1 : 0;
    if (leftActive !== rightActive) {
      return rightActive - leftActive;
    }
    return new Date(right.lastActivityAt).getTime() - new Date(left.lastActivityAt).getTime();
  });
}
