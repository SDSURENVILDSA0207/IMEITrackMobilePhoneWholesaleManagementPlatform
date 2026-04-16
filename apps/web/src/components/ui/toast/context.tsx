import { createContext, type ReactNode } from "react";

export type ToastType = "success" | "error" | "info";

export type ToastContextValue = {
  success: (message: ReactNode) => void;
  error: (message: ReactNode) => void;
  info: (message: ReactNode) => void;
  dismiss: (id: string) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);
