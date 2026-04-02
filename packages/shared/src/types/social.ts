export enum FriendshipStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  BLOCKED = 'BLOCKED',
}

export interface Friendship {
  id: string;
  userId: string;
  friendUserId: string;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FriendWithProfile {
  friendshipId: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  status: FriendshipStatus;
  rating: number | null;
  online: boolean;
}
