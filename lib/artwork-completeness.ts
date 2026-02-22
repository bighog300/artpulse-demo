export type ArtworkCompletenessIssueCode =
  | "MISSING_TITLE"
  | "MISSING_IMAGE"
  | "MISSING_DESCRIPTION"
  | "MISSING_MEDIUM"
  | "MISSING_YEAR";

export type ArtworkCompletenessIssue = {
  code: ArtworkCompletenessIssueCode;
  label: string;
  field: "title" | "images" | "description" | "medium" | "year";
  hrefFragment?: "title" | "images" | "description";
};

export type ArtworkCompletenessInput = {
  title: string | null;
  description: string | null;
  medium: string | null;
  year: number | null;
  featuredAssetId: string | null;
};

export type ArtworkCompletenessResult = {
  scorePct: number;
  required: { ok: boolean; issues: ArtworkCompletenessIssue[] };
  recommended: { ok: boolean; issues: ArtworkCompletenessIssue[] };
};

export function computeArtworkCompleteness(artwork: ArtworkCompletenessInput, imageCount: number): ArtworkCompletenessResult {
  const requiredIssues: ArtworkCompletenessIssue[] = [];
  const recommendedIssues: ArtworkCompletenessIssue[] = [];

  if ((artwork.title ?? "").trim().length < 2) {
    requiredIssues.push({
      code: "MISSING_TITLE",
      label: "Add a title (at least 2 characters).",
      field: "title",
      hrefFragment: "title",
    });
  }

  const hasImage = Boolean(artwork.featuredAssetId) || imageCount > 0;
  if (!hasImage) {
    requiredIssues.push({
      code: "MISSING_IMAGE",
      label: "Add at least one image.",
      field: "images",
      hrefFragment: "images",
    });
  }

  if ((artwork.description ?? "").trim().length < 20) {
    recommendedIssues.push({
      code: "MISSING_DESCRIPTION",
      label: "Add a description (20+ characters recommended).",
      field: "description",
      hrefFragment: "description",
    });
  }

  if (!(artwork.medium ?? "").trim()) {
    recommendedIssues.push({
      code: "MISSING_MEDIUM",
      label: "Add a medium.",
      field: "medium",
    });
  }

  if (!artwork.year) {
    recommendedIssues.push({
      code: "MISSING_YEAR",
      label: "Add a year.",
      field: "year",
    });
  }

  const checksTotal = 5;
  const checksPassed = checksTotal - requiredIssues.length - recommendedIssues.length;

  return {
    scorePct: Math.round((checksPassed / checksTotal) * 100),
    required: { ok: requiredIssues.length === 0, issues: requiredIssues },
    recommended: { ok: recommendedIssues.length === 0, issues: recommendedIssues },
  };
}
