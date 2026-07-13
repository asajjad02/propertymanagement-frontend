'use client';

/**
 * Toast notifications — the transient-feedback primitive the design system calls
 * for (docs/design/patterns/feedback-and-states.md). Carbon-style taxonomy:
 * four statuses (success / info / warning / error), each with a semantic icon and
 * tone. Success/info/warning announce politely (`role="status"`); errors assert
 * (`role="alert"`) per WCAG 4.1.3. Top-right, auto-dismiss, dismissible, stacked,
 * and reduced-motion aware.
 *
 * Usage:
 *   const toast = useToast();
 *   toast.success('Payment recorded');
 *   toast.error('Could not save', 'Check the highlighted fields and try again.');
 */
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

import { cn } from '@/lib/cn';

import type { Tone } from './tones';

type ToastStatus = 'success' | 'info' | 'warning' | 'error';

interface ToastRecord {
  id: number;
  status: ToastStatus;
  title: string;
  description?: string;
  /** ms before auto-dismiss; 0 keeps it until dismissed. */
  duration: number;
}

interface ToastOptions {
  description?: string;
  duration?: number;
}

interface ToastApi {
  show: (status: ToastStatus, title: string, opts?: ToastOptions) => number;
  success: (title: string, description?: string) => number;
  info: (title: string, description?: string) => number;
  warning: (title: string, description?: string) => number;
  error: (title: string, description?: string) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const STATUS_META: Record<
  ToastStatus,
  { tone: Tone; icon: typeof CheckCircle2; iconClass: string; live: 'polite' | 'assertive'; role: 'status' | 'alert' }
> = {
  success: { tone: 'green', icon: CheckCircle2, iconClass: 'text-ok', live: 'polite', role: 'status' },
  info: { tone: 'blue', icon: Info, iconClass: 'text-info', live: 'polite', role: 'status' },
  warning: { tone: 'amber', icon: AlertTriangle, iconClass: 'text-warn', live: 'polite', role: 'status' },
  error: { tone: 'red', icon: XCircle, iconClass: 'text-danger', live: 'assertive', role: 'alert' },
};

const DEFAULT_DURATION: Record<ToastStatus, number> = {
  success: 4000,
  info: 4000,
  warning: 6000,
  error: 8000,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (status: ToastStatus, title: string, opts?: ToastOptions) => {
      const id = nextId.current++;
      const duration = opts?.duration ?? DEFAULT_DURATION[status];
      setToasts((list) => [...list, { id, status, title, description: opts?.description, duration }]);
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        );
      }
      return id;
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (title, description) => show('success', title, { description }),
      info: (title, description) => show('info', title, { description }),
      warning: (title, description) => show('warning', title, { description }),
      error: (title, description) => show('error', title, { description }),
      dismiss,
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/** Access the toast API. Must be inside <ToastProvider>. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>.');
  return ctx;
}

function ToastViewport({ toasts, onDismiss }: { toasts: ToastRecord[]; onDismiss: (id: number) => void }) {
  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
      // The region itself is a landmark for assistive tech; each toast sets its own role.
      aria-live="off"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastRecord; onDismiss: (id: number) => void }) {
  const meta = STATUS_META[toast.status];
  const Icon = meta.icon;
  return (
    <div
      role={meta.role}
      aria-live={meta.live}
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-card border border-hairline bg-surface p-3.5 shadow-pop',
        'motion-safe:animate-[toast-in_150ms_ease-out]',
      )}
    >
      <Icon className={cn('mt-0.5 h-4.5 w-4.5 shrink-0', meta.iconClass)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-xs text-muted">{toast.description}</p>}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="-mr-1 -mt-1 rounded-control p-1 text-muted transition-colors hover:bg-raised hover:text-ink"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
