'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Shield, BookOpen, GraduationCap, BarChart2, Loader2, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/problems', label: 'Problems', icon: BookOpen },
  { href: '/admin/topics', label: 'Topics', icon: GraduationCap },
  { href: '/admin/stats', label: 'Stats', icon: BarChart2 },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <Loader2 size={28} className="animate-spin text-blue-400" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-400">
        <Shield size={40} className="text-red-400 mb-3" />
        <h1 className="text-xl font-bold text-slate-200">Access Denied</h1>
        <p className="text-sm mt-2">You need admin privileges to access this area.</p>
        <Link href="/" className="mt-4 text-blue-400 hover:underline text-sm">
          Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-slate-800">
          <Shield size={18} className="text-blue-400" />
          <span className="text-sm font-bold text-slate-200">Admin Panel</span>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
