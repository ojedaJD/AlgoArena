'use client';
import { useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Tab { id: string; label: string; content: ReactNode; }

export function Tabs({ tabs, defaultTab }: { tabs: Tab[]; defaultTab?: string }) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id || '');
  return (
    <div>
      <div className="flex border-b border-slate-800">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActive(tab.id)} className={cn('px-4 py-2 text-sm font-medium transition-colors', active === tab.id ? 'text-primary-400 border-b-2 border-primary-400' : 'text-slate-400 hover:text-slate-200')}>{tab.label}</button>
        ))}
      </div>
      <div className="pt-4">{tabs.find((t) => t.id === active)?.content}</div>
    </div>
  );
}
