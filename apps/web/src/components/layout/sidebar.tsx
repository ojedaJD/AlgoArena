'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ListTree,
  BookOpen,
  Swords,
  Trophy,
  Users,
  ChevronLeft,
  ChevronRight,
  Code2,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────
// Nav Items
// ─────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Main' },
  { href: '/problems', label: 'Problems', icon: ListTree, section: 'Main' },
  { href: '/topics', label: 'Topics', icon: BookOpen, section: 'Main' },
  { href: '/compete', label: 'Compete', icon: Swords, section: 'Play', badge: 'Live' },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy, section: 'Play' },
  { href: '/friends', label: 'Friends', icon: Users, section: 'Social' },
];

const SECTIONS = ['Main', 'Play', 'Social'];

import type React from 'react';

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = useCallback(
    (href: string) => pathname === href || pathname?.startsWith(href + '/'),
    [pathname]
  );

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  return (
    <aside
      className={cn(
        'relative flex flex-col h-full',
        'bg-slate-900 border-r border-slate-800',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-60',
        className
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center h-16 border-b border-slate-800 px-4 shrink-0',
          collapsed ? 'justify-center' : 'gap-2.5'
        )}
      >
        <div className="relative flex items-center justify-center size-9 rounded-xl bg-blue-600 shadow-glow-blue shrink-0">
          <Code2 size={20} className="text-white" />
          <Zap size={10} className="absolute -top-1 -right-1 text-yellow-400 fill-yellow-400" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold gradient-text whitespace-nowrap overflow-hidden">
            AlgoArena
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 no-scrollbar">
        {SECTIONS.map((section) => {
          const items = NAV_ITEMS.filter((item) => item.section === section);
          if (!items.length) return null;

          return (
            <div key={section} className="mb-4">
              {/* Section label */}
              {!collapsed && (
                <p className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                  {section}
                </p>
              )}
              {collapsed && (
                <div className="mx-3 mb-1 h-px bg-slate-800" />
              )}

              {/* Items */}
              {items.map(({ href, label, icon: Icon, badge }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={cn(
                      'relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl',
                      'text-sm font-medium transition-all duration-200 group',
                      active
                        ? 'text-blue-400 bg-blue-500/10'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800',
                      collapsed && 'justify-center'
                    )}
                  >
                    {/* Active indicator */}
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-blue-500" />
                    )}

                    <Icon
                      size={18}
                      className={cn(
                        'shrink-0 transition-transform duration-200',
                        'group-hover:scale-110'
                      )}
                    />

                    {!collapsed && (
                      <>
                        <span className="flex-1 whitespace-nowrap">{label}</span>
                        {badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {badge}
                          </span>
                        )}
                      </>
                    )}

                    {/* Tooltip when collapsed */}
                    {collapsed && (
                      <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-100 whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                        {label}
                        {badge && (
                          <span className="ml-2 text-emerald-400">{badge}</span>
                        )}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="shrink-0 border-t border-slate-800 p-2">
        <button
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex items-center justify-center w-full py-2 px-3 rounded-xl',
            'text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800',
            'transition-all duration-200',
            !collapsed && 'gap-3'
          )}
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
