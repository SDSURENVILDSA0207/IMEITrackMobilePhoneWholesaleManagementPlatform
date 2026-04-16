import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

type SharedProps = {
  hasError?: boolean;
  className?: string;
};

const baseInputClass =
  "mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition duration-150 placeholder:text-slate-400";

const getInputStateClass = (hasError: boolean | undefined) =>
  hasError
    ? "border-danger-600/60 focus:border-danger-600 focus:ring-2 focus:ring-danger-600/15"
    : "border-slate-200 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15 hover:border-slate-300";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & SharedProps>(
  function Input({ hasError, className = "", ...props }, ref) {
    return <input ref={ref} className={[baseInputClass, getInputStateClass(hasError), className].join(" ")} {...props} />;
  },
);

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & SharedProps
>(function TextArea({ hasError, className = "", ...props }, ref) {
  return <textarea ref={ref} className={[baseInputClass, getInputStateClass(hasError), className].join(" ")} {...props} />;
});
