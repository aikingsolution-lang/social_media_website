export const ALLOWED_PLATFORMS = [
  "linkedin",
  "instagram",
  "facebook",
  "twitter",
  "threads",
  "youtube",
] as const;

export type PlatformName = (typeof ALLOWED_PLATFORMS)[number];

export const MAX_ACCOUNTS_PER_PLATFORM = 10;

export function normalizePlatform(platform: string) {
  return platform.trim().toLowerCase();
}

export function isAllowedPlatform(platform: string) {
  return ALLOWED_PLATFORMS.includes(platform as PlatformName);
}