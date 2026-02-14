export function resolveVenueGalleryAltText(params: {
  imageAlt?: string | null;
  assetAlt?: string | null;
  venueName: string;
}) {
  return params.imageAlt ?? params.assetAlt ?? `${params.venueName} image`;
}
