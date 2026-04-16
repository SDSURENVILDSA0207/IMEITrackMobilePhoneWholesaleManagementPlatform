import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { loginThunk } from "@/features/auth/authSlice";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/toast/useToast";
import { Button } from "@/components/ui/Button";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/redux";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { isLoading } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState("admin@imeitrack.app");
  const [password, setPassword] = useState("Admin123!");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await dispatch(loginThunk({ email, password }));
    if (loginThunk.fulfilled.match(result)) {
      navigate("/", { replace: true });
    } else if (loginThunk.rejected.match(result)) {
      const msg = typeof result.payload === "string" ? result.payload : "Sign in failed";
      toast.error(msg);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white shadow-lg shadow-brand-600/30 ring-1 ring-white/20">
          IM
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">Sign in to IMEITrack</h1>
        <p className="mt-2 text-sm text-slate-300">Mobile wholesale management platform</p>
      </div>
      <Card className="border-white/15 bg-white/95 p-8 shadow-2xl shadow-black/20 backdrop-blur">
      <form onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
              Email
            </label>
            <Input
              id="email"
              autoComplete="email"
              className="mt-0"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              className="mt-0"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <Button type="submit" disabled={isLoading} fullWidth className="mt-6">
          {isLoading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      </Card>
    </div>
  );
}
