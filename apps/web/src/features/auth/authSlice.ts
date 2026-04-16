import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { fetchCurrentUser, getRequestErrorMessage, loginRequest } from "./api";
import type { LoginRequest, TokenResponse, User } from "./types";
import { AUTH_STORAGE_KEY } from "./types";

export type UserLoadState = "idle" | "loading" | "loaded";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  userLoadState: UserLoadState;
  isLoading: boolean;
  error: string | null;
};

function readStoredTokens(): Pick<AuthState, "accessToken" | "refreshToken"> {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { accessToken: null, refreshToken: null };
    const parsed = JSON.parse(raw) as TokenResponse;
    return {
      accessToken: parsed.access_token ?? null,
      refreshToken: parsed.refresh_token ?? null,
    };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
}

const stored = readStoredTokens();

const initialState: AuthState = {
  accessToken: stored.accessToken,
  refreshToken: stored.refreshToken,
  user: null,
  userLoadState: stored.accessToken ? "loading" : "idle",
  isLoading: false,
  error: null,
};

export const loginThunk = createAsyncThunk<
  { user: User },
  LoginRequest,
  { rejectValue: string }
>("auth/login", async (payload, { dispatch, rejectWithValue }) => {
  try {
    const tokens = await loginRequest(payload);
    dispatch(setTokens(tokens));
    const user = await fetchCurrentUser();
    return { user };
  } catch (error) {
    return rejectWithValue(getRequestErrorMessage(error, "Login failed"));
  }
});

export const bootstrapAuthThunk = createAsyncThunk<User | null, void>(
  "auth/bootstrap",
  async (_, { dispatch, getState }) => {
    const token = (getState() as { auth: AuthState }).auth.accessToken;
    if (!token) return null;
    try {
      return await fetchCurrentUser();
    } catch {
      dispatch(logout());
      throw new Error("Session expired");
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setTokens: (state, action: { payload: TokenResponse }) => {
      state.accessToken = action.payload.access_token;
      state.refreshToken = action.payload.refresh_token ?? null;
      state.error = null;
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(action.payload));
      } catch {
        /* ignore quota */
      }
    },
    logout: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.userLoadState = "idle";
      state.error = null;
      state.isLoading = false;
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.userLoadState = "loaded";
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Login failed";
      })
      .addCase(bootstrapAuthThunk.pending, (state) => {
        if (state.accessToken) {
          state.userLoadState = "loading";
        }
      })
      .addCase(bootstrapAuthThunk.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
          state.userLoadState = "loaded";
        } else {
          state.userLoadState = "idle";
        }
      })
      .addCase(bootstrapAuthThunk.rejected, (state) => {
        state.user = null;
        state.userLoadState = "idle";
      });
  },
});

export const { setTokens, logout } = authSlice.actions;
export default authSlice.reducer;
