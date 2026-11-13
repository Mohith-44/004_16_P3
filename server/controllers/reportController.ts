import type { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Report, type ReportStatus } from '../models/Report.ts';
import { Department } from '../models/Department.ts';
import { Handler } from '../models/Handler.ts';
import { createNotification } from '../services/notificationService.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/errorHandler.ts';

async function generateUniqueReportId(): Promise<string> {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}`;

  for (let attempt = 0; attempt < 10; attempt++) {
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const candidate = `RPT-${datePart}-${randomPart}`;
    const exists = await Report.exists({ reportId: candidate });
    if (!exists) return candidate;
  }

  return `RPT-${datePart}-${Date.now().toString().slice(-5)}`;
}

async function recalculateHandlerWorkload(handlerId?: mongoose.Types.ObjectId | null): Promise<void> {
  if (!handlerId) return;
  const activeCount = await Report.countDocuments({
    assignedHandler: handlerId,
    status: { $in: ['Assigned', 'In Progress'] },
  });
  const resolvedCount = await Report.countDocuments({
    assignedHandler: handlerId,
    status: 'Resolved',
  });
  await Handler.findByIdAndUpdate(handlerId, {
    currentWorkload: activeCount,
    resolvedCount,
  });
}

function defaultDepartmentForCategory(category: string): string {
  switch (category) {
    case 'Critical':
      return 'Biomedical Engineering';
    case 'Supply':
      return 'Pharmacy';
    case 'Maintenance':
      return 'Maintenance Department';
    case 'Urgent':
    case 'Routine':
    default:
      return 'Nursing Supervisor';
  }
}

export async function createReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      reportId: requestedReportId,
      reporterName,
      reporterEmail,
      contactNumber,
      hospitalWard,
      wardIdentifier,
      zone,
      alertCode,
      alertType,
      category,
      priority,
      description,
      additionalNotes,
      department,
    } = req.body;

    if (
      !reporterName ||
      !reporterEmail ||
      !contactNumber ||
      !hospitalWard ||
      !wardIdentifier ||
      !zone ||
      !alertCode ||
      !alertType ||
      !category ||
      !priority ||
      !description
    ) {
      throw new AppError('Please complete all required reporter and report fields.', 400);
    }

    if (String(description).trim().length < 10) {
      throw new AppError('Description must be at least 10 characters long.', 400);
    }

    let finalReportId = requestedReportId ? String(requestedReportId).toUpperCase().trim() : '';
    if (finalReportId) {
      const duplicate = await Report.exists({ reportId: finalReportId });
      if (duplicate) {
        throw new AppError(
          `Report ID "${finalReportId}" already exists. Leave blank to auto-generate or choose a unique ID.`,
          409
        );
      }
    } else {
      finalReportId = await generateUniqueReportId();
    }

    const selectedDepartment = department ? String(department).trim() : defaultDepartmentForCategory(category);
    const deptDoc = await Department.findOne({ name: selectedDepartment });

    const submittedAt = new Date();
    const actorName = req.user?.name || String(reporterName).trim();
    const actorRole = req.user?.role || 'Nurse / Reporter';

    const report = await Report.create({
      reportId: finalReportId,
      reporter: req.user?._id,
      reporterName: String(reporterName).trim(),
      reporterEmail: String(reporterEmail).toLowerCase().trim(),
      contactNumber: String(contactNumber).trim(),
      hospitalWard: String(hospitalWard).trim(),
      wardIdentifier: String(wardIdentifier).trim(),
      zone: String(zone).trim(),
      alertCode: String(alertCode).toUpperCase().trim(),
      alertType: String(alertType).trim(),
      category,
      priority,
      description: String(description).trim(),
      additionalNotes: additionalNotes ? String(additionalNotes).trim() : '',
      department: selectedDepartment,
      departmentRef: deptDoc?._id,
      assignedHandlerName: 'Unassigned',
      status: 'Pending',
      submittedAt,
      statusHistory: [
        {
          previousStatus: 'New',
          updatedStatus: 'Pending',
          updatedBy: actorName,
          updatedByRole: actorRole,
          timestamp: submittedAt,
          remarks: `Report submitted for ${String(hospitalWard).trim()} (${String(zone).trim()}).`,
        },
      ],
    });

    await createNotification({
      targetRoles: ['Admin', 'Routing Manager', 'Handler', 'Nurse / Reporter'],
      title: `${category} Alert Submitted: ${report.reportId}`,
      message: `${report.reporterName} reported ${report.alertType} in ${report.hospitalWard} (${report.zone}).`,
      type: 'report_submitted',
      severity: category === 'Critical' || priority === 'Critical' ? 'critical' : category === 'Urgent' ? 'urgent' : 'info',
      reportId: report.reportId,
      reportRef: report._id as mongoose.Types.ObjectId,
    });

    res.status(201).json({
      success: true,
      message: 'Ward alert report submitted successfully.',
      report,
    });
  } catch (err) {
    next(err);
  }
}

export async function getReports(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      q,
      category,
      priority,
      status,
      zone,
      department,
      assignedHandler,
      mine,
      startDate,
      endDate,
      page = '1',
      limit = '50',
    } = req.query;

    const filter: Record<string, unknown> = {};

    if (q && String(q).trim()) {
      const term = String(q).trim();
      filter.$or = [
        { reportId: { $regex: term, $options: 'i' } },
        { reporterName: { $regex: term, $options: 'i' } },
        { alertCode: { $regex: term, $options: 'i' } },
        { alertType: { $regex: term, $options: 'i' } },
        { wardIdentifier: { $regex: term, $options: 'i' } },
        { hospitalWard: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') filter.category = category;
    if (priority && priority !== 'All') filter.priority = priority;
    if (status && status !== 'All') filter.status = status;
    if (zone && zone !== 'All' && zone !== 'All Zones') filter.zone = zone;
    if (department && department !== 'All') filter.department = department;
    if (assignedHandler && mongoose.Types.ObjectId.isValid(String(assignedHandler))) {
      filter.assignedHandler = new mongoose.Types.ObjectId(String(assignedHandler));
    }

    if (mine === 'true' && req.user) {
      filter.$and = [
        ...(Array.isArray(filter.$and) ? filter.$and : []),
        {
          $or: [{ reporter: req.user._id }, { reporterEmail: req.user.email }],
        },
      ];
    }

    if (startDate || endDate) {
      const dateQuery: Record<string, Date> = {};
      if (startDate) dateQuery.$gte = new Date(String(startDate));
      if (endDate) {
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
        dateQuery.$lte = end;
      }
      filter.submittedAt = dateQuery;
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(String(limit), 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [reports, totalFiltered, statusAggregation] = await Promise.all([
      Report.find(filter)
        .populate('assignedHandler', 'name email department availability currentWorkload maxCapacity')
        .populate('departmentRef', 'name code')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Report.countDocuments(filter),
      Report.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusCounts: Record<string, number> = {
      Pending: 0,
      Assigned: 0,
      'In Progress': 0,
      Resolved: 0,
    };
    let totalReports = 0;
    for (const row of statusAggregation) {
      statusCounts[row._id] = row.count;
      totalReports += row.count;
    }

    res.status(200).json({
      success: true,
      reports,
      pagination: {
        total: totalFiltered,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalFiltered / limitNum) || 1,
      },
      summary: {
        totalReports,
        pendingReports: statusCounts['Pending'],
        assignedReports: statusCounts['Assigned'] + statusCounts['In Progress'],
        assignedOnlyReports: statusCounts['Assigned'],
        inProgressReports: statusCounts['In Progress'],
        resolvedReports: statusCounts['Resolved'],
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function trackReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawId = String(req.params.reportId || '').trim().toUpperCase();
    if (!rawId) {
      throw new AppError('Please provide a valid Report ID to track.', 400);
    }

    const report = await Report.findOne({ reportId: rawId })
      .populate('assignedHandler', 'name email phone department availability')
      .populate('departmentRef', 'name code contactExtension');

    if (!report) {
      throw new AppError(`No report found with Report ID "${rawId}".`, 404);
    }

    res.status(200).json({
      success: true,
      report,
    });
  } catch (err) {
    next(err);
  }
}

export async function getReportById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { reportId: String(id).toUpperCase().trim() };

    const report = await Report.findOne(query)
      .populate('assignedHandler', 'name email phone department availability currentWorkload maxCapacity')
      .populate('departmentRef', 'name code contactExtension headOfDepartment');

    if (!report) {
      throw new AppError('Report not found.', 404);
    }

    res.status(200).json({
      success: true,
      report,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const report = await Report.findById(id);
    if (!report) {
      throw new AppError('Report not found.', 404);
    }

    const previousHandlerId = report.assignedHandler;
    const previousStatus = report.status;

    const {
      category,
      priority,
      department,
      assignedHandler,
      status,
      additionalNotes,
      resolutionNotes,
      remarks,
    } = req.body;

    if (category) report.category = category;
    if (priority) report.priority = priority;
    if (additionalNotes !== undefined) report.additionalNotes = String(additionalNotes).trim();
    if (resolutionNotes !== undefined) report.resolutionNotes = String(resolutionNotes).trim();

    if (department) {
      report.department = String(department).trim();
      const deptDoc = await Department.findOne({ name: report.department });
      report.departmentRef = deptDoc?._id as mongoose.Types.ObjectId | undefined;
    }

    let handlerChanged = false;
    if (assignedHandler !== undefined) {
      if (assignedHandler === null || assignedHandler === '') {
        report.assignedHandler = undefined;
        report.assignedHandlerName = 'Unassigned';
      } else {
        const handlerDoc = await Handler.findById(assignedHandler);
        if (!handlerDoc) {
          throw new AppError('Selected handler not found.', 404);
        }
        handlerChanged = String(previousHandlerId || '') !== String(handlerDoc._id);
        report.assignedHandler = handlerDoc._id as mongoose.Types.ObjectId;
        report.assignedHandlerName = handlerDoc.name;
        if (!department && handlerDoc.department) {
          report.department = handlerDoc.department;
        }
        if (report.status === 'Pending' && !status) {
          report.status = 'Assigned';
        }
      }
    }

    if (status && ['Pending', 'Assigned', 'In Progress', 'Resolved'].includes(status)) {
      report.status = status as ReportStatus;
      if (status === 'Resolved' && !report.resolvedAt) {
        report.resolvedAt = new Date();
      } else if (status !== 'Resolved') {
        report.resolvedAt = undefined;
      }
    }

    const actorName = req.user?.name || 'System Administrator';
    const actorRole = req.user?.role || 'Admin';

    if (previousStatus !== report.status || handlerChanged) {
      report.statusHistory.push({
        previousStatus,
        updatedStatus: report.status,
        updatedBy: actorName,
        updatedByRole: actorRole,
        timestamp: new Date(),
        remarks:
          remarks ||
          (handlerChanged
            ? `Assigned to ${report.assignedHandlerName} (${report.department}).`
            : `Report updated to ${report.status}.`),
      });
    }

    await report.save();

    await Promise.all([
      recalculateHandlerWorkload(previousHandlerId),
      recalculateHandlerWorkload(report.assignedHandler),
    ]);

    if (handlerChanged && report.assignedHandler) {
      await createNotification({
        targetRoles: ['Admin', 'Routing Manager', 'Handler', 'Nurse / Reporter'],
        title: `Report Assigned: ${report.reportId}`,
        message: `${report.assignedHandlerName} was assigned to ${report.alertType} in ${report.hospitalWard}.`,
        type: 'report_assigned',
        severity: 'info',
        reportId: report.reportId,
        reportRef: report._id as mongoose.Types.ObjectId,
      });
    } else if (previousStatus !== report.status) {
      await createNotification({
        targetRoles: ['Admin', 'Routing Manager', 'Handler', 'Nurse / Reporter'],
        title:
          report.status === 'Resolved'
            ? `Report Resolved: ${report.reportId}`
            : `Report Updated: ${report.reportId}`,
        message: `${actorName} marked ${report.alertType} (${report.hospitalWard}) as ${report.status}.`,
        type: report.status === 'Resolved' ? 'report_resolved' : 'report_updated',
        severity: report.status === 'Resolved' ? 'resolved' : 'info',
        reportId: report.reportId,
        reportRef: report._id as mongoose.Types.ObjectId,
      });
    }

    const updated = await Report.findById(report._id)
      .populate('assignedHandler', 'name email phone department availability currentWorkload maxCapacity')
      .populate('departmentRef', 'name code contactExtension');

    res.status(200).json({
      success: true,
      message: 'Report updated successfully.',
      report: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateReportStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { status, resolutionNotes, remarks, assignedHandler } = req.body;

    if (!status || !['Pending', 'Assigned', 'In Progress', 'Resolved'].includes(status)) {
      throw new AppError('Valid status is required (Pending, Assigned, In Progress, Resolved).', 400);
    }

    const report = await Report.findById(id);
    if (!report) {
      throw new AppError('Report not found.', 404);
    }

    const previousStatus = report.status;
    const previousHandlerId = report.assignedHandler;

    if (assignedHandler) {
      const handlerDoc = await Handler.findById(assignedHandler);
      if (handlerDoc) {
        report.assignedHandler = handlerDoc._id as mongoose.Types.ObjectId;
        report.assignedHandlerName = handlerDoc.name;
      }
    } else if (status === 'Assigned' && !report.assignedHandler && req.user?.role === 'Handler') {
      const selfHandler = await Handler.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }],
      });
      if (selfHandler) {
        report.assignedHandler = selfHandler._id as mongoose.Types.ObjectId;
        report.assignedHandlerName = selfHandler.name;
      }
    }

    report.status = status as ReportStatus;

    if (resolutionNotes !== undefined) {
      report.resolutionNotes = String(resolutionNotes).trim();
    }

    if (status === 'Resolved') {
      report.resolvedAt = new Date();
    } else {
      report.resolvedAt = undefined;
    }

    const actorName = req.user?.name || 'Hospital Handler';
    const actorRole = req.user?.role || 'Handler';

    report.statusHistory.push({
      previousStatus,
      updatedStatus: report.status,
      updatedBy: actorName,
      updatedByRole: actorRole,
      timestamp: new Date(),
      remarks:
        (remarks && String(remarks).trim()) ||
        (resolutionNotes && String(resolutionNotes).trim()) ||
        `Status changed from ${previousStatus} to ${status}.`,
    });

    await report.save();

    await Promise.all([
      recalculateHandlerWorkload(previousHandlerId),
      recalculateHandlerWorkload(report.assignedHandler),
    ]);

    await createNotification({
      targetRoles: ['Admin', 'Routing Manager', 'Handler', 'Nurse / Reporter'],
      title: status === 'Resolved' ? `Report Resolved: ${report.reportId}` : `Status Updated: ${report.reportId}`,
      message: `${actorName} changed ${report.alertType} (${report.hospitalWard}) status to ${status}.`,
      type: status === 'Resolved' ? 'report_resolved' : 'report_updated',
      severity: status === 'Resolved' ? 'resolved' : 'info',
      reportId: report.reportId,
      reportRef: report._id as mongoose.Types.ObjectId,
    });

    const populated = await Report.findById(report._id)
      .populate('assignedHandler', 'name email phone department availability currentWorkload maxCapacity')
      .populate('departmentRef', 'name code contactExtension');

    res.status(200).json({
      success: true,
      message: `Report status updated to ${status}.`,
      report: populated,
    });
  } catch (err) {
    next(err);
  }
}
