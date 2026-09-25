import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { LogIn, LogOut, UserRound } from "lucide-react";
import {
  observeAuthState,
  signInAsGuest,
  signInWithGoogle,
  signOutCurrentUser,
} from "@/services/authService";
import { isFirebaseConfigured } from "@/lib/firebase";
import { useLanguage } from "@/state/LanguageContext";

type BusyAction = "google" | "guest" | "signout" | null;

export function AccountPanel() {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    return observeAuthState((nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
  }, []);

  async function runAction(action: Exclude<BusyAction, null>, callback: () => Promise<unknown>) {
    setBusyAction(action);
    setMessage(null);

    try {
      await callback();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("actionFailed"));
    } finally {
      setBusyAction(null);
    }
  }

  const displayName = user?.displayName || user?.email || (user?.isAnonymous ? t("guestUser") : null);

  return (
    <section className="pinned-card">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-harbor-100 text-harbor-500">
          <UserRound className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-semibold text-ink">{t("account")}</p>
          <p className="truncate text-sm text-ink-soft">
            {!authReady ? t("checkingAccount") : displayName ?? t("signedOut")}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {!isFirebaseConfigured ? (
          <div className="rounded-card bg-honey-100 p-3 text-sm text-honey-700">
            {t("signInUnavailable")}
          </div>
        ) : user ? (
          <>
            <button
              type="button"
              disabled={busyAction !== null}
              onClick={() => void runAction("signout", signOutCurrentUser)}
              className="flex items-center justify-center gap-2 rounded-card border border-ink/15 py-2.5 text-sm font-medium text-ink disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" strokeWidth={2} />
              {busyAction === "signout" ? t("signingOut") : t("signOut")}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={!authReady || busyAction !== null}
              onClick={() => void runAction("google", signInWithGoogle)}
              className="flex items-center justify-center gap-2 rounded-card bg-ink py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" strokeWidth={2} />
              {busyAction === "google" ? t("openingGoogle") : t("signInWithGoogle")}
            </button>
            <button
              type="button"
              disabled={!authReady || busyAction !== null}
              onClick={() => void runAction("guest", signInAsGuest)}
              className="rounded-card border border-ink/15 py-2.5 text-sm font-medium text-ink disabled:opacity-60"
            >
              {busyAction === "guest" ? t("signingIn") : t("continueAsGuest")}
            </button>
          </>
        )}
      </div>

      {message ? <p className="mt-3 break-words text-xs text-ink-soft">{message}</p> : null}
    </section>
  );
}
