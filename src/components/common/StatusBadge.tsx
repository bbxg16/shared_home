import type { PurchaseStatus, ReportStatus } from "@/types";
import { useLanguage } from "@/state/LanguageContext";

interface StatusBadgeProps {
  status: PurchaseStatus | ReportStatus;
}

const STATUS_STYLES: Record<PurchaseStatus | ReportStatus, { labelKey: Parameters<ReturnType<typeof useLanguage>["t"]>[0]; className: string }> = {
  pending: { labelKey: "statusPending", className: "bg-honey-100 text-honey-700" },
  approved: { labelKey: "statusApproved", className: "bg-sage-100 text-sage-700" },
  rejected: { labelKey: "statusRejected", className: "bg-clay-100 text-clay-700" },
  open: { labelKey: "statusOpen", className: "bg-honey-100 text-honey-700" },
  agreed: { labelKey: "statusAgreed", className: "bg-sage-100 text-sage-700" },
  disagreed: { labelKey: "statusDisagreed", className: "bg-clay-100 text-clay-700" },
  expired: { labelKey: "statusExpired", className: "bg-ink/[0.06] text-ink-soft" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useLanguage();
  const { labelKey, className } = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wide ${className}`}
    >
      {t(labelKey)}
    </span>
  );
}
