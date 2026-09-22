import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-ink/15 px-6 py-10 text-center">
      <Icon className="h-6 w-6 text-sage-500" strokeWidth={1.75} />
      <p className="font-display text-base font-medium text-ink">{title}</p>
      {description ? <p className="text-sm text-ink-soft">{description}</p> : null}
    </div>
  );
}
