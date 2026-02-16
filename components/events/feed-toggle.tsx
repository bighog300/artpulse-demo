"use client";

type FeedToggleProps = {
  value: "all" | "mine";
  disabledMine?: boolean;
  onChange: (value: "all" | "mine") => void;
};

export function FeedToggle({ value, disabledMine = false, onChange }: FeedToggleProps) {
  return (
    <div className="inline-flex items-center rounded-lg border bg-white p-1" role="tablist" aria-label="Feed mode">
      <button
        type="button"
        role="tab"
        aria-selected={value === "all"}
        onClick={() => onChange("all")}
        className={`rounded-md px-3 py-1.5 text-sm motion-safe:transition-colors motion-safe:duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 ${value === "all" ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-50 hover:shadow-sm"}`}
      >
        All
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "mine"}
        onClick={() => onChange("mine")}
        disabled={disabledMine}
        className={`rounded-md px-3 py-1.5 text-sm motion-safe:transition-colors motion-safe:duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 ${value === "mine" ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-50 hover:shadow-sm"} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        My Feed
      </button>
    </div>
  );
}
