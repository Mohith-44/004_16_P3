import type { Response, NextFunction } from 'express';
import { User, type IUser, type UserRole } from '../models/User.ts';
import { Handler } from '../models/Handler.ts';
import { Department } from '../models/Department.ts';
import { signToken, type AuthRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/errorHandler.ts';

function sanitizeUser(user: IUser) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    ward: user.ward,
    phone: user.phone,
    preferences: user.preferences,
    createdAt: user.createdAt,
  };
}

export async function register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password, role, department, ward, phone } = req.body;

    if (!name || !email || !password) {
      throw new AppError('Name, email address, and password are required.', 400);
    }
    if (String(password).length < 6) {
      throw new AppError('Password must be at least 6 characters long.', 400);
    }

    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    const allowedRoles: UserRole[] = ['Admin', 'Nurse / Reporter', 'Handler', 'Routing Manager'];
    const selectedRole: UserRole = allowedRoles.includes(role) ? role : 'Nurse / Reporter';

    const user = await User.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      password: String(password),
      role: selectedRole,
      department: department ? String(department).trim() : 'General Nursing',
      ward: ward ? String(ward).trim() : 'Ward 1A',
      phone: phone ? String(phone).trim() : '',
    });

    let handlerProfile = null;
    if (selectedRole === 'Handler') {
      const dept = await Department.findOne({ name: user.department });
      handlerProfile = await Handler.create({
        user: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        department: user.department || 'Nursing Supervisor',
        departmentRef: dept?._id,
        availability: 'Available',
        currentWorkload: 0,
        maxCapacity: 6,
      });
    }

    const token = signToken(String(user._id), user.role);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: sanitizeUser(user),
      handlerProfile,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Please provide both email address and password.', 400);
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
    if (!user) {
      throw new AppError('Invalid email address or password.', 401);
    }

    const isMatch = await user.comparePassword(String(password));
    if (!isMatch) {
      throw new AppError('Invalid email address or password.', 401);
    }

    const handlerProfile = await Handler.findOne({
      $or: [{ user: user._id }, { email: user.email }],
    });

    const token = signToken(String(user._id), user.role);

    res.status(200).json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user: sanitizeUser(user),
      handlerProfile,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated.', 401);
    }

    const handlerProfile = await Handler.findOne({
      $or: [{ user: req.user._id }, { email: req.user.email }],
    });

    res.status(200).json({
      success: true,
      user: sanitizeUser(req.user),
      handlerProfile,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated.', 401);
    }

    const { name, department, ward, phone, preferences } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new AppError('User account not found.', 404);
    }

    if (name !== undefined && String(name).trim().length >= 2) {
      user.name = String(name).trim();
    }
    if (department !== undefined) {
      user.department = String(department).trim();
    }
    if (ward !== undefined) {
      user.ward = String(ward).trim();
    }
    if (phone !== undefined) {
      user.phone = String(phone).trim();
    }
    if (preferences && typeof preferences === 'object') {
      user.preferences = {
        emailNotifications:
          preferences.emailNotifications !== undefined
            ? Boolean(preferences.emailNotifications)
            : user.preferences.emailNotifications,
        criticalAlertsOnly:
          preferences.criticalAlertsOnly !== undefined
            ? Boolean(preferences.criticalAlertsOnly)
            : user.preferences.criticalAlertsOnly,
        compactTables:
          preferences.compactTables !== undefined
            ? Boolean(preferences.compactTables)
            : user.preferences.compactTables,
        defaultZone:
          preferences.defaultZone !== undefined
            ? String(preferences.defaultZone)
            : user.preferences.defaultZone,
      };
    }

    await user.save();

    // Sync name/phone/department to linked handler profile if present
    await Handler.findOneAndUpdate(
      { $or: [{ user: user._id }, { email: user.email }] },
      { name: user.name, phone: user.phone, department: user.department }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated.', 401);
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required.', 400);
    }
    if (String(newPassword).length < 6) {
      throw new AppError('New password must be at least 6 characters long.', 400);
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      throw new AppError('User account not found.', 404);
    }

    const isMatch = await user.comparePassword(String(currentPassword));
    if (!isMatch) {
      throw new AppError('Current password is incorrect.', 401);
    }

    user.password = String(newPassword);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (err) {
    next(err);
  }
}
