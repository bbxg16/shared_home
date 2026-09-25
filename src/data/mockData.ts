import type {
  House,
  HouseMember,
  Purchase,
  Report,
  ReportVote,
  Vote,
} from "@/types";

export const mockHouse: House = {
  id: "house-demo-1",
  name: "有本要奏 Demo",
  ownerId: "user-1",
  inviteCode: "DEMO-4821",
};

export const mockMembers: HouseMember[] = [
  { userId: "user-1", displayName: "Alex", role: "owner" },
  { userId: "user-2", displayName: "Sam", role: "member" },
  { userId: "user-3", displayName: "Jordan", role: "member" },
  { userId: "user-4", displayName: "Riley", role: "member" },
];

export const mockPurchases: Purchase[] = [
  {
    id: "p1",
    name: "Nike Air Force 1",
    productUrl: "https://example.com/nike-air-force-1",
    price: "169 SGD",
    description: "Mine finally gave out. Looking for the white low-top pair before the sale ends.",
    requestedBy: "user-1",
    requestedByName: "Alex",
    status: "pending",
    eligibleVoterCount: 3,
    requiredApprovals: 2,
    createdAt: "2026-09-21T09:00:00Z",
    expiresAt: "2026-09-28T09:00:00Z",
  },
  {
    id: "p2",
    name: "Wool desk chair cushion",
    productUrl: "https://example.com/desk-cushion",
    price: "34 SGD",
    description: "For my desk chair. I can pay personally; just want house approval first.",
    requestedBy: "user-3",
    requestedByName: "Jordan",
    status: "pending",
    eligibleVoterCount: 3,
    requiredApprovals: 2,
    createdAt: "2026-09-20T14:30:00Z",
    expiresAt: "2026-09-27T14:30:00Z",
  },
  {
    id: "p3",
    name: "Le Creuset mini cocotte",
    productUrl: "https://example.com/le-creuset-mini",
    price: "45 SGD",
    description: "For meal-prepping solo portions.",
    requestedBy: "user-4",
    requestedByName: "Riley",
    status: "approved",
    eligibleVoterCount: 3,
    requiredApprovals: 2,
    createdAt: "2026-09-18T11:00:00Z",
    expiresAt: "2026-09-25T11:00:00Z",
  },
  {
    id: "p4",
    name: "Ray-Ban sunglasses",
    productUrl: "https://example.com/ray-ban",
    price: "178 SGD",
    description: "Replacement sunglasses for commute and weekend use.",
    requestedBy: "user-2",
    requestedByName: "Sam",
    status: "rejected",
    eligibleVoterCount: 3,
    requiredApprovals: 2,
    createdAt: "2026-09-16T16:15:00Z",
    expiresAt: "2026-09-23T16:15:00Z",
  },
];

export const mockVotes: Record<string, Vote[]> = {
  p1: [
    { userId: "user-2", userName: "Sam", vote: "approve", comment: "Good price.", createdAt: "2026-09-21T10:00:00Z" },
  ],
  p3: [
    { userId: "user-1", userName: "Alex", vote: "approve", comment: "Looks reasonable.", createdAt: "2026-09-18T12:00:00Z" },
    { userId: "user-2", userName: "Sam", vote: "approve", comment: "Approved.", createdAt: "2026-09-18T13:00:00Z" },
  ],
  p4: [
    { userId: "user-1", userName: "Alex", vote: "reject", comment: "We already have three pairs in the drawer.", createdAt: "2026-09-16T17:00:00Z" },
    { userId: "user-3", userName: "Jordan", vote: "reject", comment: "Over budget for this month.", createdAt: "2026-09-16T18:00:00Z" },
  ],
};

export const mockReports: Report[] = [
  {
    id: "r1",
    targetUserId: "user-2",
    targetUserName: "Sam",
    reportedBy: "user-3",
    reportedByName: "Jordan",
    comments: "Sam left wet laundry in the washer twice this week.",
    status: "open",
    eligibleVoterCount: 3,
    requiredAgreementCount: 2,
    createdAt: "2026-09-21T08:00:00Z",
    expiresAt: "2026-09-28T08:00:00Z",
  },
  {
    id: "r2",
    targetUserId: "user-4",
    targetUserName: "Riley",
    reportedBy: "user-1",
    reportedByName: "Alex",
    comments: "Kitchen bin was full overnight after Riley cooked.",
    status: "agreed",
    eligibleVoterCount: 3,
    requiredAgreementCount: 2,
    createdAt: "2026-09-19T20:00:00Z",
    expiresAt: "2026-09-26T20:00:00Z",
  },
];

export const mockReportVotes: Record<string, ReportVote[]> = {
  r2: [
    { userId: "user-2", userName: "Sam", vote: "agree", comment: "I saw it too.", createdAt: "2026-09-19T21:00:00Z" },
    { userId: "user-3", userName: "Jordan", vote: "agree", comment: "Agree.", createdAt: "2026-09-19T22:00:00Z" },
  ],
};

export const mockCurrentUserId = "user-1";
