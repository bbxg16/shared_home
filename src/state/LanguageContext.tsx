import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Language = "en" | "zh";

const TEXT = {
  en: {
    home: "Home",
    requests: "Requests",
    reports: "Reports",
    house: "House",
    signedOut: "Signed out",
    firebaseLive: "Firebase live",
    firebaseConfigured: "Firebase configured · signed out",
    demoMode: "Demo mode",
    createOrJoinHome: "Create or join one shared home",
    signInToCreateHome: "Sign in to create or join a home",
    displayName: "Display name",
    saveName: "Save name",
    startHome: "Start a home",
    startHomeHint: "Create one home, or join with an invite code.",
    homeName: "Home name",
    createHome: "Create home",
    inviteCode: "Invite code",
    join: "Join",
    joinAnotherHome: "Join another home",
    copy: "Copy",
    members: "Members",
    owner: "Owner",
    member: "Member",
    working: "Working...",
    productLinkOptional: "Product link optional",
    description: "Description",
    price: "Price",
    submitRequest: "Submit request",
    submitReport: "Submit report",
    pending: "Pending",
    mine: "Mine",
    history: "History",
    open: "Open",
    weeklySummary: "Weekly summary",
    chooseMember: "Choose member",
    comments: "Comments",
    noHomeRequest: "Sign in, then create or join a home before submitting requests.",
    noHomeReport: "Sign in, then create or join a home before submitting reports.",
    permissionsHint: "If you see Missing or insufficient permissions, deploy the included Firestore rules.",
  },
  zh: {
    home: "首页",
    requests: "申请",
    reports: "举报",
    house: "家庭",
    signedOut: "未登录",
    firebaseLive: "Firebase 已连接",
    firebaseConfigured: "Firebase 已配置 · 未登录",
    demoMode: "演示模式",
    createOrJoinHome: "创建或加入一个家庭",
    signInToCreateHome: "请先登录，再创建或加入家庭",
    displayName: "用户名",
    saveName: "保存用户名",
    startHome: "开始使用家庭",
    startHomeHint: "创建一个家庭，或使用邀请码加入。",
    homeName: "家庭名称",
    createHome: "创建家庭",
    inviteCode: "邀请码",
    join: "加入",
    joinAnotherHome: "加入另一个家庭",
    copy: "复制",
    members: "成员",
    owner: "管理员",
    member: "成员",
    working: "处理中...",
    productLinkOptional: "商品链接可选",
    description: "描述",
    price: "价格",
    submitRequest: "提交申请",
    submitReport: "提交举报",
    pending: "待处理",
    mine: "我的",
    history: "历史",
    open: "进行中",
    weeklySummary: "本周汇总",
    chooseMember: "选择成员",
    comments: "说明",
    noHomeRequest: "请先登录并创建或加入家庭，再提交申请。",
    noHomeReport: "请先登录并创建或加入家庭，再提交举报。",
    permissionsHint: "如果看到 Missing or insufficient permissions，请部署项目里的 Firestore 规则。",
  },
} as const;

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof typeof TEXT.en) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return localStorage.getItem("shared-home-language") === "zh" ? "zh" : "en";
  });

  const value = useMemo<LanguageContextValue>(() => {
    return {
      language,
      setLanguage: (nextLanguage) => {
        localStorage.setItem("shared-home-language", nextLanguage);
        setLanguageState(nextLanguage);
      },
      t: (key) => TEXT[language][key],
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}
