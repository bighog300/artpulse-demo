function parseCsvEnv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

const ADMIN_EMAIL_SET = new Set(parseCsvEnv(process.env.ADMIN_EMAILS));
const ADMIN_DOMAIN_SET = new Set(parseCsvEnv(process.env.ADMIN_EMAIL_DOMAINS));

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return false;
  if (ADMIN_EMAIL_SET.has(normalizedEmail)) return true;

  const atIndex = normalizedEmail.lastIndexOf("@");
  if (atIndex < 0) return false;
  const domain = normalizedEmail.slice(atIndex + 1);
  if (!domain) return false;
  return ADMIN_DOMAIN_SET.has(domain);
}
