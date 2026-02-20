"use client";

import { useEffect, useState } from "react";
import { subscribeToasts, type ToastItem } from "@/lib/toast";

export function ToastViewport() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToasts((toast) => {
      setItems((current) => [...current, toast]);
      window.setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== toast.id));
      }, 3000);
    });
    return () => { unsubscribe(); };
  }, []);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-80 flex-col gap-2" role="status" aria-live="polite">
      {items.map((item) => (
        <div key={item.id} className={`rounded border px-3 py-2 shadow ${item.variant === "error" ? "border-red-300 bg-red-50" : "border-emerald-300 bg-emerald-50"}`}>
          <p className="text-sm font-semibold">{item.title}</p>
          {item.message ? <p className="text-xs text-muted-foreground">{item.message}</p> : null}
        </div>
      ))}
    </div>
  );
}
