import { createContext, useContext, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { useAppData } from "@/state/AppDataContext";
import { useLanguage } from "@/state/LanguageContext";

type NotificationPermissionState = NotificationPermission | "unsupported";
type NotificationStatus = "idle" | "working" | "ready" | "blocked" | "error";

interface OneSignalSdk {
  init: (options: {
    appId: string;
    safari_web_id?: string;
    allowLocalhostAsSecureOrigin?: boolean;
    serviceWorkerParam?: { scope: string };
    serviceWorkerPath?: string;
    serviceWorkerUpdaterPath?: string;
    notifyButton?: { enable: boolean };
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
  status: NotificationStatus;
  statusDetail: string;
  toggleNotifications: () => Promise<void>;
}

const STORAGE_KEY = "shared-home-notifications-enabled";
const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;
const ONESIGNAL_SAFARI_WEB_ID = "web.onesignal.auto.37a4bd23-e633-4ae3-9e22-29e91fb790d4";
const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { activityEvents, authUser, currentHouse, isFirebaseMode } = useAppData();
  const { t } = useLanguage();
  const [permission, setPermission] = useState<NotificationPermissionState>(() => getNotificationPermission());
  const [localNotificationsEnabled, setLocalNotificationsEnabled] = useState(() => localStorage.getItem(STORAGE_KEY) === "true");
  const [oneSignalEnabled, setOneSignalEnabled] = useState(false);
  const [status, setStatus] = useState<NotificationStatus>("idle");
  const [statusDetail, setStatusDetail] = useState("");
  const lastNotifiedEventId = useRef<string | null>(null);
  const oneSignalPromise = useRef<Promise<OneSignalSdk | null> | null>(null);
  const oneSignalUserId = useRef<string | null>(null);

  const isOneSignalConfigured = Boolean(ONESIGNAL_APP_ID);
  const isAvailable = isFirebaseMode && Boolean(currentHouse);

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

      if (!oneSignal.Notifications.isPushSupported()) {
        return;
      }
      if (oneSignalUserId.current !== authUser.uid) {
        await oneSignal.login(authUser.uid);
        oneSignalUserId.current = authUser.uid;
      }
      await oneSignal.User.addTag("house_id", currentHouse.id);
      await oneSignal.User.addTag("house_name", currentHouse.name);
      setOneSignalEnabled(oneSignal.User.PushSubscription.optedIn);
      setPermission(oneSignal.Notifications.permissionNative);
      setStatus(oneSignal.User.PushSubscription.optedIn ? "ready" : "idle");
      setStatusDetail("");
    }).catch((error) => {
      console.warn("OneSignal setup failed", error);
      oneSignalPromise.current = null;
      setStatus("error");
      setStatusDetail(getErrorMessage(error));
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
      status,
      statusDetail,
      toggleNotifications: async () => {
        if (isOneSignalConfigured) {
          if (permission === "unsupported") {
            setStatus("error");
            setStatusDetail(getUnsupportedPushMessage());
            return;
          }

          try {
            setStatus("working");
            setStatusDetail("");
            const oneSignal = await getOneSignal(oneSignalPromise);
            if (!oneSignal || !oneSignal.Notifications.isPushSupported()) {
              setStatus("error");
              setStatusDetail("This browser does not support OneSignal web push.");
              return;
            }

            if (oneSignalEnabled || oneSignal.User.PushSubscription.optedIn) {
              await oneSignal.User.PushSubscription.optOut();
              setOneSignalEnabled(false);
              setStatus("idle");
              setStatusDetail("");
            } else {
              const allowed = oneSignal.Notifications.permission || await oneSignal.Notifications.requestPermission();
              const nextPermission = oneSignal.Notifications.permissionNative || Notification.permission;
              setPermission(nextPermission);
              if (!allowed || nextPermission !== "granted") {
                setStatus("blocked");
                setStatusDetail("");
                return;
              }
              await oneSignal.User.PushSubscription.optIn();
              setOneSignalEnabled(oneSignal.User.PushSubscription.optedIn);
              setStatus(oneSignal.User.PushSubscription.optedIn ? "ready" : "error");
              setStatusDetail(oneSignal.User.PushSubscription.optedIn ? "" : "OneSignal did not create a push subscription.");
            }
            setPermission(oneSignal.Notifications.permissionNative);
          } catch (error) {
            console.warn("OneSignal subscription failed", error);
            oneSignalPromise.current = null;
            setStatus("error");
            setStatusDetail(getErrorMessage(error));
          }
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
        setStatus(nextEnabled ? "ready" : "blocked");
        setStatusDetail("");
      },
    }),
    [activityEvents, isAvailable, isOneSignalConfigured, localNotificationsEnabled, oneSignalEnabled, permission, status, statusDetail]
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

function getUnsupportedPushMessage() {
  if (isIosBrowser() && !isStandaloneWebApp()) {
    return "On iPhone, add this site to Home Screen first.";
  }
  return "This browser does not support web push.";
}

function isIosBrowser() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandaloneWebApp() {
  return window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unknown OneSignal error.";
}

function getOneSignal(oneSignalPromise: MutableRefObject<Promise<OneSignalSdk | null> | null>) {
  if (!ONESIGNAL_APP_ID) {
    return Promise.resolve(null);
  }

  if (!oneSignalPromise.current) {
    oneSignalPromise.current = loadOneSignalSdk().then((oneSignal) => {
      return oneSignal.init({
        appId: ONESIGNAL_APP_ID,
        safari_web_id: ONESIGNAL_SAFARI_WEB_ID,
        allowLocalhostAsSecureOrigin: window.location.hostname === "localhost",
        notifyButton: {
          enable: true,
        },
        serviceWorkerParam: {
          scope: import.meta.env.BASE_URL,
        },
        serviceWorkerPath: `${import.meta.env.BASE_URL}OneSignalSDKWorker.js`,
        serviceWorkerUpdaterPath: `${import.meta.env.BASE_URL}OneSignalSDKUpdaterWorker.js`,
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
