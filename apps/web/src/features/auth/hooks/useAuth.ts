import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { logout } from "@/features/auth/authSlice";
import type { User } from "@/features/auth/types";
import { roleLabel } from "@/features/auth/types";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/redux";

export function useAuth() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { accessToken, user, userLoadState, isLoading, error } = useAppSelector((s) => s.auth);

  const signOut = useCallback(() => {
    dispatch(logout());
    navigate("/login", { replace: true });
  }, [dispatch, navigate]);

  const isAuthenticated = Boolean(accessToken);
  const isSessionReady = Boolean(accessToken && userLoadState === "loaded" && user);
  const isBootstrapping = Boolean(accessToken && userLoadState === "loading");

  return {
    accessToken,
    user: user as User | null,
    userLoadState,
    isLoading,
    error,
    isAuthenticated,
    isSessionReady,
    isBootstrapping,
    roleLabel: user ? roleLabel(user.role) : null,
    signOut,
  };
}
