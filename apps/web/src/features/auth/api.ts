import api from "@/shared/api/client";
import { extractApiErrorMessage } from "@/shared/lib/apiError";

import type { LoginRequest, TokenResponse, User } from "./types";

export async function loginRequest(payload: LoginRequest): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>("/auth/login", payload);
  return data;
}

/** Current user; requires Bearer token (from Redux store via interceptor). */
export async function fetchCurrentUser(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

/** @deprecated Use extractApiErrorMessage from @/shared/lib/apiError */
export const getRequestErrorMessage = extractApiErrorMessage;

export const authApi = {
  login: loginRequest,
  fetchCurrentUser,
};
