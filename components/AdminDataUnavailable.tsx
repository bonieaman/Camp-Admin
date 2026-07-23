import { AlertTriangle } from "lucide-react";

export function AdminDataUnavailable({ title = "Camp data is temporarily unavailable" }: { title?: string }) {
  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-ink">{title}</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
            The admin website is running, but the database request for this page could not be completed. Verify the
            PostgreSQL connection string in Vercel and restore the Neon database quota or connection, then reload this page.
          </p>
        </div>
      </div>
    </section>
  );
}
