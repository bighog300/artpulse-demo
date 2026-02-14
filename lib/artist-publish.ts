import { z } from "zod";
import { httpUrlSchema } from "@/lib/validators";

export type ArtistPublishIssue = {
  field: "name" | "bio" | "coverImage" | "websiteUrl";
  message: string;
};

export type ArtistPublishInput = {
  name: string | null;
  bio: string | null;
  websiteUrl: string | null;
  featuredAssetId: string | null;
  featuredImageUrl: string | null;
  images: Array<{ id: string }>;
};

const artistPublishSchema = z.object({
  name: z.string().trim().min(2, "Artist name is required"),
  bio: z.string().trim().min(50, "Artist statement must be at least 50 characters"),
  hasCoverImage: z.boolean().refine((value) => value, "Add a cover image before submitting"),
  websiteUrl: httpUrlSchema.optional().nullable(),
});

export function getArtistPublishIssues(artist: ArtistPublishInput): ArtistPublishIssue[] {
  const hasCoverImage = Boolean(artist.featuredAssetId || artist.featuredImageUrl || artist.images.length > 0);

  const parsed = artistPublishSchema.safeParse({
    name: artist.name ?? "",
    bio: artist.bio ?? "",
    hasCoverImage,
    websiteUrl: artist.websiteUrl,
  });

  if (parsed.success) return [];

  return parsed.error.issues.map((issue) => {
    const path = issue.path[0];
    if (path === "name") return { field: "name", message: issue.message };
    if (path === "bio") return { field: "bio", message: issue.message };
    if (path === "hasCoverImage") return { field: "coverImage", message: issue.message };
    return { field: "websiteUrl", message: issue.message };
  });
}

