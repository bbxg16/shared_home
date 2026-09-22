import { NavLink } from "react-router-dom";
import { FileWarning, Home, Tags, Users } from "lucide-react";
import { useLanguage } from "@/state/LanguageContext";

const NAV_ITEMS = [
  { to: "/", labelKey: "home", icon: Home, end: true },
  { to: "/purchases", labelKey: "requests", icon: Tags, end: false },
  { to: "/reports", labelKey: "reports", icon: FileWarning, end: false },
  { to: "/house", labelKey: "house", icon: Users, end: false },
] as const;

export function BottomNavigation() {
  const { t } = useLanguage();

  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-10 border-t border-ink/10 bg-white/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-app items-stretch justify-between px-2">
        {NAV_ITEMS.map(({ to, labelKey, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-2 py-3 text-xs font-medium transition-colors ${
                  isActive ? "text-sage-700" : "text-ink-soft"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className="h-5 w-5"
                    strokeWidth={isActive ? 2.25 : 1.75}
                    aria-hidden="true"
                  />
                  <span>{t(labelKey)}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
