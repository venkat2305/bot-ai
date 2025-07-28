export const USER_ROLES = {
  FREE: 'free',
  PRO: 'pro',
} as const;

export const PERMISSIONS = {
  GITHUB_IMPORT: 'github:import',
  PAYMENT_REFUND: 'payment:refund',
} as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [USER_ROLES.FREE]: [],
  [USER_ROLES.PRO]: [
    PERMISSIONS.GITHUB_IMPORT,
    PERMISSIONS.PAYMENT_REFUND,
  ],
};

export function getPermissionsForTier(tier: string): string[] {
  return ROLE_PERMISSIONS[tier] || [];
}
