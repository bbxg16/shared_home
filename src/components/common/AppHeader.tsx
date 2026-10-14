import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, BellOff, Megaphone } from "lucide-react";
import { getUnreadSystemMessageIds } from "@/lib/systemMessages";
import { useAppData } from "@/state/AppDataContext";
import { useLanguage } from "@/state/LanguageContext";
import { useNotifications } from "@/state/NotificationContext";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function AppHeader({ title, subtitle, action }: AppHeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const { pathname } = useLocation();
  const { systemMessages } = useAppData();
  const { isAvailable, isEnabled, permission, status, statusDetail, toggleNotifications } = useNotifications();
  const [hasUnreadSystemMessages, setHasUnreadSystemMessages] = useState(false);
  const notificationLabel = isEnabled
    ? t("notificationsOn")
    : permission === "denied"
      ? t("notificationsBlocked")
      : t("enableNotifications");
  const notificationStatus =
    status === "working"
      ? t("notificationsWorking")
      : status === "ready"
        ? t("notificationsOn")
        : status === "blocked"
          ? t("notificationsBlocked")
          : status === "error"
            ? t("notificationsSetupFailed")
            : "";

  useEffect(() => {
    setHasUnreadSystemMessages(!pathname.startsWith("/announcements") && getUnreadSystemMessageIds(systemMessages).size > 0);
  }, [pathname, systemMessages]);

  return (
    <header className="flex items-start justify-between gap-3 px-5 pb-4 pt-6">
      <div>
        <h1 className="font-display text-2xl font-semibold leading-tight text-ink">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-ink-soft">{subtitle}</p> : null}
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <Link
          to="/announcements"
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink-soft shadow-card"
          aria-label={t("systemMessages")}
          title={t("systemMessages")}
        >
          <Megaphone className="h-5 w-5" strokeWidth={1.75} />
          {hasUnreadSystemMessages ? <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-clay-500 ring-2 ring-white" /> : null}
        </Link>
        {isAvailable ? (
          <button
            type="button"
            onClick={() => void toggleNotifications()}
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-card ${
              isEnabled ? "text-sage-700" : "text-ink-soft"
            }`}
            aria-label={notificationLabel}
            title={statusDetail || notificationStatus || notificationLabel}
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
