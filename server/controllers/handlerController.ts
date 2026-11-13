import type { Response, NextFunction } from 'express';
import { Handler } from '../models/Handler.ts';
import { Department } from '../models/Department.ts';
import { Report } from '../models/Report.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/errorHandler.ts';

export async function getHandlers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { department, availability } = req.query;
    const filter: Record<string, unknown> = {};
    if (department && department !== 'All') filter.department = department;
    if (availability && availability !== 'All') filter.availability = availability;

    const handlers = await Handler.find(filter)
      .populate('departmentRef', 'name code')
      .sort({ department: 1, name: 1 });

    // Compute live active report counts per handler
    const activeCounts = await Report.aggregate([
      { $match: { status: { $in: ['Assigned', 'In Progress'] }, assignedHandler: { $ne: null } } },
      { $group: { _id: '$assignedHandler', activeCount: { $sum: 1 } } },
    ]);
    const activeMap = new Map(activeCounts.map((c) => [String(c._id), c.activeCount]));

    const enriched = handlers.map((h) => {
      const obj = h.toObject();
      obj.currentWorkload = activeMap.get(String(h._id)) ?? h.currentWorkload;
      return obj;
    });

    res.status(200).json({
      success: true,
      handlers: enriched,
    });
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, phone, department, specialization, assignedZones, availability, maxCapacity } = req.body;
    if (!name || !email || !department) {
      throw new AppError('Handler name, email, and department are required.', 400);
    }

    const existing = await Handler.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) {
      throw new AppError('A handler with this email already exists.', 409);
    }

    const deptDoc = await Department.findOne({ name: String(department).trim() });

    const handler = await Handler.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      phone: phone ? String(phone).trim() : '',
      department: String(department).trim(),
      departmentRef: deptDoc?._id,
      specialization: specialization ? String(specialization).trim() : 'Clinical Support',
      assignedZones: Array.isArray(assignedZones) && assignedZones.length > 0 ? assignedZones : ['North Wing'],
      availability: availability || 'Available',
      maxCapacity: Number(maxCapacity) || 6,
    });

    res.status(201).json({
      success: true,
      message: 'Handler created successfully.',
      handler,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const handler = await Handler.findById(id);
    if (!handler) {
      throw new AppError('Handler not found.', 404);
    }

    const { name, phone, department, specialization, assignedZones, availability, maxCapacity } = req.body;
    if (name !== undefined) handler.name = String(name).trim();
    if (phone !== undefined) handler.phone = String(phone).trim();
    if (department !== undefined) {
      handler.department = String(department).trim();
      const deptDoc = await Department.findOne({ name: handler.department });
      handler.departmentRef = deptDoc?._id as typeof handler.departmentRef;
    }
    if (specialization !== undefined) handler.specialization = String(specialization).trim();
    if (Array.isArray(assignedZones)) handler.assignedZones = assignedZones;
    if (availability !== undefined) handler.availability = availability;
    if (maxCapacity !== undefined) handler.maxCapacity = Math.max(1, Math.min(50, Number(maxCapacity)));

    await handler.save();

    res.status(200).json({
      success: true,
      message: 'Handler updated successfully.',
      handler,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateHandlerAvailability(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { availability } = req.body;

    if (!['Available', 'Busy', 'On Break', 'Off Duty'].includes(availability)) {
      throw new AppError('Invalid availability status.', 400);
    }

    const handler = await Handler.findByIdAndUpdate(
      id,
      { availability },
      { new: true, runValidators: true }
    );

    if (!handler) {
      throw new AppError('Handler not found.', 404);
    }

    res.status(200).json({
      success: true,
      message: `Availability updated to ${availability}.`,
      handler,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateHandlerCapacity(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const capacity = Number(req.body.maxCapacity);

    if (!Number.isFinite(capacity) || capacity < 1 || capacity > 50) {
      throw new AppError('Maximum capacity must be a number between 1 and 50.', 400);
    }

    const handler = await Handler.findByIdAndUpdate(
      id,
      { maxCapacity: Math.round(capacity) },
      { new: true, runValidators: true }
    );

    if (!handler) {
      throw new AppError('Handler not found.', 404);
    }

    res.status(200).json({
      success: true,
      message: `Maximum workload capacity updated to ${handler.maxCapacity}.`,
      handler,
    });
  } catch (err) {
    next(err);
  }
}
