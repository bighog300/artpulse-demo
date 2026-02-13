"use client";

import { useState } from "react";
import { trackEngagement } from "@/lib/engagement-client";

export function FeedbackButtons({ eventId, surface = "SEARCH" }: { eventId: string; surface?: "SEARCH" | "FOLLOWING" }) {
  const [selected, setSelected] = useState<"up" | "down" | null>(null);
  const [showThanks, setShowThanks] = useState(false);

  const onFeedback = (feedback: "up" | "down") => {
    setSelected(feedback);
    setShowThanks(true);
    window.setTimeout(() => setShowThanks(false), 1500);
    trackEngagement({
      surface,
      action: "CLICK",
      targetType: "EVENT",
      targetId: eventId,
      meta: { feedback },
    });
  };

  return (
    <div className="mt-2 flex items-center gap-2 text-xs text-gray-600" aria-label="Recommendation feedback">
      <button
        type="button"
        className={`rounded border px-2 py-1 hover:bg-gray-50 ${selected === "up" ? "bg-gray-100" : ""}`}
        onClick={() => onFeedback("up")}
        aria-pressed={selected === "up"}
      >
        👍 More like this
      </button>
      <button
        type="button"
        className={`rounded border px-2 py-1 hover:bg-gray-50 ${selected === "down" ? "bg-gray-100" : ""}`}
        onClick={() => onFeedback("down")}
        aria-pressed={selected === "down"}
      >
        👎 Less like this
      </button>
      {showThanks ? <span className="text-green-700">Thanks</span> : null}
    </div>
  );
}
