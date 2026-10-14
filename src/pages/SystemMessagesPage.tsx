import { Bell } from "lucide-react";
import { AppHeader } from "@/components/common/AppHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { useAppData } from "@/state/AppDataContext";
import { useLanguage } from "@/state/LanguageContext";

export function SystemMessagesPage() {
  const { systemMessages } = useAppData();
  const { language, t } = useLanguage();

  return (
    <div>
      <AppHeader title={t("systemMessages")} />

      <div className="flex flex-col gap-3 px-5">
        {systemMessages.length === 0 ? (
          <EmptyState icon={Bell} title={t("noSystemMessagesTitle")} description={t("noSystemMessagesDescription")} />
        ) : (
          systemMessages.map((message) => (
            <article key={message.id} className="pinned-card">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-lg font-semibold leading-tight text-ink">{message.title}</h2>
                <time className="flex-shrink-0 font-mono text-xs text-ink-soft">
                  {formatDate(message.publishedAt, language)}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{message.body}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function formatDate(value: string, language: string) {
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
