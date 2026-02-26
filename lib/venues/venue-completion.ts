export type VenueCompletionChecks = {
  basicInfo: boolean;
  location: boolean;
  images: boolean;
  contact: boolean;
  publishReady: boolean;
};

export function getVenueCompletionChecks(venue: {
  name: string | null;
  description: string | null;
  lat: number | null;
  lng: number | null;
  images?: Array<unknown> | null;
  websiteUrl?: string | null;
  instagramUrl?: string | null;
}) : VenueCompletionChecks {
  const basicInfo = Boolean(venue.name?.trim() && venue.description?.trim());
  const location = venue.lat != null && venue.lng != null;
  const images = (venue.images?.length ?? 0) > 0;
  const contact = Boolean(venue.websiteUrl?.trim() || venue.instagramUrl?.trim());

  return {
    basicInfo,
    location,
    images,
    contact,
    publishReady: basicInfo && location && images,
  };
}
