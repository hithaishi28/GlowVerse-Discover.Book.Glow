export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
}

export function errorHandler(err, _req, res, _next) {
  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Something went wrong',
    details: err.details || undefined,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
}
