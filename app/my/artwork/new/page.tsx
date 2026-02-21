"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MyArtworkNewPage() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const response = await fetch("/api/my/artwork", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "Untitled artwork" }),
      });
      if (!mounted) return;
      if (!response.ok) {
        router.replace("/my/artwork");
        return;
      }
      const data = (await response.json()) as { artwork?: { id: string } };
      if (data.artwork?.id) router.replace(`/my/artwork/${data.artwork.id}`);
      else router.replace("/my/artwork");
    })();
    return () => { mounted = false; };
  }, [router]);

  return <main className="p-6 text-sm text-muted-foreground">Creating artwork…</main>;
}
