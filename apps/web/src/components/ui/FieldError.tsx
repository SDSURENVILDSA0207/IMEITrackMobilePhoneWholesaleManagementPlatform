import type { ReactNode } from "react";

type FieldErrorProps = {
  children?: ReactNode;
  id?: string;
};

/** Consistent validation message styling for forms. */
export function FieldError({ children, id }: FieldErrorProps) {
  if (children == null || children === "") return null;
  return (
    <p id={id} className="mt-1.5 inline-flex items-start gap-1.5 text-sm font-medium text-red-600" role="alert">
      <span aria-hidden className="mt-[2px] inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
      <span>{children}</span>
    </p>
  );
}
