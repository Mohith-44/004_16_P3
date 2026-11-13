import type { Response, NextFunction } from 'express';
import { Department } from '../models/Department.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/errorHandler.ts';

export async function getDepartments(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.status(200).json({
      success: true,
      departments,
    });
  } catch (err) {
    next(err);
  }
}

export async function createDepartment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, code, description, headOfDepartment, contactExtension, zonesSupported } = req.body;
    if (!name || !code) {
      throw new AppError('Department name and code are required.', 400);
    }

    const department = await Department.create({
      name: String(name).trim(),
      code: String(code).toUpperCase().trim(),
      description: description ? String(description).trim() : '',
      headOfDepartment: headOfDepartment ? String(headOfDepartment).trim() : '',
      contactExtension: contactExtension ? String(contactExtension).trim() : '',
      zonesSupported: Array.isArray(zonesSupported) ? zonesSupported : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully.',
      department,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateDepartment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const department = await Department.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!department) {
      throw new AppError('Department not found.', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Department updated successfully.',
      department,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteDepartment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const department = await Department.findByIdAndDelete(id);
    if (!department) {
      throw new AppError('Department not found.', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}
