import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import User from '@/server/models/User';
import { authOptions } from './auth';
import { ROLE_PERMISSIONS } from './permissions';

export function hasPermission(role: string, permission: string): boolean {
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.includes(permission);
}

export function withRBAC(permission: string, handler: (req: NextRequest) => Promise<Response>) {
  return async function (req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user: any = await User.findById(session.user.id).lean();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(user.subscriptionTier || 'free', permission)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return handler(req);
  };
}
