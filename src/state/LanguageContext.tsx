import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Language = "en" | "zh";

const TEXT = {
  en: {
    home: "Home",
    requests: "Petitions",
    reports: "Accusations",
    house: "House",
    signedOut: "Signed out",
    firebaseLive: "Firebase live",
    firebaseConfigured: "Firebase configured · signed out",
    demoMode: "Demo mode",
    createOrJoinHome: "Create or join one shared home",
    signInToCreateHome: "Sign in to create or join a home",
    displayName: "Display name",
    saveName: "Save name",
    save: "Save",
    homeNameSaved: "Home name saved.",
    couldNotSaveHomeName: "Could not save home name.",
    removeMember: "Remove member",
    confirmRemoveMember: "Remove {name} from this home?",
    memberRemoved: "Member removed.",
    couldNotRemoveMember: "Could not remove member.",
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
    delete: "Delete",
    deleteRequest: "Delete request",
    deleteReport: "Delete report",
    confirmDeleteRequest: "Delete this request?",
    confirmDeleteReport: "Delete this report?",
    couldNotDeleteRequest: "Could not delete request.",
    couldNotDeleteReport: "Could not delete report.",
    targetResponse: "Reported member response",
    targetResponsePlaceholder: "Add your response here",
    saveResponse: "Save response",
    responseSaved: "Response saved.",
    couldNotSaveResponse: "Could not save response.",
    reviewMemorial: "Review",
    approveAction: "Approve",
    rejectAction: "Reject",
    agreeAction: "Agree",
    disagreeAction: "Disagree",
    approvalRate: "Approval rate",
    approvalRateHint: "How often each member approves or agrees with other members' posts.",
    noVotesYet: "No votes yet",
    needsVotes: "needs {required} of {total}",
  },
  zh: {
    home: "首页",
    requests: "臣要上奏",
    reports: "臣要告发",
    house: "家庭",
    signedOut: "未登录",
    firebaseLive: "Firebase 已连接",
    firebaseConfigured: "Firebase 已配置 · 未登录",
    demoMode: "演示模式",
    createOrJoinHome: "创建或加入一个家庭",
    signInToCreateHome: "请先登录，再创建或加入家庭",
    displayName: "用户名",
    saveName: "保存用户名",
    save: "保存",
    homeNameSaved: "家庭名称已保存。",
    couldNotSaveHomeName: "无法保存家庭名称。",
    removeMember: "移除成员",
    confirmRemoveMember: "确定要把 {name} 移出这个家庭吗？",
    memberRemoved: "成员已移除。",
    couldNotRemoveMember: "无法移除成员。",
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
    delete: "删除",
    deleteRequest: "删除申请",
    deleteReport: "删除举报",
    confirmDeleteRequest: "确定要删除这个申请吗？",
    confirmDeleteReport: "确定要删除这个举报吗？",
    couldNotDeleteRequest: "无法删除申请。",
    couldNotDeleteReport: "无法删除举报。",
    targetResponse: "被举报人申辩",
    targetResponsePlaceholder: "在这里写你的申辩说明",
    saveResponse: "保存申辩",
    responseSaved: "申辩已保存。",
    couldNotSaveResponse: "无法保存申辩。",
    reviewMemorial: "批折子",
    approveAction: "准奏",
    rejectAction: "驳回",
    agreeAction: "同意",
    disagreeAction: "不同意",
    approvalRate: "批准通过率",
    approvalRateHint: "每个人给别人投票时，选择通过/同意的比例。",
    noVotesYet: "暂无投票",
    needsVotes: "需要 {required}/{total}",
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
