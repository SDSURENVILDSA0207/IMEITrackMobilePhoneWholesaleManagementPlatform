import { Navigate, Outlet } from "react-router-dom";

import { useAppSelector } from "@/shared/hooks/redux";

export function ProtectedRoute() {
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const userLoadState = useAppSelector((s) => s.auth.userLoadState);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (userLoadState === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"
          aria-hidden
        />
        <p className="text-sm text-slate-600">Loading session…</p>
      </div>
    );
  }

  return <Outlet />;
}
