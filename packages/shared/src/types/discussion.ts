export interface DiscussionThread {
  id: string;
  problemId: string;
  userId: string;
  title: string;
  postCount: number;
  createdAt: string;
  updatedAt: string;
  author: { displayName: string; avatarUrl: string | null };
}

export interface DiscussionPost {
  id: string;
  threadId: string;
  userId: string;
  body: string;
  parentPostId: string | null;
  createdAt: string;
  updatedAt: string;
  author: { displayName: string; avatarUrl: string | null };
}
