interface CategoryRule {
  category: string;
  merchants?: string[];
  mccs?: string[];
}

const RULES: CategoryRule[] = [
  {
    category: "Software & SaaS",
    merchants: [
      "vercel", "github", "slack", "notion", "figma", "linear", "google",
      "aws", "amazon web services", "digitalocean", "heroku", "netlify",
      "cloudflare", "datadog", "sentry", "postmark", "sendgrid", "twilio",
      "openai", "anthropic", "stripe", "intercom", "hubspot", "zapier",
      "airtable", "1password", "zoom", "dropbox", "microsoft", "adobe",
      "atlassian", "jira", "confluence", "miro", "loom", "calendly",
      "grammarly", "pitch", "canva", "webflow", "supabase", "planetscale",
      "railway", "render", "fly.io", "resend", "clerk", "auth0",
    ],
    mccs: ["5734", "5817", "5818", "7372"],
  },
  {
    category: "Advertising & Marketing",
    merchants: [
      "meta ads", "facebook", "instagram", "tiktok", "twitter", "x.com",
      "reddit ads", "linkedin", "google ads", "youtube ads", "snap",
      "pinterest", "taboola", "outbrain", "influencer",
    ],
    mccs: ["7311", "7312", "7319"],
  },
  {
    category: "Travel & Transport",
    merchants: [
      "uber", "lyft", "delta", "united", "american airlines", "jetblue",
      "southwest", "airbnb", "hotel", "marriott", "hilton", "hyatt",
      "expedia", "kayak", "ramp travel",
    ],
    mccs: [
      "3000", "3001", "3501", "4111", "4112", "4121", "4131", "4411",
      "4511", "4722", "7011", "7012", "7032", "7033",
    ],
  },
  {
    category: "Food & Meals",
    merchants: [
      "doordash", "uber eats", "grubhub", "seamless", "postmates",
      "caviar", "sweetgreen", "chipotle", "starbucks",
    ],
    mccs: [
      "5411", "5412", "5499", "5812", "5813", "5814",
    ],
  },
  {
    category: "Office & Supplies",
    mccs: ["5111", "5943", "5944", "5945", "5946"],
  },
  {
    category: "Legal & Professional",
    merchants: ["law", "legal", "attorney", "counsel"],
    mccs: ["8111"],
  },
  {
    category: "Payroll & Contractors",
    merchants: ["gusto", "rippling", "deel", "remote.com", "payroll", "adp"],
  },
  {
    category: "Insurance",
    merchants: ["insurance"],
    mccs: ["5960", "6300", "6381", "6399"],
  },
];

export function categorize(
  merchantDescriptor: string | undefined,
  mcc: string | undefined,
): string {
  const desc = (merchantDescriptor ?? "").toLowerCase();
  const code = mcc ?? "";

  for (const rule of RULES) {
    if (rule.merchants?.some((m) => desc.includes(m))) return rule.category;
    if (rule.mccs?.includes(code)) return rule.category;
  }

  return "Other";
}

export function getAllCategories(): string[] {
  return [...RULES.map((r) => r.category), "Other"];
}
