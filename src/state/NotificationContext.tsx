import { createContext, useContext, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { useAppData } from "@/state/AppDataContext";
import { useLanguage } from "@/state/LanguageContext";

type NotificationPermissionState = NotificationPermission | "unsupported";

interface OneSignalSdk {
  init: (options: {
    appId: string;
    allowLocalhostAsSecureOrigin?: boolean;
    serviceWorkerParam?: { scope: string };
    serviceWorkerPath?: string;
  }) => Promise<void>;
  login: (externalId: string) => Promise<void>;
  logout?: () => Promise<void>;
  Notifications: {
    isPushSupported: () => boolean;
    requestPermission: () => Promise<boolean>;
    permission: boolean;
    permissionNative: NotificationPermission;
  };
  User: {
    addTag: (key: string, value: string) => Promise<void>;
    PushSubscription: {
      optedIn: boolean;
      optIn: () => Promise<void>;
      optOut: () => Promise<void>;
    };
  };
}

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: OneSignalSdk) => void | Promise<void>>;
  }
}

interface NotificationContextValue {
  isAvailable: boolean;
  isEnabled: boolean;
  permission: NotificationPermissionState;
  toggleNotifications: () => Promise<void>;
}

const STORAGE_KEY = "shared-home-notifications-enabled";
const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;
const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { activityEvents, authUser, currentHouse, isFirebaseMode } = useAppData();
  const { t } = useLanguage();
  const [permission, setPermission] = useState<NotificationPermissionState>(() => getNotificationPermission());
  const [localNotificationsEnabled, setLocalNotificationsEnabled] = useState(() => localStorage.getItem(STORAGE_KEY) === "true");
  const [oneSignalEnabled, setOneSignalEnabled] = useState(false);
  const [oneSignalSupported, setOneSignalSupported] = useState(false);
  const lastNotifiedEventId = useRef<string | null>(null);
  const oneSignalPromise = useRef<Promise<OneSignalSdk | null> | null>(null);
  const oneSignalUserId = useRef<string | null>(null);

  const isOneSignalConfigured = Boolean(ONESIGNAL_APP_ID);
  const isAvailable =
    isFirebaseMode &&
    Boolean(currentHouse) &&
    (isOneSignalConfigured ? oneSignalSupported : permission !== "unsupported");

  useEffect(() => {
    lastNotifiedEventId.current = activityEvents.at(-1)?.id ?? null;
  }, [currentHouse?.id]);

  useEffect(() => {
    if (!isOneSignalConfigured || !authUser || !currentHouse) {
      return;
    }

    void getOneSignal(oneSignalPromise).then(async (oneSignal) => {
      if (!oneSignal) {
        return;
      }

      setOneSignalSupported(oneSignal.Notifications.isPushSupported());
      if (oneSignalUserId.current !== authUser.uid) {
        await oneSignal.login(authUser.uid);
        oneSignalUserId.current = authUser.uid;
      }
      await oneSignal.User.addTag("house_id", currentHouse.id);
      await oneSignal.User.addTag("house_name", currentHouse.name);
      setOneSignalEnabled(oneSignal.User.PushSubscription.optedIn);
      setPermission(oneSignal.Notifications.permissionNative);
    }).catch((error) => {
      console.warn("OneSignal setup failed", error);
      setOneSignalSupported(false);
    });
  }, [authUser, currentHouse, isOneSignalConfigured]);

  useEffect(() => {
    if (isOneSignalConfigured || !isAvailable || !localNotificationsEnabled || permission !== "granted") {
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
  }, [activityEvents, currentHouse?.id, isAvailable, isOneSignalConfigured, localNotificationsEnabled, permission, t]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      isAvailable,
      isEnabled: isAvailable && (isOneSignalConfigured ? oneSignalEnabled : localNotificationsEnabled && permission === "granted"),
      permission,
      toggleNotifications: async () => {
        if (isOneSignalConfigured) {
          const oneSignal = await getOneSignal(oneSignalPromise);
          if (!oneSignal) {
            return;
          }

          if (oneSignal.User.PushSubscription.optedIn) {
            await oneSignal.User.PushSubscription.optOut();
          } else {
            await oneSignal.Notifications.requestPermission();
            await oneSignal.User.PushSubscription.optIn();
          }
          setOneSignalEnabled(oneSignal.User.PushSubscription.optedIn);
          setPermission(oneSignal.Notifications.permissionNative);
          return;
        }

        if (permission === "unsupported") {
          return;
        }

        if (localNotificationsEnabled && permission === "granted") {
          localStorage.setItem(STORAGE_KEY, "false");
          setLocalNotificationsEnabled(false);
          return;
        }

        const nextPermission = permission === "granted" ? "granted" : await Notification.requestPermission();
        setPermission(nextPermission);
        const nextEnabled = nextPermission === "granted";
        if (nextEnabled) {
          lastNotifiedEventId.current = activityEvents.at(-1)?.id ?? null;
        }
        localStorage.setItem(STORAGE_KEY, String(nextEnabled));
        setLocalNotificationsEnabled(nextEnabled);
      },
    }),
    [activityEvents, isAvailable, isOneSignalConfigured, localNotificationsEnabled, oneSignalEnabled, permission]
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

function getOneSignal(oneSignalPromise: MutableRefObject<Promise<OneSignalSdk | null> | null>) {
  if (!ONESIGNAL_APP_ID) {
    return Promise.resolve(null);
  }

  if (!oneSignalPromise.current) {
    oneSignalPromise.current = loadOneSignalSdk().then((oneSignal) => {
      return oneSignal.init({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: window.location.hostname === "localhost",
        serviceWorkerParam: {
          scope: `${import.meta.env.BASE_URL}onesignal/`,
        },
        serviceWorkerPath: `${import.meta.env.BASE_URL}onesignal/OneSignalSDKWorker.js`,
      }).then(() => oneSignal);
    });
  }

  return oneSignalPromise.current;
}

function loadOneSignalSdk() {
  return new Promise<OneSignalSdk>((resolve, reject) => {
    window.OneSignalDeferred = window.OneSignalDeferred ?? [];
    window.OneSignalDeferred.push(resolve);

    if (document.querySelector("script[data-onesignal-sdk]")) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.async = true;
    script.defer = true;
    script.dataset.onesignalSdk = "true";
    script.onerror = () => reject(new Error("Could not load OneSignal SDK."));
    document.head.appendChild(script);
  });
}
