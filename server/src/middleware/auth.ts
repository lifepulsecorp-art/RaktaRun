import { Request, Response, NextFunction } from 'express';
import admin from '../utils/firebaseAdmin.js';
import { find, insert } from '../utils/db.js';
import type { User, UserRole } from '../types.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    let user = find<User>('users', (u) => u.uid === decoded.uid);

    if (!user) {
      // First-time user: check if it's the known admin UID or default to donor
      const role: UserRole = decoded.uid === '5G6ajWegMiepIzvIyreG7bx82SG2' ? 'admin' : 'donor';
      user = {
        uid: decoded.uid,
        email: decoded.email || '',
        name: decoded.name || decoded.email?.split('@')[0] || 'LifePulse User',
        role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      insert<User>('users', user);
    }

    req.user = user;
    next();
  } catch (error: any) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

export function authorizeRoles(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Requires one of [${roles.join(', ')}] role`,
        currentRole: req.user.role,
      });
    }
    next();
  };
}

