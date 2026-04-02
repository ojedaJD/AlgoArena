import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  className?: string;
  children: ReactNode;
  noPadding?: boolean;
}

export function Card({ className, children, noPadding }: CardProps) {
  return (
    <div className={cn('rounded-xl border border-slate-800 bg-slate-900/50 shadow-lg', !noPadding && 'p-0', className)}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  className?: string;
  children: ReactNode;
  bordered?: boolean;
}

export function CardHeader({ className, children, bordered = true }: CardHeaderProps) {
  return (
    <div className={cn('px-6 py-4', bordered && 'border-b border-slate-800', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <h3 className={cn('text-lg font-semibold text-slate-100', className)}>{children}</h3>;
}

export function CardContent({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('px-6 py-4', className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('px-6 py-4 border-t border-slate-800', className)}>{children}</div>;
}

export function StatCard({
  icon,
  iconBg,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  iconBg?: string;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      {icon && (
        <div className={cn('inline-flex items-center justify-center size-10 rounded-xl mb-3', iconBg)}>
          {icon}
        </div>
      )}
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      <p className="text-xs font-medium text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-slate-600 mt-1">{sub}</p>}
    </div>
  );
}
