// src/lib/permissions.ts
export const USER_ROLES = {
  FREE: 'free',
  PRO: 'pro',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const PERMISSIONS = {
  // GitHub features
  GITHUB_IMPORT: 'github:import',
  
  // Chat features
  UNLIMITED_CHATS: 'chats:unlimited',
  
  // Payment features
  PAYMENT_REFUND: 'payment:refund',
  PAYMENT_HISTORY: 'payment:history',
  
  // Subscription features
  SUBSCRIPTION_CANCEL: 'subscription:cancel',
  SUBSCRIPTION_STATUS: 'subscription:status',
  
  // Support features
  PRIORITY_SUPPORT: 'support:priority',
  
  // Export features
  EXPORT_CONVERSATIONS: 'export:conversations',
  
  // AI Model features
  PRIORITY_AI_MODELS: 'ai:priority_models',
  ADVANCED_CODE_ANALYSIS: 'ai:advanced_analysis',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Define which permissions each role has
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [USER_ROLES.FREE]: [
    // Free users have basic subscription status access
    PERMISSIONS.SUBSCRIPTION_STATUS,
  ],
  [USER_ROLES.PRO]: [
    // Pro users get all permissions
    PERMISSIONS.GITHUB_IMPORT,
    PERMISSIONS.UNLIMITED_CHATS,
    PERMISSIONS.PAYMENT_REFUND,
    PERMISSIONS.PAYMENT_HISTORY,
    PERMISSIONS.SUBSCRIPTION_CANCEL,
    PERMISSIONS.SUBSCRIPTION_STATUS,
    PERMISSIONS.PRIORITY_SUPPORT,
    PERMISSIONS.EXPORT_CONVERSATIONS,
    PERMISSIONS.PRIORITY_AI_MODELS,
    PERMISSIONS.ADVANCED_CODE_ANALYSIS,
  ],
};

// Helper function to get permissions for a role
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[USER_ROLES.FREE];
}

// Helper function to check if a role has a specific permission
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  const rolePermissions = getPermissionsForRole(role);
  return rolePermissions.includes(permission);
}

// Helper function to check if a permission requires Pro subscription
export function requiresProSubscription(permission: Permission): boolean {
  const freePermissions = ROLE_PERMISSIONS[USER_ROLES.FREE];
  return !freePermissions.includes(permission);
}

// Get user role from subscription tier
export function getUserRoleFromSubscriptionTier(subscriptionTier: string): UserRole {
  switch (subscriptionTier) {
    case 'pro':
      return USER_ROLES.PRO;
    case 'free':
    default:
      return USER_ROLES.FREE;
  }
} 