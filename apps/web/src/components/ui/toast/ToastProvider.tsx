import {
  useCallback,
  useId,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { IconTint, type IconTintTone } from "@/components/ui/IconTint";

import { ToastContext, type ToastContextValue, type ToastType } from "./context";

type ToastItem = {
  id: string;
  message: ReactNode;
  type: ToastType;
};

const DURATION_MS = 5200;

function toastTone(type: ToastType): IconTintTone {
  if (type === "success") return "success";
  if (type === "error") return "danger";
  return "info";
}

function ToastIcon({ type }: { type: ToastType }) {
  const tone = toastTone(type);
  if (type === "success") {
    return (
      <IconTint tone={tone} size="sm">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </IconTint>
    );
  }
  if (type === "error") {
    return (
      <IconTint tone={tone} size="sm">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </IconTint>
    );
  }
  return (
    <IconTint tone={tone} size="sm">
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    </IconTint>
  );
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const baseId = useId();

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: ReactNode) => {
      const id = `${baseId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      const timer = setTimeout(() => dismiss(id), DURATION_MS);
      timers.current.set(id, timer);
    },
    [baseId, dismiss],
  );

  const success = useCallback((message: ReactNode) => push("success", message), [push]);
  const error = useCallback((message: ReactNode) => push("error", message), [push]);
  const info = useCallback((message: ReactNode) => push("info", message), [push]);

  const value: ToastContextValue = { success, error, info, dismiss };

  const portal =
    typeof document !== "undefined"
      ? createPortal(
          <div
            className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-end gap-2 p-4 sm:p-6"
            aria-live="polite"
            aria-relevant="additions"
          >
            {toasts.map((t) => (
              <div
                key={t.id}
                role="status"
                className="pointer-events-auto flex max-w-md gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-lg shadow-slate-900/10 ring-1 ring-slate-900/5"
              >
                <ToastIcon type={t.type} />
                <div className="min-w-0 flex-1 pt-0.5 text-sm leading-snug text-slate-800">{t.message}</div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 rounded-lg p-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Dismiss notification"
                >
                  <IconTint tone="muted" size="xs">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </IconTint>
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {portal}
    </ToastContext.Provider>
  );
}
