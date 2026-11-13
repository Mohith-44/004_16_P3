import type { Response, NextFunction } from 'express';
import { RoutingRule } from '../models/RoutingRule.ts';
import { Department } from '../models/Department.ts';
import { Report } from '../models/Report.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/errorHandler.ts';

export async function getRoutingRules(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { category, department, zone, escalationStatus } = req.query;
    const filter: Record<string, unknown> = {};
    if (category && category !== 'All') filter.category = category;
    if (department && department !== 'All') filter.department = department;
    if (zone && zone !== 'All' && zone !== 'All Zones') filter.zone = zone;
    if (escalationStatus && escalationStatus !== 'All') filter.escalationStatus = escalationStatus;

    const [rules, queuedReportsAgg, activeHandlerAgg] = await Promise.all([
      RoutingRule.find(filter)
        .populate('departmentRef', 'name code contactExtension headOfDepartment')
        .populate('assignedHandler', 'name email availability currentWorkload maxCapacity department')
        .populate('backupHandler', 'name email availability currentWorkload maxCapacity department')
        .sort({ category: 1, zone: 1 }),
      Report.aggregate([
        { $match: { status: { $in: ['Pending', 'Assigned', 'In Progress'] } } },
        {
          $group: {
            _id: { category: '$category', zone: '$zone' },
            count: { $sum: 1 },
          },
        },
      ]),
      Report.aggregate([
        { $match: { status: { $in: ['Assigned', 'In Progress'] }, assignedHandler: { $ne: null } } },
        { $group: { _id: '$assignedHandler', activeCount: { $sum: 1 } } },
      ]),
    ]);

    const queueMap = new Map(
      queuedReportsAgg.map((q) => [`${q._id.category}::${q._id.zone}`, q.count])
    );
    const activeHandlerMap = new Map(activeHandlerAgg.map((h) => [String(h._id), h.activeCount]));

    const enrichedRules = rules.map((rule) => {
      const obj = rule.toObject() as unknown as Record<string, unknown> & {
        category: string;
        zone: string;
        assignedHandler?: { _id: unknown; currentWorkload?: number } | null;
      };
      obj.queuedReports = queueMap.get(`${rule.category}::${rule.zone}`) || 0;
      if (obj.assignedHandler && obj.assignedHandler._id) {
        const liveLoad = activeHandlerMap.get(String(obj.assignedHandler._id));
        if (liveLoad !== undefined) {
          obj.assignedHandler.currentWorkload = liveLoad;
        }
      }
      return obj;
    });

    res.status(200).json({
      success: true,
      rules: enrichedRules,
    });
  } catch (err) {
    next(err);
  }
}

export async function createRoutingRule(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      category,
      department,
      assignedHandler,
      backupHandler,
      zone,
      escalationStatus,
      priorityOverride,
      notes,
      isActive,
    } = req.body;

    if (!category || !department || !zone) {
      throw new AppError('Category, department, and hospital zone are required.', 400);
    }

    const deptDoc = await Department.findOne({ name: String(department).trim() });

    const rule = await RoutingRule.create({
      category,
      department: String(department).trim(),
      departmentRef: deptDoc?._id,
      assignedHandler: assignedHandler || undefined,
      backupHandler: backupHandler || undefined,
      zone: String(zone).trim(),
      escalationStatus: escalationStatus || 'Normal',
      priorityOverride: priorityOverride || 'None',
      notes: notes ? String(notes).trim() : '',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    const populated = await RoutingRule.findById(rule._id)
      .populate('departmentRef', 'name code contactExtension')
      .populate('assignedHandler', 'name email availability currentWorkload maxCapacity department')
      .populate('backupHandler', 'name email availability currentWorkload maxCapacity department');

    res.status(201).json({
      success: true,
      message: 'Routing rule created successfully.',
      rule: populated,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateRoutingRule(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const rule = await RoutingRule.findById(id);
    if (!rule) {
      throw new AppError('Routing rule not found.', 404);
    }

    const {
      category,
      department,
      assignedHandler,
      backupHandler,
      zone,
      escalationStatus,
      priorityOverride,
      notes,
      isActive,
    } = req.body;

    if (category) rule.category = category;
    if (department) {
      rule.department = String(department).trim();
      const deptDoc = await Department.findOne({ name: rule.department });
      rule.departmentRef = deptDoc?._id as typeof rule.departmentRef;
    }
    if (assignedHandler !== undefined) {
      rule.assignedHandler = assignedHandler || undefined;
    }
    if (backupHandler !== undefined) {
      rule.backupHandler = backupHandler || undefined;
    }
    if (zone) rule.zone = String(zone).trim();
    if (escalationStatus) rule.escalationStatus = escalationStatus;
    if (priorityOverride) rule.priorityOverride = priorityOverride;
    if (notes !== undefined) rule.notes = String(notes).trim();
    if (isActive !== undefined) rule.isActive = Boolean(isActive);

    await rule.save();

    const populated = await RoutingRule.findById(rule._id)
      .populate('departmentRef', 'name code contactExtension')
      .populate('assignedHandler', 'name email availability currentWorkload maxCapacity department')
      .populate('backupHandler', 'name email availability currentWorkload maxCapacity department');

    res.status(200).json({
      success: true,
      message: 'Routing rule updated successfully.',
      rule: populated,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteRoutingRule(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const rule = await RoutingRule.findByIdAndDelete(id);
    if (!rule) {
      throw new AppError('Routing rule not found.', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Routing rule deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}
