'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

interface DialogContextValue {
  onClose: () => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('Dialog sub-components must be used inside <Dialog>');
  return ctx;
}

// ─────────────────────────────────────────────
// Dialog Root
// ─────────────────────────────────────────────

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Close dialog when clicking overlay */
  closeOnOverlay?: boolean;
  /** Close dialog on Escape key */
  closeOnEscape?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
};

export function Dialog({
  open,
  onClose,
  children,
  closeOnOverlay = true,
  closeOnEscape = true,
  size = 'md',
}: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Handle Escape key
  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, closeOnEscape, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleOverlayClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (closeOnOverlay && e.target === overlayRef.current) {
        onClose();
      }
    },
    [closeOnOverlay, onClose]
  );

  if (!open) return null;

  return (
    <DialogContext.Provider value={{ onClose }}>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center p-4',
          'bg-slate-950/80 backdrop-blur-sm',
          'animate-fade-in'
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Panel */}
        <div
          className={cn(
            'relative w-full bg-slate-900 rounded-xl border border-slate-700',
            'shadow-2xl shadow-slate-950/50',
            'animate-slide-up',
            sizeClasses[size]
          )}
          onClick={(e: MouseEvent) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </DialogContext.Provider>
  );
}

// ─────────────────────────────────────────────
// Dialog Header
// ─────────────────────────────────────────────

interface DialogHeaderProps {
  children: ReactNode;
  className?: string;
  /** Show close (X) button */
  showClose?: boolean;
}

export function DialogHeader({ children, className, showClose = true }: DialogHeaderProps) {
  const { onClose } = useDialogContext();
  return (
    <div
      className={cn(
        'flex items-start justify-between p-6 pb-4 border-b border-slate-800',
        className
      )}
    >
      <div className="flex-1">{children}</div>
      {showClose && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Close dialog"
          className="ml-2 -mt-1 -mr-1 text-slate-500 hover:text-slate-300 px-2"
        >
          <X size={18} />
        </Button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Dialog Title
// ─────────────────────────────────────────────

interface DialogTitleProps {
  children: ReactNode;
  className?: string;
}

export function DialogTitle({ children, className }: DialogTitleProps) {
  return (
    <h2 className={cn('text-lg font-semibold text-slate-100', className)}>
      {children}
    </h2>
  );
}

// ─────────────────────────────────────────────
// Dialog Description
// ─────────────────────────────────────────────

export function DialogDescription({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('mt-1 text-sm text-slate-400', className)}>{children}</p>
  );
}

// ─────────────────────────────────────────────
// Dialog Body
// ─────────────────────────────────────────────

export function DialogBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4', className)}>{children}</div>
  );
}

// ─────────────────────────────────────────────
// Dialog Footer
// ─────────────────────────────────────────────

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800',
        className
      )}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// Confirm Dialog (convenience)
// ─────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} size="sm">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
