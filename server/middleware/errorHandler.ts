import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    res.status(400).json({
      success: false,
      message: messages[0] || 'Validation failed',
      errors: messages,
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
    });
    return;
  }

  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: number }).code === 11000
  ) {
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue || {};
    const field = Object.keys(keyValue)[0] || 'field';
    res.status(409).json({
      success: false,
      message: `Duplicate value for ${field}. Please use a unique identifier.`,
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'Internal server error';
  console.error('[Server Error]', err);
  res.status(500).json({
    success: false,
    message,
  });
}
