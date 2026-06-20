import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/errors.js';
import { User } from '../models/User.js';

export async function requireAuth(req, _res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new ApiError(401, 'Authentication required');
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.id).select('-passwordHash');
    if (!user) throw new ApiError(401, 'Invalid session');
    req.user = user;
    next();
  } catch (error) {
    next(error.statusCode ? error : new ApiError(401, 'Invalid or expired token'));
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user?.role)) {
      next(new ApiError(403, 'You do not have access to this resource'));
      return;
    }
    next();
  };
}
