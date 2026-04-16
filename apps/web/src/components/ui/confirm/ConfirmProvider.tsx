import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmContext, type ConfirmContextValue, type ConfirmOptions } from "./context";

export type { ConfirmOptions } from "./context";

export function ConfirmProvider({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((v: boolean) => void) | null>(null);

  const finish = useCallback((value: boolean) => {
    setOpen(false);
    setOptions(null);
    resolveRef.current?.(value);
    resolveRef.current = null;
  }, []);

  const confirm = useCallback<ConfirmContextValue>((opts) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setOptions(opts);
      setOpen(true);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, finish]);

  const variant = options?.variant ?? "default";
  const confirmLabel = options?.confirmLabel ?? "Confirm";
  const cancelLabel = options?.cancelLabel ?? "Cancel";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {open && options ? (
        <Modal open={open} onClose={() => finish(false)}>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{options.title}</h2>
            {options.message ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{options.message}</p> : null}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => finish(false)}>
                {cancelLabel}
              </Button>
              <Button type="button" variant={variant === "danger" ? "danger" : "primary"} onClick={() => finish(true)}>
                {confirmLabel}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </ConfirmContext.Provider>
  );
}
