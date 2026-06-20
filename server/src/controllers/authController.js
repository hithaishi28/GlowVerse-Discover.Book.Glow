import bcrypt from 'bcryptjs';
import { body } from 'express-validator';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/errors.js';
import { signToken } from '../services/tokenService.js';

export const registerRules = [
  body('name').trim().isLength({ min: 2 }),
  body('age').optional({ values: 'falsy' }).isInt({ min: 13, max: 100 }),
  body('gender').optional({ values: 'falsy' }).isIn(['female', 'male', 'other', 'prefer_not_to_say']),
  body('role').optional().isIn(['user', 'owner']),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 })
];

export const loginRules = [body('email').isEmail().normalizeEmail(), body('password').notEmpty()];

function authPayload(user) {
  return {
    token: signToken(user),
    user: {
      id: user._id,
      name: user.name,
      age: user.age,
      email: user.email,
      gender: user.gender,
      role: user.role,
      membershipTier: user.membershipTier,
      rewardsPoints: user.rewardsPoints
    }
  };
}

export const register = asyncHandler(async (req, res) => {
  const existing = await User.findOne({ email: req.body.email });
  if (existing) throw new ApiError(409, 'Email is already registered');
  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const user = await User.create({
    name: req.body.name,
    age: req.body.age ? Number(req.body.age) : undefined,
    email: req.body.email,
    gender: req.body.gender || undefined,
    role: ['user', 'owner'].includes(req.body.role) ? req.body.role : 'user',
    passwordHash
  });
  res.status(201).json(authPayload(user));
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user?.passwordHash) throw new ApiError(401, 'Invalid email or password');
  const isValid = await bcrypt.compare(req.body.password, user.passwordHash);
  if (!isValid) throw new ApiError(401, 'Invalid email or password');
  res.json(authPayload(user));
});

export const googleOAuth = asyncHandler(async (req, res) => {
  const { email, name, googleId, avatar } = req.body;
  if (!email || !googleId) throw new ApiError(422, 'Google profile is required');
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { name, googleId, avatar }, $setOnInsert: { email } },
    { new: true, upsert: true }
  );
  res.json(authPayload(user));
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
