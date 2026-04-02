'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Sun,
  Moon,
  Code2,
  ChevronDown,
  User,
  Settings,
  LogOut,
  LayoutDashboard,
  ListTree,
  Swords,
  Trophy,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/providers/theme-provider';
import { Button } from '@/components/ui/button';

// ─────────────────────────────────────────────
// Nav Links
// ─────────────────────────────────────────────

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/problems', label: 'Problems', icon: ListTree },
  { href: '/compete', label: 'Compete', icon: Swords },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
];

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, displayName, avatarUrl, logout, login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = useCallback(() => {
    setUserMenuOpen(false);
    logout();
  }, [logout]);

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* ── Logo ── */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 group"
            aria-label="AlgoArena home"
          >
            <div className="relative flex items-center justify-center size-9 rounded-xl bg-blue-600 shadow-glow-blue group-hover:shadow-glow-blue transition-all duration-300">
              <Code2 size={20} className="text-white" />
              <Zap
                size={10}
                className="absolute -top-1 -right-1 text-yellow-400 fill-yellow-400"
              />
            </div>
            <span className="text-lg font-bold gradient-text hidden sm:block">
              AlgoArena
            </span>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive(href)
                    ? 'text-blue-400 bg-blue-500/10'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </nav>

          {/* ── Right Actions ── */}
          <div className="flex items-center gap-2">

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className={cn(
                'flex items-center justify-center size-9 rounded-lg transition-all duration-200',
                'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              )}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Auth Section */}
            {!isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => login('/dashboard')}
                >
                  Log in
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => login('/dashboard')}
                >
                  Get Started
                </Button>
              </div>
            ) : (
              /* User Menu */
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className={cn(
                    'flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl transition-all duration-200',
                    'text-slate-300 hover:bg-slate-800',
                    userMenuOpen && 'bg-slate-800'
                  )}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                >
                  {/* Avatar */}
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="size-7 rounded-full object-cover ring-1 ring-slate-700"
                    />
                  ) : (
                    <div className="size-7 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-xs font-bold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown
                    size={14}
                    className={cn(
                      'hidden sm:block transition-transform duration-200',
                      userMenuOpen && 'rotate-180'
                    )}
                  />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div
                    role="menu"
                    className={cn(
                      'absolute right-0 top-full mt-2 w-52',
                      'bg-slate-900 border border-slate-700 rounded-xl shadow-xl shadow-slate-950/50',
                      'animate-slide-down py-1 z-50'
                    )}
                  >
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-slate-800">
                      <p className="text-sm font-medium text-slate-100 truncate">{displayName}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <MenuLink href="/profile" icon={User} onClick={() => setUserMenuOpen(false)}>
                        Profile
                      </MenuLink>
                      <MenuLink href="/settings" icon={Settings} onClick={() => setUserMenuOpen(false)}>
                        Settings
                      </MenuLink>
                    </div>

                    <div className="border-t border-slate-800 py-1">
                      <button
                        role="menuitem"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors duration-150"
                      >
                        <LogOut size={15} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              className="md:hidden flex items-center justify-center size-9 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 animate-slide-down">
          <nav className="px-4 py-3 flex flex-col gap-1" aria-label="Mobile navigation">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive(href)
                    ? 'text-blue-400 bg-blue-500/10'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}

            {!isAuthenticated && (
              <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-slate-800">
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => login('/dashboard')}
                >
                  Log in
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => login('/dashboard')}
                >
                  Get Started
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

// ─────────────────────────────────────────────
// Helper: Menu Link
// ─────────────────────────────────────────────

function MenuLink({
  href,
  icon: Icon,
  onClick,
  children,
}: {
  href: string;
  icon: React.ElementType;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      role="menuitem"
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors duration-150"
    >
      <Icon size={15} className="text-slate-500" />
      {children}
    </Link>
  );
}

import type React from 'react';
