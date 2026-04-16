import { configureStore } from "@reduxjs/toolkit";

import authReducer, { logout } from "@/features/auth/authSlice";
import { configureApiClient } from "@/shared/api/client";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

configureApiClient({
  getAccessToken: () => store.getState().auth.accessToken,
  onUnauthorized: () => {
    store.dispatch(logout());
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
