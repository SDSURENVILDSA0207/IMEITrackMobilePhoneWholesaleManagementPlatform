import type { PropsWithChildren } from "react";

type ModalProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  className?: string;
}>;

export function Modal({ open, onClose, className = "", children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] transition-opacity duration-150"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className={[
          "relative w-full max-w-md rounded-2xl border border-slate-200 bg-surface p-6 shadow-raised",
          "animate-[modal-in_160ms_ease-out]",
          className,
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
