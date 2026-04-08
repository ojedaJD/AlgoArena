const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(body.message || `Request failed: ${res.status}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  get<T>(path: string) { return this.request<T>(path); }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  }

  patch<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
  }

  put<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const api = new ApiClient(BASE_URL);
export const apiClient = api;

// ── Domain-specific API helpers ─────────────────────────────────────────

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

export const problemsApi = {
  list(params: { page?: number; limit?: number; difficulty?: string; topic?: string; tag?: string; search?: string } = {}) {
    const query = buildQuery(params);
    return api.get<{ items: unknown[]; total: number }>(`/v1/problems${query}`);
  },
  getBySlug(slug: string) {
    return api.get<unknown>(`/v1/problems/${slug}`);
  },
  getTestCases(slug: string) {
    return api.get<unknown[]>(`/v1/problems/${slug}/test-cases`);
  },
  getSubmissions(slug: string, params: { page?: number; limit?: number } = {}) {
    const query = buildQuery(params);
    return api.get<{ items: unknown[]; total: number }>(`/v1/problems/${slug}/submissions${query}`);
  },
};

export const matchApi = {
  joinQueue(mode: string = 'RANKED') {
    return api.post<unknown>('/v1/matches/queue', { mode });
  },
  leaveQueue() {
    return api.delete<void>('/v1/matches/queue');
  },
  getMatch(matchId: string) {
    return api.get<unknown>(`/v1/matches/${matchId}`);
  },
  getHistory(params: { page?: number; limit?: number } = {}) {
    const query = buildQuery(params);
    return api.get<{ data: unknown[]; pagination: unknown }>(`/v1/users/me/matches${query}`);
  },
  challenge(friendUserId: string) {
    return api.post<unknown>('/v1/matches/challenges', { friendUserId });
  },
  acceptChallenge(matchId: string) {
    return api.post<unknown>(`/v1/matches/${matchId}/accept`);
  },
};

export const leaderboardApi = {
  global(params: { type?: string; limit?: number } = {}) {
    const query = buildQuery(params);
    return api.get<{ entries: unknown[] }>(`/v1/leaderboards/global${query}`);
  },
  friends(params: { type?: string; limit?: number } = {}) {
    const query = buildQuery(params);
    return api.get<{ entries: unknown[] }>(`/v1/leaderboards/friends${query}`);
  },
};

export const topicsApi = {
  list() {
    return api.get<unknown[]>('/v1/topics');
  },
  getBySlug(slug: string) {
    return api.get<unknown>(`/v1/topics/${slug}`);
  },
};

export const usersApi = {
  getMe() {
    return api.get<unknown>('/v1/users/me');
  },
  updateProfile(body: Record<string, unknown>) {
    return api.patch<unknown>('/v1/users/me', body);
  },
  getById(userId: string) {
    return api.get<unknown>(`/v1/users/${userId}`);
  },
};

export const socialApi = {
  getFriends() {
    return api.get<unknown[]>('/v1/friends');
  },
  getPending() {
    return api.get<unknown[]>('/v1/friends/pending');
  },
  sendRequest(friendUserId: string) {
    return api.post<unknown>('/v1/friends/request', { friendUserId });
  },
  accept(friendshipId: string) {
    return api.post<unknown>(`/v1/friends/${friendshipId}/accept`);
  },
  reject(friendshipId: string) {
    return api.post<unknown>(`/v1/friends/${friendshipId}/reject`);
  },
  remove(friendshipId: string) {
    return api.delete<void>(`/v1/friends/${friendshipId}`);
  },
};

export const submissionsApi = {
  submit(body: { problemSlug: string; code: string; language: string; matchId?: string }) {
    return api.post<unknown>(`/v1/problems/${body.problemSlug}/submissions`, { code: body.code, language: body.language });
  },
  run(body: { code: string; language: string; input: string; problemSlug?: string }) {
    const slug = body.problemSlug || 'sandbox';
    return api.post<unknown>(`/v1/problems/${slug}/run`, { code: body.code, language: body.language, input: body.input });
  },
  getById(id: string) {
    return api.get<unknown>(`/v1/submissions/${id}`);
  },
  list(params: { page?: number; limit?: number } = {}) {
    const query = buildQuery(params);
    return api.get<{ data: unknown[]; nextCursor: string | null; hasMore: boolean }>(`/v1/users/me/submissions${query}`);
  },
};

export const gamificationApi = {
  getProgress() {
    return api.get<unknown>('/v1/users/me/progress');
  },
  getAchievements() {
    return api.get<unknown[]>('/v1/achievements');
  },
};

export const ratingsApi = {
  getMine() {
    return api.get<unknown>('/v1/users/me/rating');
  },
  getHistory() {
    return api.get<unknown[]>('/v1/users/me/rating/history');
  },
};

// ── Curriculum Track API helpers ──────────────────────────────────────────

export interface CurriculumTrack {
  slug: string;
  title: string;
  description: string;
  orderIndex: number;
}

export interface CurriculumSection {
  id: string;
  title: string;
  orderIndex: number;
  items: CurriculumItem[];
}

export interface CurriculumItem {
  id: string;
  kind: 'LESSON' | 'TOPIC' | 'PROBLEM';
  orderIndex: number;
  lessonId: string | null;
  topicId: string | null;
  problemSlug: string | null;
  lesson: { id: string; title: string } | null;
  topic: { id: string; slug: string; title: string } | null;
}

export interface CurriculumTrackDetail extends CurriculumTrack {
  sections: CurriculumSection[];
}

export interface LessonProgressEntry {
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  startedAt?: string;
  completedAt?: string;
}

export interface CurriculumProgress {
  lessons: Record<string, LessonProgressEntry>;
}

export interface LessonDetail {
  id: string;
  title: string;
  contentMd: string;
  topicId: string;
  orderIndex: number;
}

export const curriculumApi = {
  getTracks() {
    return api.get<CurriculumTrack[]>('/v1/curriculum/tracks');
  },
  getTrack(slug: string) {
    return api.get<CurriculumTrackDetail>(`/v1/curriculum/tracks/${slug}`);
  },
  getProgress() {
    return api.get<CurriculumProgress>('/v1/users/me/curriculum/progress');
  },
  updateLessonProgress(lessonId: string, status: string) {
    return api.post<LessonProgressEntry>(`/v1/lessons/${lessonId}/progress`, { status });
  },
  getLesson(id: string) {
    return api.get<LessonDetail>(`/v1/lessons/${id}`);
  },
};
