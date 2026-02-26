import Link from "next/link";
import VenueSubmitButton from "@/app/my/_components/VenueSubmitButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SubmissionStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | null;

type Checks = {
  basicInfo: boolean;
  location: boolean;
  images: boolean;
  contact: boolean;
  publishReady: boolean;
};

export default function VenuePublishPanel({
  venue,
  checks,
  submissionStatus,
  isOwner,
}: {
  venue: { id: string; slug: string; isPublished: boolean };
  checks: Checks;
  submissionStatus: SubmissionStatus;
  isOwner: boolean;
}) {
  const showAwaitingReview = submissionStatus === "SUBMITTED";
  const showPublished = venue.isPublished || submissionStatus === "APPROVED";

  return (
    <Card id="publish-panel" className="lg:sticky lg:top-4">
      <CardHeader>
        <CardTitle className="text-lg">Publish venue</CardTitle>
        <CardDescription>Complete required items before submitting for review.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm">
          <li className="flex items-center justify-between"><span>Basic info</span><span>{checks.basicInfo ? "✓" : "✕"}</span></li>
          <li className="flex items-center justify-between"><span>Location</span><span>{checks.location ? "✓" : "✕"}</span></li>
          <li className="flex items-center justify-between"><span>Images</span><span>{checks.images ? "✓" : "✕"}</span></li>
          <li className="flex items-center justify-between"><span>Contact/Details</span><span>{checks.contact ? "✓" : "○"}</span></li>
        </ul>

        {showPublished ? (
          <div className="space-y-1 text-sm">
            <p className="font-medium text-emerald-700">Published</p>
            <Link className="underline" href={`/venues/${venue.slug}`}>View public page</Link>
          </div>
        ) : showAwaitingReview ? (
          <p className="text-sm font-medium text-muted-foreground">Awaiting review</p>
        ) : (
          <VenueSubmitButton
            venueId={venue.id}
            isReady={checks.publishReady && isOwner}
            blocking={[
              !checks.basicInfo ? { id: "name_description", label: "Add basic info" } : null,
              !checks.location ? { id: "location", label: "Add location coordinates" } : null,
              !checks.images ? { id: "images", label: "Add at least one image" } : null,
            ].filter((item): item is { id: string; label: string } => Boolean(item))}
            initialStatus={submissionStatus}
          />
        )}
      </CardContent>
    </Card>
  );
}
