// src/lib/rbac.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth';
import User from '@/server/models/User';
import { 
  Permission, 
  UserRole, 
  getUserRoleFromSubscriptionTier, 
  roleHasPermission,
  getPermissionsForRole 
} from './permissions';
import dbConnect from './mongodb';

// Enhanced user data interface
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  subscriptionTier: string;
  role: UserRole;
  permissions: Permission[];
}

// Get user with permissions from database
export async function getUserWithPermissions(userId: string): Promise<AuthenticatedUser | null> {
  try {
    await dbConnect();
    
        const user = await User.findById(userId)
      .populate('subscriptionId')
      .lean() as any;

    if (!user) {
      return null;
    }

    const role = getUserRoleFromSubscriptionTier(user.subscriptionTier || 'free');
    const permissions = getPermissionsForRole(role);

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name || '',
      subscriptionTier: user.subscriptionTier || 'free',
      role,
      permissions,
    };
  } catch (error) {
    console.error('Error fetching user with permissions:', error);
    return null;
  }
}

// Check if user has permission
export function hasPermission(userPermissions: Permission[], permission: Permission): boolean {
  return userPermissions.includes(permission);
}

// Check if user has any of the specified permissions
export function hasAnyPermission(userPermissions: Permission[], permissions: Permission[]): boolean {
  return permissions.some(permission => userPermissions.includes(permission));
}

// Check if user has all of the specified permissions
export function hasAllPermissions(userPermissions: Permission[], permissions: Permission[]): boolean {
  return permissions.every(permission => userPermissions.includes(permission));
}

// Type for API route handlers
type ApiHandler = (
  req: NextRequest,
  context?: any,
  user?: AuthenticatedUser
) => Promise<NextResponse>;

// Enhanced withRBAC middleware that handles authentication + authorization
export function withRBAC(requiredPermission: Permission, handler: ApiHandler) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // 1. Get session
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'AUTH_REQUIRED' },
          { status: 401 }
        );
      }

      // 2. Get user with permissions from database
      const user = await getUserWithPermissions(session.user.id);
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 404 }
        );
      }

      // 3. Check if user has required permission
      if (!hasPermission(user.permissions, requiredPermission)) {
        return NextResponse.json(
          { 
            error: 'Insufficient permissions', 
            code: 'PERMISSION_DENIED',
            required: requiredPermission,
            userRole: user.role,
            userPermissions: user.permissions
          },
          { status: 403 }
        );
      }

      // 4. Call the handler with authenticated user
      return handler(req, context, user);
      
    } catch (error) {
      console.error('RBAC middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }
  };
}

// Simple authentication middleware (no permission check)
export function withAuth(handler: ApiHandler) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'AUTH_REQUIRED' },
          { status: 401 }
        );
      }

      const user = await getUserWithPermissions(session.user.id);
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 404 }
        );
      }

      return handler(req, context, user);
      
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }
  };
}

// Utility for checking permissions in components
export function checkPermission(userRole: UserRole, permission: Permission): boolean {
  return roleHasPermission(userRole, permission);
}

// Get permissions for frontend session
export function getSessionPermissions(subscriptionTier: string): Permission[] {
  const role = getUserRoleFromSubscriptionTier(subscriptionTier);
  return getPermissionsForRole(role);
} 