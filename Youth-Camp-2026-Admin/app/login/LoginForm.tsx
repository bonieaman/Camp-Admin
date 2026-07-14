"use client";

import { Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { useActionState, useState } from "react";
import { loginAction } from "./actions";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState(loginAction, { error: "" });

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-bold text-white/90" htmlFor="directorId">
          Director ID
        </label>
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />
          <input
            id="directorId"
            name="directorId"
            className="w-full rounded-2xl border border-white/30 bg-white/16 py-4 pl-12 pr-4 text-white outline-none placeholder:text-white/58 focus:border-white/75 focus:bg-white/22"
            placeholder="YC-2026-000"
            autoComplete="username"
            required
          />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-bold text-white/90" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            className="w-full rounded-2xl border border-white/30 bg-white/16 py-4 pl-12 pr-12 text-white outline-none placeholder:text-white/58 focus:border-white/75 focus:bg-white/22"
            placeholder="Enter password"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/75 hover:text-white"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {state.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{state.error}</p>
      ) : null}
      <button className="btn btn-primary w-full py-4 text-sm tracking-[0.18em]" disabled={pending}>
        {pending ? "SIGNING IN..." : "LOGIN"}
      </button>
    </form>
  );
}
