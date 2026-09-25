import { Link } from "react-router-dom";
import { ChevronRight, FileWarning, Tags, Users } from "lucide-react";
import { AppHeader } from "@/components/common/AppHeader";
import { useAppData } from "@/state/AppDataContext";
import { useLanguage } from "@/state/LanguageContext";

export function HomePage() {
  const { currentHouse, currentUser, isFirebaseMode, members, purchases, reports } = useAppData();
  const { t } = useLanguage();
  const pendingPurchaseCount = purchases.filter((purchase) => purchase.status === "pending").length;
  const openReportCount = reports.filter((report) => report.status === "open").length;
  const myRequestCount = purchases.filter((purchase) => purchase.requestedBy === currentUser.userId).length;
  const houseName = currentHouse?.name ?? (isFirebaseMode ? t("noHomeJoined") : t("demoHome"));

  return (
    <div>
      <AppHeader title={t("appName")} subtitle={`${houseName} · ${members.length} ${t("members").toLowerCase()}`} />

      <div className="flex flex-col gap-4 px-5">
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
