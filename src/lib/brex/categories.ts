interface CategoryRule {
  category: string;
  merchants?: string[];
  mccs?: string[];
}

const RULES: CategoryRule[] = [
  {
    category: "Collabs",
    merchants: ["foodfluence", "sanwan", "whop"],
  },
  {
    category: "Email Infra",
    merchants: [
      "puzzleinbox", "puzzle", "clay labs", "instantly", "gojiberry",
      "goji berry", "zapmail", "fullenrich", "full enrich", "maildoso",
      "mailersend", "reachinbox", "pre-warm", "emailable", "heyreach",
      "sendgrid", "postmark", "resend",
    ],
  },
  {
    category: "AI Tools",
    merchants: [
      "zapier", "openai", "anthropic", "claude", "apify", "clearcue",
    ],
  },
  {
    category: "Lead Sourcing Tools",
    merchants: [
      "outscraper", "serper", "d7leadfind", "openmart", "ocean.io",
      "hunter.io", "prospeo", "crowdreply", "origami",
    ],
  },
  {
    category: "Company Tools",
    merchants: [
      "twilio", "slack", "folk.app", "figma", "asana", "vercel",
      "dropbox", "webflow", "google", "supabase", "crisp", "apple",
      "aircall", "notion", "linear", "github", "1password", "zoom",
      "microsoft", "adobe", "atlassian", "jira", "confluence", "miro",
      "loom", "calendly", "canva", "stripe", "intercom", "hubspot",
      "airtable", "clerk", "auth0", "aws", "amazon web services",
      "cloudflare", "datadog", "sentry", "sqsp", "rewardful",
    ],
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
