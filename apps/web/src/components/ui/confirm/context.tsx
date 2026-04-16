import { createContext } from "react";

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
};

export type ConfirmContextValue = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<ConfirmContextValue | null>(null);
