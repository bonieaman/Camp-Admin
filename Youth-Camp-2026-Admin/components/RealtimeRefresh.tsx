"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function RealtimeRefresh({ interval = 5000 }: { interval?: number }) {
  const router = useRouter();
  useEffect(() => {
    const onRefresh = () => router.refresh();
    window.addEventListener("yc:data-change", onRefresh);
    const id = window.setInterval(() => router.refresh(), interval);
    return () => {
      window.removeEventListener("yc:data-change", onRefresh);
      window.clearInterval(id);
    };
  }, [interval, router]);
  return null;
}
