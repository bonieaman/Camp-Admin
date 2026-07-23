"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function AdminError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-ink">Camp data is temporarily unavailable</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
            The admin shell is running, but the database request for this page did not complete. Check the configured
            PostgreSQL database, Neon quota, and Vercel environment variables, then retry.
          </p>
          {error.digest ? <p className="mt-3 text-xs font-bold uppercase text-slate-400">Error digest: {error.digest}</p> : null}
          <button className="btn btn-primary mt-5" onClick={reset}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    </section>
  );
}
