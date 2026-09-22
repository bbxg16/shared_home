import type { ReactNode } from "react";
import { useLanguage } from "@/state/LanguageContext";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function AppHeader({ title, subtitle, action }: AppHeaderProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <header className="flex items-start justify-between gap-3 px-5 pb-4 pt-6">
      <div>
        <h1 className="font-display text-2xl font-semibold leading-tight text-ink">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-ink-soft">{subtitle}</p> : null}
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
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
