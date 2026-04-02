export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  BANNED = 'BANNED',
}

export interface User {
  id: string;
  auth0Sub: string;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  timezone: string;
}

export interface UserWithProfile extends User {
  profile: UserProfile | null;
}
