'use client';

import { useState, useEffect } from 'react';
import { Users, Search, UserPlus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { FriendList } from '@/components/social/friend-list';
import { FriendRequestList } from '@/components/social/friend-request';
import { FriendshipStatus, type FriendWithProfile } from '@dsa/shared';

type Tab = 'friends' | 'requests' | 'search';

interface SearchResult {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  rating: number | null;
  isFriend: boolean;
  hasPendingRequest: boolean;
}

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [requests, setRequests] = useState<(FriendWithProfile & { createdAt: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  const fetchFriends = async () => {
    setIsLoading(true);
    try {
      const [friendsData, requestsData] = await Promise.all([
        apiClient.get<FriendWithProfile[]>('/friends'),
        apiClient.get<(FriendWithProfile & { createdAt: string })[]>('/friends/requests'),
      ]);
      setFriends(friendsData.filter((f) => f.status === FriendshipStatus.ACCEPTED));
      setRequests(requestsData.filter((r) => r.status === FriendshipStatus.PENDING));
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchFriends(); }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await apiClient.get<SearchResult[]>(`/users/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    setSendingRequest(userId);
    try {
      await apiClient.post('/friends/request', { targetUserId: userId });
      setSearchResults((prev) =>
        prev.map((r) => r.userId === userId ? { ...r, hasPendingRequest: true } : r)
      );
    } catch {
      // ignore
    } finally {
      setSendingRequest(null);
    }
  };

  const handleAccept = async (userId: string) => {
    await apiClient.post(`/friends/accept/${userId}`);
    await fetchFriends();
  };

  const handleDecline = async (userId: string) => {
    await apiClient.delete(`/friends/request/${userId}`);
    setRequests((prev) => prev.filter((r) => r.userId !== userId));
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Remove this friend?')) return;
    await apiClient.delete(`/friends/${userId}`);
    setFriends((prev) => prev.filter((f) => f.userId !== userId));
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'friends', label: 'Friends', count: friends.length },
    { id: 'requests', label: 'Requests', count: requests.length },
    { id: 'search', label: 'Add Friend' },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Users size={22} className="text-blue-400" />
          <h1 className="text-2xl font-bold text-slate-100">Friends</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  activeTab === tab.id ? 'bg-white/20' : 'bg-slate-700 text-slate-400'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'friends' && (
          isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-900 border border-slate-800 rounded-lg mb-1.5 animate-pulse" />
              ))
            : <FriendList friends={friends} onChallenge={() => {}} onRemove={handleRemove} />
        )}

        {activeTab === 'requests' && (
          isLoading
            ? Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-900 border border-slate-800 rounded-lg mb-1.5 animate-pulse" />
              ))
            : <FriendRequestList requests={requests} onAccept={handleAccept} onDecline={handleDecline} />
        )}

        {activeTab === 'search' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by username..."
                  className={cn(
                    'w-full bg-slate-800 border border-slate-700 rounded-lg',
                    'text-sm text-slate-300 pl-9 pr-4 py-2.5',
                    'focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600'
                  )}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isSearching ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
              </button>
            </div>

            <div className="space-y-1.5">
              {searchResults.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center gap-3 px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                    ) : (
                      user.displayName.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-200">{user.displayName}</p>
                    {user.rating && <p className="text-xs text-slate-500">{user.rating} rating</p>}
                  </div>
                  {!user.isFriend && !user.hasPendingRequest ? (
                    <button
                      onClick={() => handleSendRequest(user.userId)}
                      disabled={sendingRequest === user.userId}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/15 border border-blue-500/30 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-600/25 transition-colors"
                    >
                      {sendingRequest === user.userId ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <UserPlus size={11} />
                      )}
                      Add
                    </button>
                  ) : user.hasPendingRequest ? (
                    <span className="text-xs text-slate-500">Request sent</span>
                  ) : (
                    <span className="text-xs text-emerald-400">Friends</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
