import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { AppHeader } from "@/components/common/AppHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { getUnreadSystemMessageIds, markSystemMessagesRead } from "@/lib/systemMessages";
import { useAppData } from "@/state/AppDataContext";
import { useLanguage } from "@/state/LanguageContext";

export function SystemMessagesPage() {
  const { systemMessages } = useAppData();
  const { language, t } = useLanguage();
  const [unreadMessageIds, setUnreadMessageIds] = useState<Set<string>>(() => getUnreadSystemMessageIds(systemMessages));

  useEffect(() => {
    const nextUnreadIds = getUnreadSystemMessageIds(systemMessages);
    setUnreadMessageIds(nextUnreadIds);
    markSystemMessagesRead(systemMessages.map((message) => message.id));
  }, [systemMessages]);

  return (
    <div>
      <AppHeader title={t("systemMessages")} />

      <div className="flex flex-col gap-3 px-5">
        {systemMessages.length === 0 ? (
          <EmptyState icon={Bell} title={t("noSystemMessagesTitle")} description={t("noSystemMessagesDescription")} />
        ) : (
          systemMessages.map((message) => {
            const isUnread = unreadMessageIds.has(message.id);
            return (
              <article key={message.id} className={`pinned-card ${isUnread ? "border border-honey-300 bg-honey-100/70" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {isUnread ? (
                      <span className="mb-1 inline-flex rounded-full bg-clay-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {t("unreadSystemMessage")}
                      </span>
                    ) : null}
                    <h2 className="font-display text-lg font-semibold leading-tight text-ink">{message.title}</h2>
                  </div>
                  <time className="flex-shrink-0 font-mono text-xs text-ink-soft">{formatDate(message.publishedAt, language)}</time>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{message.body}</p>
              </article>
            );
          })
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
