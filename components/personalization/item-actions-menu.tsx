"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { track } from "@/lib/analytics/client";
import type { Explanation } from "@/lib/personalization/explanations";
import { recordFeedback } from "@/lib/personalization/feedback";
import { RANKING_VERSION } from "@/lib/personalization/ranking";
import { recordOutcome, type PersonalizationSource } from "@/lib/personalization/measurement";

type MenuType = "event" | "artist" | "venue";

const PERSONALIZED_SOURCES = ["following", "for_you", "recommendations", "digest", "saved_search_preview"];

export function ItemActionsMenu({
  type,
  idOrSlug,
  source,
  tags,
  explanation,
  onHidden,
  measurementSource,
}: {
  type: MenuType;
  idOrSlug: string;
  source: string;
  tags?: string[];
  explanation?: Explanation | null;
  onHidden?: () => void;
  measurementSource?: PersonalizationSource;
}) {
  const [undoAction, setUndoAction] = useState<"hide" | "show_less" | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);

  if (!PERSONALIZED_SOURCES.includes(source)) return null;

  const handleHide = () => {
    recordFeedback({ type: "hide", source, item: { type, idOrSlug, tags } });
    onHidden?.();
    setUndoAction("hide");
    track("personalization_hide_clicked", { source, targetType: type, idOrSlug, version: RANKING_VERSION });
    recordOutcome({ action: "hide", itemType: type, itemKey: `${type}:${idOrSlug}`.toLowerCase(), sourceHint: measurementSource });
  };

  const handleShowLess = () => {
    recordFeedback({ type: "show_less", source, item: { type, idOrSlug, tags } });
    onHidden?.();
    setUndoAction("show_less");
    track("personalization_show_less_clicked", { source, targetType: type, idOrSlug, version: RANKING_VERSION });
    recordOutcome({ action: "show_less", itemType: type, itemKey: `${type}:${idOrSlug}`.toLowerCase(), sourceHint: measurementSource });
  };

  return (
    <div className="space-y-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Recommendation actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {explanation ? <DropdownMenuItem onClick={() => { setWhyOpen(true); track("why_this_opened", { source, kind: explanation.kind }); }}>Why this?</DropdownMenuItem> : null}
          {explanation ? <DropdownMenuSeparator /> : null}
          <DropdownMenuItem onClick={handleHide}>Hide</DropdownMenuItem>
          <DropdownMenuItem onClick={handleShowLess}>Show less like this</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {undoAction ? (
        <p className="text-xs text-muted-foreground">
          Updated preferences.{" "}
          <button
            type="button"
            className="underline"
            onClick={() => {
              setUndoAction(null);
              track("personalization_undo_clicked", { source, targetType: type, idOrSlug, version: RANKING_VERSION });
            }}
          >
            Undo
          </button>
        </p>
      ) : null}
      <Dialog open={whyOpen} onOpenChange={setWhyOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Why you&apos;re seeing this</DialogTitle>
            <DialogDescription>{explanation?.label}</DialogDescription>
          </DialogHeader>
          {explanation?.detail ? <p className="text-sm text-muted-foreground">{explanation.detail}</p> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
