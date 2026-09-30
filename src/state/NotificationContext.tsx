import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAppData } from "@/state/AppDataContext";
import { useLanguage } from "@/state/LanguageContext";

type NotificationPermissionState = NotificationPermission | "unsupported";

interface NotificationContextValue {
  isAvailable: boolean;
  isEnabled: boolean;
  permission: NotificationPermissionState;
  toggleNotifications: () => Promise<void>;
}

const STORAGE_KEY = "shared-home-notifications-enabled";
const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { activityEvents, currentHouse, isFirebaseMode } = useAppData();
  const { t } = useLanguage();
  const [permission, setPermission] = useState<NotificationPermissionState>(() => getNotificationPermission());
  const [isEnabled, setIsEnabled] = useState(() => localStorage.getItem(STORAGE_KEY) === "true");
  const lastNotifiedEventId = useRef<string | null>(null);

  const isAvailable = isFirebaseMode && Boolean(currentHouse) && permission !== "unsupported";

  useEffect(() => {
    lastNotifiedEventId.current = activityEvents.at(-1)?.id ?? null;
  }, [currentHouse?.id]);

  useEffect(() => {
    if (!isAvailable || !isEnabled || permission !== "granted") {
      return;
    }

    const latestEvent = activityEvents.at(-1);
    if (!latestEvent || latestEvent.id === lastNotifiedEventId.current) {
      return;
    }

    lastNotifiedEventId.current = latestEvent.id;
    new Notification(t("notificationTitle"), {
      body: t("notificationBody"),
      tag: `shared-home-${currentHouse?.id ?? "home"}`,
    });
  }, [activityEvents, currentHouse?.id, isAvailable, isEnabled, permission, t]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      isAvailable,
      isEnabled: isAvailable && isEnabled && permission === "granted",
      permission,
      toggleNotifications: async () => {
        if (permission === "unsupported") {
          return;
        }

        if (isEnabled && permission === "granted") {
          localStorage.setItem(STORAGE_KEY, "false");
          setIsEnabled(false);
          return;
        }

        const nextPermission = permission === "granted" ? "granted" : await Notification.requestPermission();
        setPermission(nextPermission);
        const nextEnabled = nextPermission === "granted";
        if (nextEnabled) {
          lastNotifiedEventId.current = activityEvents.at(-1)?.id ?? null;
        }
        localStorage.setItem(STORAGE_KEY, String(nextEnabled));
        setIsEnabled(nextEnabled);
      },
    }),
    [activityEvents, isAvailable, isEnabled, permission]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used inside NotificationProvider");
  }
  return context;
}

function getNotificationPermission(): NotificationPermissionState {
  if (!("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}
