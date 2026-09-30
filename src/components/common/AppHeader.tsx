import type { ReactNode } from "react";
import { Bell, BellOff } from "lucide-react";
import { useLanguage } from "@/state/LanguageContext";
import { useNotifications } from "@/state/NotificationContext";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function AppHeader({ title, subtitle, action }: AppHeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const { isAvailable, isEnabled, permission, toggleNotifications } = useNotifications();
  const notificationLabel = isEnabled
    ? t("notificationsOn")
    : permission === "denied"
      ? t("notificationsBlocked")
      : t("enableNotifications");

  return (
    <header className="flex items-start justify-between gap-3 px-5 pb-4 pt-6">
      <div>
        <h1 className="font-display text-2xl font-semibold leading-tight text-ink">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-ink-soft">{subtitle}</p> : null}
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        {isAvailable ? (
          <button
            type="button"
            onClick={() => void toggleNotifications()}
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-card ${
              isEnabled ? "text-sage-700" : "text-ink-soft"
            }`}
            aria-label={notificationLabel}
            title={notificationLabel}
          >
            {isEnabled ? <Bell className="h-5 w-5" strokeWidth={1.75} /> : <BellOff className="h-5 w-5" strokeWidth={1.75} />}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setLanguage(language === "en" ? "zh" : "en")}
          className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-ink shadow-card"
        >
          {language === "en" ? "中文" : "EN"}
        </button>
        {action}
      </div>
    </header>
  );
}
