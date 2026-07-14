"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function RealtimeRefresh({ interval = 5000 }: { interval?: number }) {
  const router = useRouter();
  useEffect(() => {
    const channel = "BroadcastChannel" in window ? new BroadcastChannel("yc-admin-data") : null;
    const onRefresh = () => {
      router.refresh();
      channel?.postMessage({ type: "refresh", at: Date.now() });
      try {
        localStorage.setItem("yc-admin-data-refresh", String(Date.now()));
      } catch {
        // Ignore private-mode storage restrictions.
      }
    };
    const onRemoteRefresh = () => router.refresh();
    const onStorage = (event: StorageEvent) => {
      if (event.key === "yc-admin-data-refresh") router.refresh();
    };
    const onFocus = () => router.refresh();
    window.addEventListener("yc:data-change", onRefresh);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    channel?.addEventListener("message", onRemoteRefresh);
    const id = window.setInterval(() => router.refresh(), interval);
    return () => {
      window.removeEventListener("yc:data-change", onRefresh);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      channel?.removeEventListener("message", onRemoteRefresh);
      channel?.close();
      window.clearInterval(id);
    };
  }, [interval, router]);
  return null;
}
