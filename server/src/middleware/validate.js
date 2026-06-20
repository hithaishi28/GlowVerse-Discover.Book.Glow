import { validationResult } from 'express-validator';
import { ApiError } from '../utils/errors.js';

export function validate(req, _res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    next(new ApiError(422, 'Validation failed', result.array()));
    return;
  }
  next();
}
