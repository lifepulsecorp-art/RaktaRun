import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { find, update } from '../utils/db.js';
import type { User, Donor, Hospital } from '../types.js';

const router = Router();

// GET /api/auth/me - Return authenticated user profile and related role record
router.get('/me', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  let roleData: any = null;

  if (user.role === 'donor') {
    roleData = find<Donor>('donors', (d) => d.uid === user.uid || d.id === user.donorId) || null;
  } else if (user.role === 'hospital') {
    roleData = find<Hospital>('hospitals', (h) => h.uid === user.uid || h.id === user.hospitalId) || null;
  }

  res.json({
    user,
    profile: roleData,
  });
});

// POST /api/auth/sync - Update user details or assign role
router.post('/sync', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { name, phone, role, hospitalId, donorId } = req.body;

  const patch: Partial<User> = {};
  if (name) patch.name = name;
  if (phone) patch.phone = phone;
  // If user is not yet an admin, allow setting role (for onboarding demo)
  if (role && user.role !== 'admin') {
    patch.role = role;
  }
  if (hospitalId) patch.hospitalId = hospitalId;
  if (donorId) patch.donorId = donorId;

  const updatedUser = update<User>('users', user.uid, patch);

  res.json({
    message: 'Profile synchronized',
    user: updatedUser || user,
  });
});

// POST /api/auth/register - Register user role and name during onboarding
router.post('/register', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { role, displayName } = req.body;

  const patch: Partial<User> = {};
  if (displayName) patch.name = displayName;
  if (role && ['donor', 'hospital'].includes(role) && user.role !== 'admin') {
    patch.role = role;
  }

  const updatedUser = update<User>('users', user.uid, patch);

  res.status(201).json({
    message: 'User registered successfully',
    user: updatedUser || user,
  });
});

export default router;

