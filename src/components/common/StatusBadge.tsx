import type { PurchaseStatus, ReportStatus } from "@/types";

interface StatusBadgeProps {
  status: PurchaseStatus | ReportStatus;
}

const STATUS_STYLES: Record<PurchaseStatus | ReportStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-honey-100 text-honey-700" },
  approved: { label: "Approved", className: "bg-sage-100 text-sage-700" },
  rejected: { label: "Rejected", className: "bg-clay-100 text-clay-700" },
  open: { label: "Open", className: "bg-honey-100 text-honey-700" },
  agreed: { label: "Agreed", className: "bg-sage-100 text-sage-700" },
  disagreed: { label: "Disagreed", className: "bg-clay-100 text-clay-700" },
  expired: { label: "Expired", className: "bg-ink/[0.06] text-ink-soft" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className } = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wide ${className}`}
    >
      {label}
    </span>
  );
}
