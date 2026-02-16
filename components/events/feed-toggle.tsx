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
        className={`rounded-md px-3 py-1.5 text-sm ${value === "all" ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"}`}
      >
        All
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "mine"}
        onClick={() => onChange("mine")}
        disabled={disabledMine}
        className={`rounded-md px-3 py-1.5 text-sm ${value === "mine" ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        My Feed
      </button>
    </div>
  );
}
