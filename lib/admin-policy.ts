export const ADMIN_IMAGE_ALT_REQUIRED = process.env.ADMIN_IMAGE_ALT_REQUIRED === "true";

export function isAdminImageAltRequired() {
  return process.env.ADMIN_IMAGE_ALT_REQUIRED === "true";
}
