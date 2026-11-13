import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, type IUser, type UserRole } from '../models/User.ts';

export interface AuthRequest extends Request {
  user?: IUser;
}

function getJwtSecret(): string {
  return process.env.JWT_SECRET?.trim() || 'hospital_ward_dispatcher_dev_secret_key';
}

export function signToken(userId: string, role: UserRole): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN?.trim() || '7d') as jwt.SignOptions['expiresIn'];
  return jwt.sign({ id: userId, role }, getJwtSecret(), { expiresIn });
}

export async function protect(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret()) as { id: string; role: UserRole };

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ success: false, message: 'User account no longer exists.' });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
}

export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, getJwtSecret()) as { id: string };
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
      }
    }
  } catch {
    // Ignore invalid optional token
  }
  next();
}

export function authorize(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
      });
      return;
    }

    next();
  };
}
