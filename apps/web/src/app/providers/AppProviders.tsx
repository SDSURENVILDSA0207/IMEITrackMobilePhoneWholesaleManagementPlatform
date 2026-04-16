import type { PropsWithChildren } from "react";
import { Provider } from "react-redux";

import { ConfirmProvider } from "@/components/ui/confirm/ConfirmProvider";
import { ToastProvider } from "@/components/ui/toast/ToastProvider";
import { store } from "@/store";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <Provider store={store}>
      <ToastProvider>
        <ConfirmProvider>{children}</ConfirmProvider>
      </ToastProvider>
    </Provider>
  );
}
