export type PurchaseStatus = "pending" | "approved" | "rejected" | "expired";
export type ReportStatus = "open" | "agreed" | "disagreed" | "expired";

export type VoteType = "approve" | "reject";
export type ReportVoteType = "agree" | "disagree";

export interface AppUser {
  id: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  currentHouseId?: string;
}

export interface House {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
}

export interface HouseMember {
  userId: string;
  displayName: string;
  photoURL?: string;
  role: "owner" | "member";
}

export interface Purchase {
  id: string;
  name: string;
  productUrl?: string;
  price?: string;
  description: string;
  requestedBy: string;
  requestedByName: string;
  status: PurchaseStatus;
  eligibleVoterCount: number;
  requiredApprovals: number;
  createdAt: string;
  expiresAt: string;
}

export interface Vote {
  userId: string;
  userName: string;
  vote: VoteType;
  comment?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  targetUserId: string;
  targetUserName: string;
  reportedBy: string;
  reportedByName: string;
  comments: string;
  targetResponse?: string;
  targetRespondedAt?: string;
  status: ReportStatus;
  eligibleVoterCount: number;
  requiredAgreementCount: number;
  createdAt: string;
  expiresAt: string;
}

export interface ReportVote {
  userId: string;
  userName: string;
  vote: ReportVoteType;
  comment?: string;
  createdAt: string;
}

export interface WeeklyReportSummary {
  userId: string;
  userName: string;
  receivedCount: number;
  agreedCount: number;
  disagreedCount: number;
}
