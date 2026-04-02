'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (opts: Omit<Toast, 'id'>) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

const DEFAULT_DURATION = 4500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const toast = useCallback(
    (opts: Omit<Toast, 'id'>): string => {
      const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
      const newToast: Toast = { id, duration: DEFAULT_DURATION, ...opts };
      setToasts((prev) => [newToast, ...prev].slice(0, 5)); // max 5 toasts
      return id;
    },
    []
  );

  const success = useCallback(
    (title: string, description?: string) =>
      toast({ title, description, variant: 'success' }),
    [toast]
  );

  const error = useCallback(
    (title: string, description?: string) =>
      toast({ title, description, variant: 'error', duration: 6000 }),
    [toast]
  );

  const warning = useCallback(
    (title: string, description?: string) =>
      toast({ title, description, variant: 'warning' }),
    [toast]
  );

  const info = useCallback(
    (title: string, description?: string) =>
      toast({ title, description, variant: 'info' }),
    [toast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, toast, success, error, warning, info, dismiss, dismissAll }}
    >
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

// ─────────────────────────────────────────────
// Individual Toast Item
// ─────────────────────────────────────────────

const variantConfig: Record<
  ToastVariant,
  { icon: ReactNode; containerClass: string; iconClass: string }
> = {
  success: {
    icon: <CheckCircle2 size={18} />,
    containerClass: 'border-emerald-500/30 bg-emerald-500/10',
    iconClass: 'text-emerald-400',
  },
  error: {
    icon: <AlertCircle size={18} />,
    containerClass: 'border-red-500/30 bg-red-500/10',
    iconClass: 'text-red-400',
  },
  warning: {
    icon: <AlertTriangle size={18} />,
    containerClass: 'border-yellow-500/30 bg-yellow-500/10',
    iconClass: 'text-yellow-400',
  },
  info: {
    icon: <Info size={18} />,
    containerClass: 'border-blue-500/30 bg-blue-500/10',
    iconClass: 'text-blue-400',
  },
};

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { icon, containerClass, iconClass } = variantConfig[t.variant];

  // Animate in
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    if (!t.duration) return;
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(t.id), 300);
    }, t.duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [t.id, t.duration, onDismiss]);

  return (
    <div
      className={cn(
        'pointer-events-auto w-full max-w-sm rounded-xl border p-4',
        'bg-slate-900 shadow-xl shadow-slate-950/50',
        'flex items-start gap-3 backdrop-blur-sm',
        'transition-all duration-300',
        containerClass,
        visible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
      )}
      role="alert"
    >
      {/* Icon */}
      <span className={cn('mt-0.5 shrink-0', iconClass)}>{icon}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-100">{t.title}</p>
        {t.description && (
          <p className="mt-0.5 text-xs text-slate-400">{t.description}</p>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onDismiss(t.id), 300);
        }}
        className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Viewport (renders all toasts)
// ─────────────────────────────────────────────

function ToastViewport() {
  const ctx = useContext(ToastContext);
  if (!ctx) return null;
  const { toasts, dismiss } = ctx;

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}
