import { Link } from "react-router-dom";
import { Bell, ChevronRight, FileWarning, Tags, Users } from "lucide-react";
import { AppHeader } from "@/components/common/AppHeader";
import { useAppData } from "@/state/AppDataContext";
import { useLanguage } from "@/state/LanguageContext";

export function HomePage() {
  const { currentHouse, currentUser, isFirebaseMode, members, purchases, reports, systemMessages } = useAppData();
  const { t } = useLanguage();
  const pendingPurchaseCount = purchases.filter((purchase) => purchase.status === "pending").length;
  const openReportCount = reports.filter((report) => report.status === "open").length;
  const myRequestCount = purchases.filter((purchase) => purchase.requestedBy === currentUser.userId).length;
  const houseName = currentHouse?.name ?? (isFirebaseMode ? t("noHomeJoined") : t("demoHome"));
  const latestMessage = systemMessages[0];

  return (
    <div>
      <AppHeader title={t("appName")} subtitle={`${houseName} · ${members.length} ${t("members").toLowerCase()}`} />

      <div className="flex flex-col gap-4 px-5">
        {latestMessage ? (
          <Link to="/announcements" className="pinned-card flex items-center justify-between border border-honey-300 bg-honey-100/70">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-honey-700">
                <Bell className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase text-honey-700">{t("latestSystemMessage")}</p>
                <p className="truncate font-display text-lg font-semibold text-ink">{latestMessage.title}</p>
                <p className="line-clamp-1 text-sm text-ink-soft">{latestMessage.body}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 flex-shrink-0 text-ink-soft" strokeWidth={1.75} />
          </Link>
        ) : null}

        <Link to="/purchases" className="pinned-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-honey-100 text-honey-700">
              <Tags className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-ink">{t("requests")}</p>
              <p className="text-sm text-ink-soft">
                {t("pendingFromYou")
                  .replace("{pending}", String(pendingPurchaseCount))
                  .replace("{mine}", String(myRequestCount))}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-ink-soft" strokeWidth={1.75} />
        </Link>

        <Link to="/reports" className="pinned-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-clay-100 text-clay-700">
              <FileWarning className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-ink">{t("reports")}</p>
              <p className="text-sm text-ink-soft">
                {t("openReportsThisWeek").replace("{count}", String(openReportCount))}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-ink-soft" strokeWidth={1.75} />
        </Link>

        <Link
          to="/house"
          className="pinned-card flex items-center justify-between text-sm text-ink-soft"
        >
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" strokeWidth={1.75} />
            <span>
              <span className="font-medium text-ink">{houseName}</span> {t("inviteAndMembers")}
            </span>
          </span>
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
        </Link>
      </div>
    </div>
  );
}
