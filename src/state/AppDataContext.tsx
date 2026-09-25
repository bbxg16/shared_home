import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type DocumentReference,
  type QueryDocumentSnapshot,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { observeAuthState } from "@/services/authService";
import {
  mockCurrentUserId,
  mockHouse,
  mockMembers,
  mockPurchases,
  mockReportVotes,
  mockReports,
  mockVotes,
} from "@/data/mockData";
import type {
  House,
  HouseMember,
  Purchase,
  Report,
  ReportVote,
  Vote,
  WeeklyReportSummary,
} from "@/types";

interface NewPurchaseRequest {
  name: string;
  productUrl?: string;
  price?: string;
  description: string;
}

interface NewReport {
  targetUserId: string;
  comments: string;
}

interface AppDataContextValue {
  authUser: User | null;
  currentUser: HouseMember;
  currentHouse: House | null;
  members: HouseMember[];
  purchases: Purchase[];
  purchaseVotes: Record<string, Vote[]>;
  reports: Report[];
  reportVotes: Record<string, ReportVote[]>;
  weeklyReportSummaries: WeeklyReportSummary[];
  isFirebaseMode: boolean;
  isLoading: boolean;
  error: string | null;
  updateDisplayName: (displayName: string) => Promise<void>;
  createHome: (name: string) => Promise<void>;
  joinHomeWithInviteCode: (inviteCode: string) => Promise<void>;
  updateHomeName: (name: string) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  createPurchaseRequest: (request: NewPurchaseRequest) => Promise<void>;
  deletePurchaseRequest: (purchaseId: string) => Promise<void>;
  voteOnPurchase: (purchaseId: string, vote: Vote["vote"], comment?: string) => Promise<void>;
  createReport: (report: NewReport) => Promise<void>;
  deleteReport: (reportId: string) => Promise<void>;
  respondToReport: (reportId: string, response: string) => Promise<void>;
  voteOnReport: (reportId: string, vote: ReportVote["vote"], comment?: string) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [currentHouse, setCurrentHouse] = useState<House | null>(isFirebaseConfigured ? null : mockHouse);
  const [members, setMembers] = useState<HouseMember[]>(isFirebaseConfigured ? [] : mockMembers);
  const [purchases, setPurchases] = useState<Purchase[]>(isFirebaseConfigured ? [] : mockPurchases);
  const [purchaseVotes, setPurchaseVotes] = useState<Record<string, Vote[]>>(isFirebaseConfigured ? {} : mockVotes);
  const [reports, setReports] = useState<Report[]>(isFirebaseConfigured ? [] : mockReports);
  const [reportVotes, setReportVotes] = useState<Record<string, ReportVote[]>>(isFirebaseConfigured ? {} : mockReportVotes);
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null);

  const fallbackUser = mockMembers.find((member) => member.userId === mockCurrentUserId) ?? mockMembers[0];
  const currentUser: HouseMember = authUser
    ? {
        userId: authUser.uid,
        displayName: getUserDisplayName(authUser, profileDisplayName),
        photoURL: authUser.photoURL ?? undefined,
        role: members.find((member) => member.userId === authUser.uid)?.role ?? "member",
      }
    : fallbackUser;

  const weeklyReportSummaries = useMemo(() => {
    return members.map((member) => {
      const receivedReports = reports.filter((report) => report.targetUserId === member.userId);
      return {
        userId: member.userId,
        userName: member.displayName,
        receivedCount: receivedReports.length,
        agreedCount: receivedReports.filter((report) => report.status === "agreed").length,
        disagreedCount: receivedReports.filter((report) => report.status === "disagreed").length,
      };
    });
  }, [members, reports]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return () => undefined;
    }

    return observeAuthState((user) => {
      setAuthUser(user);
      setIsLoading(false);
      if (!user) {
        setCurrentHouse(null);
        setMembers([]);
        setPurchases([]);
        setPurchaseVotes({});
        setReports([]);
        setReportVotes({});
      }
    });
  }, []);

  useEffect(() => {
    if (!db || !authUser) {
      return () => undefined;
    }

    const unsubscribe = onSnapshot(
      doc(db, "users", authUser.uid),
      async (snapshot) => {
        const userData = snapshot.data();
        const houseId = userData?.currentHouseId as string | undefined;
        setProfileDisplayName(
          typeof userData?.displayName === "string" && userData.displayName.trim()
            ? userData.displayName
            : null
        );

        if (!houseId) {
          setCurrentHouse(null);
          setMembers([]);
          setPurchases([]);
          setPurchaseVotes({});
          setReports([]);
          setReportVotes({});
          return;
        }

        await cleanupExpiredPosts(houseId);
        setCurrentHouse((current) => (current?.id === houseId ? current : { id: houseId, name: "Loading home", ownerId: "", inviteCode: "" }));
      },
      (snapshotError) => setError(formatFirebaseError(snapshotError.message))
    );

    return unsubscribe;
  }, [authUser]);

  useEffect(() => {
    if (!db || !authUser || !currentHouse?.id) {
      return () => undefined;
    }

    const houseId = currentHouse.id;
    const unsubscribes: Unsubscribe[] = [
      onSnapshot(
        doc(db, "houses", houseId),
        (snapshot) => {
          if (snapshot.exists()) {
            setCurrentHouse(parseHouse(snapshot));
          }
        },
        (snapshotError) => setError(formatFirebaseError(snapshotError.message))
      ),
      onSnapshot(
        query(collection(db, "houses", houseId, "members"), orderBy("displayName")),
        (snapshot) => setMembers(snapshot.docs.map(parseMember)),
        (snapshotError) => setError(formatFirebaseError(snapshotError.message))
      ),
      onSnapshot(
        query(collection(db, "houses", houseId, "purchases"), orderBy("createdAt", "desc")),
        (snapshot) => setPurchases(snapshot.docs.map(parsePurchase)),
        (snapshotError) => setError(formatFirebaseError(snapshotError.message))
      ),
      onSnapshot(
        query(collection(db, "houses", houseId, "reports"), orderBy("createdAt", "desc")),
        (snapshot) => setReports(snapshot.docs.map(parseReport)),
        (snapshotError) => setError(formatFirebaseError(snapshotError.message))
      ),
    ];

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [authUser, currentHouse?.id]);

  useEffect(() => {
    if (!db || !currentHouse?.id || purchases.length === 0) {
      setPurchaseVotes({});
      return () => undefined;
    }

    const firestore = db;
    const houseId = currentHouse.id;
    const unsubscribes = purchases.map((purchase) =>
      onSnapshot(
        collection(firestore, "houses", houseId, "purchases", purchase.id, "votes"),
        (snapshot) => {
          setPurchaseVotes((current) => ({
            ...current,
            [purchase.id]: snapshot.docs.map(parseVote),
          }));
        },
        (snapshotError) => setError(formatFirebaseError(snapshotError.message))
      )
    );

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [currentHouse?.id, purchases]);

  useEffect(() => {
    if (!db || !currentHouse?.id || reports.length === 0) {
      setReportVotes({});
      return () => undefined;
    }

    const firestore = db;
    const houseId = currentHouse.id;
    const unsubscribes = reports.map((report) =>
      onSnapshot(
        collection(firestore, "houses", houseId, "reports", report.id, "votes"),
        (snapshot) => {
          setReportVotes((current) => ({
            ...current,
            [report.id]: snapshot.docs.map(parseReportVote),
          }));
        },
        (snapshotError) => setError(formatFirebaseError(snapshotError.message))
      )
    );

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [currentHouse?.id, reports]);

  async function createHome(name: string) {
    if (!db || !authUser) {
      setError("Sign in before creating a home.");
      return;
    }

    const inviteCode = generateInviteCode();
    const houseRef = doc(collection(db, "houses"));
    const member: HouseMember = {
      userId: authUser.uid,
      displayName: getUserDisplayName(authUser, profileDisplayName),
      photoURL: authUser.photoURL ?? undefined,
      role: "owner",
    };

    const batch = writeBatch(db);
    batch.set(houseRef, {
      name,
      ownerId: authUser.uid,
      inviteCode,
      createdAt: serverTimestamp(),
    });
    batch.set(doc(db, "houses", houseRef.id, "members", authUser.uid), {
      ...member,
      joinedAt: serverTimestamp(),
    });
    batch.set(
      doc(db, "users", authUser.uid),
      {
        displayName: member.displayName,
        email: authUser.email ?? null,
        photoURL: authUser.photoURL ?? null,
        currentHouseId: houseRef.id,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    await batch.commit();
  }

  async function joinHomeWithInviteCode(inviteCode: string) {
    if (!db || !authUser) {
      setError("Sign in before joining a home.");
      return;
    }

    const normalizedCode = inviteCode.trim().toUpperCase();
    const homes = await getDocs(query(collection(db, "houses"), where("inviteCode", "==", normalizedCode), limit(1)));
    const houseSnapshot = homes.docs[0];
    if (!houseSnapshot) {
      throw new Error("Invite code not found.");
    }

    const member: HouseMember = {
      userId: authUser.uid,
      displayName: getUserDisplayName(authUser, profileDisplayName),
      photoURL: authUser.photoURL ?? undefined,
      role: "member",
    };

    const batch = writeBatch(db);
    batch.set(doc(db, "houses", houseSnapshot.id, "members", authUser.uid), {
      ...member,
      joinedAt: serverTimestamp(),
    });
    batch.set(
      doc(db, "users", authUser.uid),
      {
        displayName: member.displayName,
        email: authUser.email ?? null,
        photoURL: authUser.photoURL ?? null,
        currentHouseId: houseSnapshot.id,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    await batch.commit();
  }

  async function updateHomeName(name: string) {
    const trimmedName = name.trim();
    if (!trimmedName || !currentHouse) {
      return;
    }

    if (!db || !authUser) {
      setCurrentHouse((house) => (house ? { ...house, name: trimmedName } : house));
      return;
    }

    if (currentHouse.ownerId !== authUser.uid) {
      throw new Error("Only the home owner can rename the home.");
    }

    await updateDoc(doc(db, "houses", currentHouse.id), {
      name: trimmedName,
      updatedAt: serverTimestamp(),
    });
  }

  async function removeMember(userId: string) {
    if (!currentHouse || userId === currentHouse.ownerId) {
      return;
    }

    if (!db || !authUser) {
      setMembers((current) => current.filter((member) => member.userId !== userId));
      return;
    }

    if (currentHouse.ownerId !== authUser.uid) {
      throw new Error("Only the home owner can remove members.");
    }

    const batch = writeBatch(db);
    batch.delete(doc(db, "houses", currentHouse.id, "members", userId));
    batch.set(
      doc(db, "users", userId),
      {
        currentHouseId: null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    await batch.commit();
  }

  async function createPurchaseRequest(request: NewPurchaseRequest) {
    if (isFirebaseConfigured && (!db || !authUser || !currentHouse)) {
      setError("Sign in and create or join a home before posting.");
      return;
    }

    if (!db || !authUser || !currentHouse) {
      createMockPurchaseRequest(request);
      return;
    }

    const purchaseRef = doc(collection(db, "houses", currentHouse.id, "purchases"));
    const eligibleVoterCount = Math.max(members.length - 1, 1);

    await setDoc(purchaseRef, {
      name: request.name,
      productUrl: request.productUrl ?? null,
      price: request.price ?? null,
      description: request.description,
      requestedBy: authUser.uid,
      requestedByName: getUserDisplayName(authUser, profileDisplayName),
      status: "pending",
      eligibleVoterCount,
      requiredApprovals: getMajorityThreshold(eligibleVoterCount),
      createdAt: serverTimestamp(),
      expiresAt: addDays(new Date(), 7),
    });
  }

  async function deletePurchaseRequest(purchaseId: string) {
    const purchase = purchases.find((item) => item.id === purchaseId);
    if (!purchase) {
      return;
    }

    if (!db || !authUser || !currentHouse) {
      if (purchase.requestedBy === currentUser.userId) {
        setPurchases((current) => current.filter((item) => item.id !== purchaseId));
        setPurchaseVotes((current) => {
          const nextVotes = { ...current };
          delete nextVotes[purchaseId];
          return nextVotes;
        });
      }
      return;
    }

    if (purchase.requestedBy !== authUser.uid) {
      throw new Error("Only the requester can delete this request.");
    }

    await deletePostWithVotes(doc(db, "houses", currentHouse.id, "purchases", purchaseId));
  }

  async function voteOnPurchase(purchaseId: string, vote: Vote["vote"], comment = "") {
    if (isFirebaseConfigured && (!db || !authUser || !currentHouse)) {
      setError("Sign in and join a home before voting.");
      return;
    }

    if (!db || !authUser || !currentHouse) {
      voteOnMockPurchase(purchaseId, vote, comment);
      return;
    }

    const purchase = purchases.find((item) => item.id === purchaseId);
    if (!purchase || purchase.requestedBy === authUser.uid || purchase.status === "expired") {
      return;
    }

    await setDoc(doc(db, "houses", currentHouse.id, "purchases", purchaseId, "votes", authUser.uid), {
      userId: authUser.uid,
      userName: getUserDisplayName(authUser, profileDisplayName),
      vote,
      comment: comment.trim() || null,
      createdAt: serverTimestamp(),
    });

    const votesSnapshot = await getDocs(collection(db, "houses", currentHouse.id, "purchases", purchaseId, "votes"));
    const nextVotes = votesSnapshot.docs.map(parseVote);
    const approveCount = nextVotes.filter((item) => item.vote === "approve").length;
    const rejectCount = nextVotes.filter((item) => item.vote === "reject").length;

    if (purchase.status !== "pending") {
      return;
    }

    if (approveCount >= purchase.requiredApprovals) {
      await updateDoc(doc(db, "houses", currentHouse.id, "purchases", purchaseId), { status: "approved" });
    } else if (rejectCount >= purchase.requiredApprovals) {
      await updateDoc(doc(db, "houses", currentHouse.id, "purchases", purchaseId), { status: "rejected" });
    }
  }

  async function createReport(report: NewReport) {
    if (isFirebaseConfigured && (!db || !authUser || !currentHouse)) {
      setError("Sign in and create or join a home before posting.");
      return;
    }

    if (!db || !authUser || !currentHouse) {
      createMockReport(report);
      return;
    }

    const targetMember = members.find((member) => member.userId === report.targetUserId);
    if (!targetMember) {
      return;
    }

    const reportRef = doc(collection(db, "houses", currentHouse.id, "reports"));
    const eligibleVoterCount = Math.max(members.length, 1);

    await setDoc(reportRef, {
      targetUserId: targetMember.userId,
      targetUserName: targetMember.displayName,
      reportedBy: authUser.uid,
      reportedByName: getUserDisplayName(authUser, profileDisplayName),
      comments: report.comments,
      status: "open",
      eligibleVoterCount,
      requiredAgreementCount: getMajorityThreshold(eligibleVoterCount),
      createdAt: serverTimestamp(),
      expiresAt: addDays(new Date(), 7),
    });
  }

  async function deleteReport(reportId: string) {
    const report = reports.find((item) => item.id === reportId);
    if (!report) {
      return;
    }

    if (!db || !authUser || !currentHouse) {
      if (report.reportedBy === currentUser.userId) {
        setReports((current) => current.filter((item) => item.id !== reportId));
        setReportVotes((current) => {
          const nextVotes = { ...current };
          delete nextVotes[reportId];
          return nextVotes;
        });
      }
      return;
    }

    if (report.reportedBy !== authUser.uid) {
      throw new Error("Only the reporter can delete this report.");
    }

    await deletePostWithVotes(doc(db, "houses", currentHouse.id, "reports", reportId));
  }

  async function respondToReport(reportId: string, response: string) {
    const trimmedResponse = response.trim();
    const report = reports.find((item) => item.id === reportId);
    if (!report || !trimmedResponse) {
      return;
    }

    if (!db || !authUser || !currentHouse) {
      if (report.targetUserId === currentUser.userId) {
        setReports((current) =>
          current.map((item) =>
            item.id === reportId
              ? {
                  ...item,
                  targetResponse: trimmedResponse,
                  targetRespondedAt: new Date().toISOString(),
                }
              : item
          )
        );
      }
      return;
    }

    if (report.targetUserId !== authUser.uid) {
      throw new Error("Only the reported member can respond to this report.");
    }

    await updateDoc(doc(db, "houses", currentHouse.id, "reports", reportId), {
      targetResponse: trimmedResponse,
      targetRespondedAt: serverTimestamp(),
    });
  }

  async function voteOnReport(reportId: string, vote: ReportVote["vote"], comment = "") {
    if (isFirebaseConfigured && (!db || !authUser || !currentHouse)) {
      setError("Sign in and join a home before voting.");
      return;
    }

    if (!db || !authUser || !currentHouse) {
      voteOnMockReport(reportId, vote, comment);
      return;
    }

    const report = reports.find((item) => item.id === reportId);
    if (!report || report.status === "expired") {
      return;
    }

    await setDoc(doc(db, "houses", currentHouse.id, "reports", reportId, "votes", authUser.uid), {
      userId: authUser.uid,
      userName: getUserDisplayName(authUser, profileDisplayName),
      vote,
      comment: comment.trim() || null,
      createdAt: serverTimestamp(),
    });

    const votesSnapshot = await getDocs(collection(db, "houses", currentHouse.id, "reports", reportId, "votes"));
    const nextVotes = votesSnapshot.docs.map(parseReportVote);
    const agreeCount = nextVotes.filter((item) => item.vote === "agree").length;
    const disagreeCount = nextVotes.filter((item) => item.vote === "disagree").length;

    if (report.status !== "open") {
      return;
    }

    if (agreeCount >= report.requiredAgreementCount) {
      await updateDoc(doc(db, "houses", currentHouse.id, "reports", reportId), { status: "agreed" });
    } else if (disagreeCount >= report.requiredAgreementCount) {
      await updateDoc(doc(db, "houses", currentHouse.id, "reports", reportId), { status: "disagreed" });
    }
  }

  function createMockPurchaseRequest(request: NewPurchaseRequest) {
    const createdAt = new Date();
    const eligibleVoterCount = Math.max(mockMembers.length - 1, 1);
    setPurchases((current) => [
      {
        id: `p-${crypto.randomUUID()}`,
        ...request,
        requestedBy: currentUser.userId,
        requestedByName: currentUser.displayName,
        status: "pending",
        eligibleVoterCount,
        requiredApprovals: getMajorityThreshold(eligibleVoterCount),
        createdAt: createdAt.toISOString(),
        expiresAt: addDays(createdAt, 7).toISOString(),
      },
      ...current,
    ]);
  }

  function voteOnMockPurchase(purchaseId: string, vote: Vote["vote"], comment = "") {
    const nextVote: Vote = {
      userId: currentUser.userId,
      userName: currentUser.displayName,
      vote,
      comment: comment.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    let nextVotes: Vote[] = [];
    setPurchaseVotes((current) => {
      nextVotes = [
        ...(current[purchaseId] ?? []).filter((item) => item.userId !== currentUser.userId),
        nextVote,
      ];
      return { ...current, [purchaseId]: nextVotes };
    });
    setPurchases((current) => updatePurchaseStatus(current, purchaseId, nextVotes));
  }

  function createMockReport(report: NewReport) {
    const createdAt = new Date();
    const targetMember = members.find((member) => member.userId === report.targetUserId);
    const eligibleVoterCount = Math.max(members.length, 1);
    if (!targetMember) {
      return;
    }

    setReports((current) => [
      {
        id: `r-${crypto.randomUUID()}`,
        targetUserId: targetMember.userId,
        targetUserName: targetMember.displayName,
        reportedBy: currentUser.userId,
        reportedByName: currentUser.displayName,
        comments: report.comments,
        status: "open",
        eligibleVoterCount,
        requiredAgreementCount: getMajorityThreshold(eligibleVoterCount),
        createdAt: createdAt.toISOString(),
        expiresAt: addDays(createdAt, 7).toISOString(),
      },
      ...current,
    ]);
  }

  function voteOnMockReport(reportId: string, vote: ReportVote["vote"], comment = "") {
    const nextVote: ReportVote = {
      userId: currentUser.userId,
      userName: currentUser.displayName,
      vote,
      comment: comment.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    let nextVotes: ReportVote[] = [];
    setReportVotes((current) => {
      nextVotes = [
        ...(current[reportId] ?? []).filter((item) => item.userId !== currentUser.userId),
        nextVote,
      ];
      return { ...current, [reportId]: nextVotes };
    });
    setReports((current) => updateReportStatus(current, reportId, nextVotes));
  }

  async function updateDisplayName(displayName: string) {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      return;
    }

    if (!db || !authUser) {
      setProfileDisplayName(trimmedName);
      return;
    }

    await setDoc(
      doc(db, "users", authUser.uid),
      {
        displayName: trimmedName,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    if (currentHouse) {
      await setDoc(
        doc(db, "houses", currentHouse.id, "members", authUser.uid),
        {
          userId: authUser.uid,
          displayName: trimmedName,
          photoURL: authUser.photoURL ?? null,
          role: members.find((member) => member.userId === authUser.uid)?.role ?? "member",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    setProfileDisplayName(trimmedName);
  }

  return (
    <AppDataContext.Provider
      value={{
        authUser,
        currentUser,
        currentHouse,
        members,
        purchases,
        purchaseVotes,
        reports,
        reportVotes,
        weeklyReportSummaries,
        isFirebaseMode: isFirebaseConfigured,
        isLoading,
        error,
        updateDisplayName,
        createHome,
        joinHomeWithInviteCode,
        updateHomeName,
        removeMember,
        createPurchaseRequest,
        deletePurchaseRequest,
        voteOnPurchase,
        createReport,
        deleteReport,
        respondToReport,
        voteOnReport,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }
  return context;
}

function parseHouse(snapshot: QueryDocumentSnapshot<DocumentData>): House {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: String(data.name ?? "Home"),
    ownerId: String(data.ownerId ?? ""),
    inviteCode: String(data.inviteCode ?? ""),
  };
}

function parseMember(snapshot: QueryDocumentSnapshot<DocumentData>): HouseMember {
  const data = snapshot.data();
  return {
    userId: String(data.userId ?? snapshot.id),
    displayName: String(data.displayName ?? "Member"),
    photoURL: data.photoURL ? String(data.photoURL) : undefined,
    role: data.role === "owner" ? "owner" : "member",
  };
}

function parsePurchase(snapshot: QueryDocumentSnapshot<DocumentData>): Purchase {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: String(data.name ?? "Untitled request"),
    productUrl: data.productUrl ? String(data.productUrl) : undefined,
    price: data.price === null || data.price === undefined ? undefined : String(data.price),
    description: String(data.description ?? ""),
    requestedBy: String(data.requestedBy ?? ""),
    requestedByName: String(data.requestedByName ?? "Member"),
    status: data.status === "approved" || data.status === "rejected" || data.status === "expired" ? data.status : "pending",
    eligibleVoterCount: Number(data.eligibleVoterCount ?? 1),
    requiredApprovals: Number(data.requiredApprovals ?? 1),
    createdAt: dateValueToIso(data.createdAt),
    expiresAt: dateValueToIso(data.expiresAt),
  };
}

function parseVote(snapshot: QueryDocumentSnapshot<DocumentData>): Vote {
  const data = snapshot.data();
  return {
    userId: String(data.userId ?? snapshot.id),
    userName: String(data.userName ?? "Member"),
    vote: data.vote === "reject" ? "reject" : "approve",
    comment: data.comment ? String(data.comment) : undefined,
    createdAt: dateValueToIso(data.createdAt),
  };
}

function parseReport(snapshot: QueryDocumentSnapshot<DocumentData>): Report {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    targetUserId: String(data.targetUserId ?? ""),
    targetUserName: String(data.targetUserName ?? "Member"),
    reportedBy: String(data.reportedBy ?? ""),
    reportedByName: String(data.reportedByName ?? "Member"),
    comments: String(data.comments ?? ""),
    targetResponse: data.targetResponse ? String(data.targetResponse) : undefined,
    targetRespondedAt: data.targetRespondedAt ? dateValueToIso(data.targetRespondedAt) : undefined,
    status: data.status === "agreed" || data.status === "disagreed" || data.status === "expired" ? data.status : "open",
    eligibleVoterCount: Number(data.eligibleVoterCount ?? 1),
    requiredAgreementCount: Number(data.requiredAgreementCount ?? 1),
    createdAt: dateValueToIso(data.createdAt),
    expiresAt: dateValueToIso(data.expiresAt),
  };
}

function parseReportVote(snapshot: QueryDocumentSnapshot<DocumentData>): ReportVote {
  const data = snapshot.data();
  return {
    userId: String(data.userId ?? snapshot.id),
    userName: String(data.userName ?? "Member"),
    vote: data.vote === "disagree" ? "disagree" : "agree",
    comment: data.comment ? String(data.comment) : undefined,
    createdAt: dateValueToIso(data.createdAt),
  };
}

async function cleanupExpiredPosts(houseId: string) {
  if (!db) {
    return;
  }

  const now = new Date();
  await Promise.all([
    deleteExpiredDocs(collection(db, "houses", houseId, "purchases"), now),
    deleteExpiredDocs(collection(db, "houses", houseId, "reports"), now),
  ]);
}

async function deleteExpiredDocs(postsCollection: ReturnType<typeof collection>, now: Date) {
  const expiredSnapshot = await getDocs(query(postsCollection, where("expiresAt", "<", now), limit(10)));
  await Promise.all(
    expiredSnapshot.docs.map(async (postSnapshot) => {
      const votesSnapshot = await getDocs(collection(postSnapshot.ref, "votes"));
      const batch = writeBatch(postSnapshot.ref.firestore);
      votesSnapshot.docs.forEach((voteSnapshot) => batch.delete(voteSnapshot.ref));
      batch.delete(postSnapshot.ref);
      await batch.commit();
    })
  );
}

async function deletePostWithVotes(postRef: DocumentReference<DocumentData>) {
  const votesSnapshot = await getDocs(collection(postRef, "votes"));
  const batch = writeBatch(postRef.firestore);
  votesSnapshot.docs.forEach((voteSnapshot) => batch.delete(voteSnapshot.ref));
  batch.delete(postRef);
  await batch.commit();
}

function updatePurchaseStatus(purchases: Purchase[], purchaseId: string, votes: Vote[]): Purchase[] {
  return purchases.map((purchase) => {
    if (purchase.id !== purchaseId || purchase.status !== "pending") {
      return purchase;
    }

    const approveCount = votes.filter((item) => item.vote === "approve").length;
    const rejectCount = votes.filter((item) => item.vote === "reject").length;
    if (approveCount >= purchase.requiredApprovals) {
      return { ...purchase, status: "approved" as const };
    }
    if (rejectCount >= purchase.requiredApprovals) {
      return { ...purchase, status: "rejected" as const };
    }
    return purchase;
  });
}

function updateReportStatus(reports: Report[], reportId: string, votes: ReportVote[]): Report[] {
  return reports.map((report) => {
    if (report.id !== reportId || report.status !== "open") {
      return report;
    }

    const agreeCount = votes.filter((item) => item.vote === "agree").length;
    const disagreeCount = votes.filter((item) => item.vote === "disagree").length;
    if (agreeCount >= report.requiredAgreementCount) {
      return { ...report, status: "agreed" as const };
    }
    if (disagreeCount >= report.requiredAgreementCount) {
      return { ...report, status: "disagreed" as const };
    }
    return report;
  });
}

function dateValueToIso(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as Timestamp).toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  return new Date().toISOString();
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function getMajorityThreshold(voterCount: number) {
  return Math.floor(voterCount / 2) + 1;
}

function getUserDisplayName(user: User, profileDisplayName?: string | null) {
  return profileDisplayName || user.displayName || user.email?.split("@")[0] || "Guest";
}

function formatFirebaseError(message: string) {
  if (message.toLowerCase().includes("missing or insufficient permissions")) {
    return "Firebase rules are blocking this action. Publish the included Firestore rules in Firebase Console, then refresh.";
  }
  return message;
}
