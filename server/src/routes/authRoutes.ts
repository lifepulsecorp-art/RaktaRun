import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, AuthenticatedRequest, JWT_SECRET } from '../middleware/auth.js';
import { find, insert, update } from '../utils/db.js';
import type { User, Donor, Hospital, UserRole } from '../types.js';
import { isEmailBlocked } from '../utils/accountRestrictions.js';

const router = Router();

// POST /api/auth/login - Local offline authentication
router.post('/login', (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (isEmailBlocked(normalizedEmail)) {
    return res.status(403).json({ error: 'This email address is not permitted to create a LifePulse account.' });
  }
  let user = find<User>('users', (u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return res.status(401).json({ error: 'User not found with this email' });
  }

  // Issue signed local JWT token valid for 7 days
  const token = jwt.sign(
    { uid: user.uid, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  let roleData: any = null;
  if (user.role === 'donor') {
    roleData = find<Donor>('donors', (d) => d.uid === user.uid || d.id === user.donorId) || null;
  } else if (user.role === 'hospital') {
    roleData = find<Hospital>('hospitals', (h) => h.uid === user.uid || h.id === user.hospitalId) || null;
  }

  res.json({
    message: 'Login successful',
    token,
    user,
    profile: roleData,
  });
});

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

// POST /api/auth/sync - Update user details
router.post('/sync', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { name, phone, hospitalId, donorId } = req.body;

  const patch: Partial<User> = {};
  if (name) patch.name = name;
  if (phone) patch.phone = phone;
  if (hospitalId) patch.hospitalId = hospitalId;
  if (donorId) patch.donorId = donorId;

  const updatedUser = update<User>('users', user.uid, patch);

  res.json({
    message: 'Profile synchronized',
    user: updatedUser || user,
  });
});

// POST /api/auth/register - Handles both fresh signup and onboarding role patching
router.post('/register', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // If bearer token provided, authenticate and update role
    return authenticate(req as AuthenticatedRequest, res, () => {
      const user = (req as AuthenticatedRequest).user!;
      const { role, displayName } = req.body;

      const patch: Partial<User> = {};
      if (displayName) patch.name = displayName;
      if (role && ['donor', 'hospital'].includes(role) && user.role !== 'admin') {
        patch.role = role;
      }

      const updatedUser = update<User>('users', user.uid, patch);

      const token = jwt.sign(
        { uid: user.uid, email: user.email, role: patch.role || user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        message: 'User profile updated',
        token,
        user: updatedUser || user,
      });
    });
  }

  // Otherwise, handle fresh unauthenticated registration
  const { email, role, displayName, name } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (isEmailBlocked(normalizedEmail)) {
    return res.status(403).json({ error: 'This email address is not permitted to create a LifePulse account.' });
  }
  let existingUser = find<User>('users', (u) => u.email.toLowerCase() === normalizedEmail);

  if (existingUser) {
    const token = jwt.sign(
      { uid: existingUser.uid, email: existingUser.email, role: existingUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.status(200).json({
      message: 'User already exists',
      token,
      user: existingUser,
    });
  }

  const uid = `user_${uuidv4().slice(0, 8)}`;
  const newUser: User = {
    uid,
    email: normalizedEmail,
    role: (role as UserRole) || 'donor',
    name: displayName || name || normalizedEmail.split('@')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  insert<User>('users', newUser);

  const token = jwt.sign(
    { uid: newUser.uid, email: newUser.email, role: newUser.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: newUser,
  });
});

export default router;
