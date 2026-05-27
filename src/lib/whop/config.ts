export function getWhopConfig() {
  const apiKey = process.env.WHOP_API_KEY?.trim();
  const companyId = process.env.WHOP_COMPANY_ID?.trim();
  return { apiKey, companyId };
}

export function assertWhopConfig() {
  const { apiKey, companyId } = getWhopConfig();
  if (!apiKey || !companyId) {
    throw new WhopConfigError(
      "Missing WHOP_API_KEY or WHOP_COMPANY_ID in environment variables.",
    );
  }
  return { apiKey, companyId };
}

export class WhopConfigError extends Error {
  readonly code = "CONFIG_MISSING";

  constructor(message: string) {
    super(message);
    this.name = "WhopConfigError";
  }
}
