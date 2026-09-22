import { useEffect, useState } from "react";
import { Copy, Crown, Home } from "lucide-react";
import { AppHeader } from "@/components/common/AppHeader";
import { FirebasePanel } from "@/components/common/FirebasePanel";
import { mockHouse } from "@/data/mockData";
import { useAppData } from "@/state/AppDataContext";
import { useLanguage } from "@/state/LanguageContext";

export function HousePage() {
  const {
    authUser,
    currentUser,
    currentHouse,
    members,
    isFirebaseMode,
    error,
    createHome,
    joinHomeWithInviteCode,
    updateDisplayName,
  } = useAppData();
  const { t } = useLanguage();
  const [homeName, setHomeName] = useState("Approval Home");
  const [inviteCode, setInviteCode] = useState("");
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [message, setMessage] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const house = currentHouse ?? (!isFirebaseMode ? mockHouse : null);

  useEffect(() => {
    setDisplayName(currentUser.displayName);
  }, [currentUser.displayName]);

  async function copyInviteCode() {
    if (!house?.inviteCode) {
      return;
    }
    await navigator.clipboard.writeText(house.inviteCode);
    setMessage("Invite code copied.");
  }

  async function handleCreateHome() {
    if (!homeName.trim()) {
      return;
    }

    setIsWorking(true);
    setMessage(null);
    try {
      await createHome(homeName.trim());
      setMessage("Home created. Share the invite code with your members.");
    } catch (createError) {
      setMessage(createError instanceof Error ? createError.message : "Could not create home.");
    } finally {
      setIsWorking(false);
    }
  }

  async function handleJoinHome() {
    if (!inviteCode.trim()) {
      return;
    }

    setIsWorking(true);
    setMessage(null);
    try {
      await joinHomeWithInviteCode(inviteCode);
      setInviteCode("");
      setMessage("Joined home.");
    } catch (joinError) {
      setMessage(joinError instanceof Error ? joinError.message : "Could not join home.");
    } finally {
      setIsWorking(false);
    }
  }

  async function handleSaveDisplayName() {
    setIsWorking(true);
    setMessage(null);
    try {
      await updateDisplayName(displayName);
      setMessage("Name saved.");
    } catch (nameError) {
      setMessage(nameError instanceof Error ? nameError.message : "Could not save name.");
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <div>
      <AppHeader
        title={house?.name ?? t("house")}
        subtitle={
          house
            ? `${members.length} members · signed in as ${currentUser.displayName}`
            : authUser
              ? t("createOrJoinHome")
              : t("signInToCreateHome")
        }
      />

      <div className="flex flex-col gap-4 px-5">
        <FirebasePanel />

        {authUser ? (
          <section className="pinned-card flex flex-col gap-3">
            <p className="font-display text-lg font-semibold text-ink">{t("displayName")}</p>
            <div className="flex gap-2">
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder={t("displayName")}
                className="min-w-0 flex-1 rounded-card border border-ink/10 px-3 py-2 text-sm outline-none focus:border-sage-500"
              />
              <button
                type="button"
                disabled={isWorking}
                onClick={() => void handleSaveDisplayName()}
                className="rounded-card bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {t("saveName")}
              </button>
            </div>
          </section>
        ) : null}

        {isFirebaseMode && authUser && !house ? (
          <section className="pinned-card flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-100 text-sage-700">
                <Home className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="font-display text-lg font-semibold text-ink">{t("startHome")}</p>
                <p className="text-sm text-ink-soft">{t("startHomeHint")}</p>
              </div>
            </div>

            <input
              value={homeName}
              onChange={(event) => setHomeName(event.target.value)}
              placeholder={t("homeName")}
              className="rounded-card border border-ink/10 px-3 py-2 text-sm outline-none focus:border-sage-500"
            />
            <button
              type="button"
              disabled={isWorking}
              onClick={() => void handleCreateHome()}
              className="rounded-card bg-sage-500 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {isWorking ? t("working") : t("createHome")}
            </button>

            <div className="flex gap-2">
              <input
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                placeholder={t("inviteCode")}
                className="min-w-0 flex-1 rounded-card border border-ink/10 px-3 py-2 text-sm uppercase outline-none focus:border-sage-500"
              />
              <button
                type="button"
                disabled={isWorking}
                onClick={() => void handleJoinHome()}
                className="rounded-card bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {t("join")}
              </button>
            </div>
          </section>
        ) : null}

        {house ? (
          <div className="pinned-card">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{t("inviteCode")}</p>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-mono text-lg font-semibold text-ink">{house.inviteCode}</span>
              <button
                type="button"
                onClick={() => void copyInviteCode()}
                className="flex items-center gap-1.5 rounded-full bg-ink/5 px-3 py-1.5 text-xs font-medium text-ink-soft"
              >
                <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
                {t("copy")}
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                placeholder={t("joinAnotherHome")}
                className="min-w-0 flex-1 rounded-card border border-ink/10 px-3 py-2 text-sm uppercase outline-none focus:border-sage-500"
              />
              <button
                type="button"
                disabled={isWorking}
                onClick={() => void handleJoinHome()}
                className="rounded-card bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {t("join")}
              </button>
            </div>
          </div>
        ) : null}

        {message || error ? <p className="px-1 text-sm text-ink-soft">{message ?? error}</p> : null}

        <div>
          <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-ink-soft">{t("members")}</p>
          <ul className="flex flex-col gap-3">
            {members.map((member) => (
              <li key={member.userId} className="pinned-card flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-100 font-display text-base font-semibold text-sage-700">
                  {member.displayName.charAt(0)}
                </span>
                <span className="flex-1">
                  <span className="block font-medium text-ink">{member.displayName}</span>
                  <span className="block text-xs text-ink-soft">
                    {member.role === "owner" ? t("owner") : t("member")}
                  </span>
                </span>
                {member.role === "owner" ? <Crown className="h-4 w-4 text-honey-500" strokeWidth={1.75} /> : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
