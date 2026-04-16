import { useEffect, useRef } from "react";

import { bootstrapAuthThunk } from "@/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/redux";

/** Fetches `/auth/me` when a JWT is restored from storage (not after login — session already hydrated). */
export function AuthBootstrap() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const user = useAppSelector((s) => s.auth.user);
  const userLoadState = useAppSelector((s) => s.auth.userLoadState);
  const ran = useRef(false);

  useEffect(() => {
    if (!accessToken) {
      ran.current = false;
      return;
    }
    if (userLoadState === "loaded" && user) {
      return;
    }
    if (ran.current) return;
    ran.current = true;
    void dispatch(bootstrapAuthThunk());
  }, [dispatch, accessToken, userLoadState, user]);

  return null;
}
