import type { Response, NextFunction } from 'express';
import { Report } from '../models/Report.ts';
import type { AuthRequest } from '../middleware/auth.ts';

function buildMatchFilter(query: AuthRequest['query']): Record<string, unknown> {
  const match: Record<string, unknown> = {};
  const { startDate, endDate, category, zone, priority, status } = query;

  if (category && category !== 'All') match.category = category;
  if (zone && zone !== 'All' && zone !== 'All Zones') match.zone = zone;
  if (priority && priority !== 'All') match.priority = priority;
  if (status && status !== 'All') match.status = status;

  if (startDate || endDate) {
    const dateRange: Record<string, Date> = {};
    if (startDate) dateRange.$gte = new Date(String(startDate));
    if (endDate) {
      const end = new Date(String(endDate));
      end.setHours(23, 59, 59, 999);
      dateRange.$lte = end;
    }
    match.submittedAt = dateRange;
  }

  return match;
}

export async function getAnalyticsOverview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const match = buildMatchFilter(req.query);

    const [
      totalsAgg,
      dailyAgg,
      weeklyAgg,
      departmentAgg,
      priorityAgg,
      resolutionTimeAgg,
    ] = await Promise.all([
      Report.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalReports: { $sum: 1 },
            pendingReports: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
            assignedReports: { $sum: { $cond: [{ $eq: ['$status', 'Assigned'] }, 1, 0] } },
            inProgressReports: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
            resolvedReports: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
            criticalReports: { $sum: { $cond: [{ $eq: ['$category', 'Critical'] }, 1, 0] } },
          },
        },
      ]),
      Report.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
            total: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
            critical: { $sum: { $cond: [{ $eq: ['$category', 'Critical'] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Report.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              year: { $isoWeekYear: '$submittedAt' },
              week: { $isoWeek: '$submittedAt' },
            },
            total: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
            unresolved: { $sum: { $cond: [{ $ne: ['$status', 'Resolved'] }, 1, 0] } },
          },
        },
        { $sort: { '_id.year': 1, '_id.week': 1 } },
      ]),
      Report.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$department',
            total: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $ne: ['$status', 'Resolved'] }, 1, 0] } },
          },
        },
        { $sort: { total: -1 } },
      ]),
      Report.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 },
          },
        },
      ]),
      Report.aggregate([
        { $match: { ...match, status: 'Resolved', resolvedAt: { $ne: null } } },
        {
          $project: {
            hours: {
              $divide: [{ $subtract: ['$resolvedAt', '$submittedAt'] }, 1000 * 60 * 60],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgHours: { $avg: '$hours' },
          },
        },
      ]),
    ]);

    const totals = totalsAgg[0] || {
      totalReports: 0,
      pendingReports: 0,
      assignedReports: 0,
      inProgressReports: 0,
      resolvedReports: 0,
      criticalReports: 0,
    };

    const unresolvedReports = totals.totalReports - totals.resolvedReports;
    const resolutionRate =
      totals.totalReports > 0 ? Math.round((totals.resolvedReports / totals.totalReports) * 100) : 0;
    const avgResolutionHours = resolutionTimeAgg[0]?.avgHours
      ? Number(resolutionTimeAgg[0].avgHours.toFixed(1))
      : 0;

    const priorityOrder = ['Critical', 'High', 'Medium', 'Low'];
    const priorityMap = new Map(priorityAgg.map((p) => [p._id, p.count]));

    res.status(200).json({
      success: true,
      overview: {
        ...totals,
        unresolvedReports,
        resolutionRate,
        avgResolutionHours,
      },
      resolvedVsUnresolved: [
        { name: 'Resolved', value: totals.resolvedReports },
        { name: 'Unresolved', value: unresolvedReports },
      ],
      dailyTrends: dailyAgg.map((d) => ({
        date: d._id,
        label: d._id.slice(5),
        total: d.total,
        resolved: d.resolved,
        critical: d.critical,
      })),
      weeklyStats: weeklyAgg.map((w) => ({
        week: `W${w._id.week}`,
        total: w.total,
        resolved: w.resolved,
        unresolved: w.unresolved,
      })),
      departmentDistribution: departmentAgg.map((d) => ({
        department: d._id || 'Unassigned',
        total: d.total,
        resolved: d.resolved,
        pending: d.pending,
      })),
      priorityDistribution: priorityOrder.map((p) => ({
        priority: p,
        count: priorityMap.get(p) || 0,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function getCategoryAnalytics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const match = buildMatchFilter(req.query);
    const categories = ['Critical', 'Urgent', 'Routine', 'Supply', 'Maintenance'];

    const agg = await Report.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
        },
      },
    ]);

    const map = new Map(agg.map((a) => [a._id, a]));
    const data = categories.map((cat) => ({
      category: cat,
      count: map.get(cat)?.count || 0,
      resolved: map.get(cat)?.resolved || 0,
    }));

    res.status(200).json({
      success: true,
      categories: data,
    });
  } catch (err) {
    next(err);
  }
}

export async function getZoneAnalytics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const match = buildMatchFilter(req.query);

    const agg = await Report.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$zone',
          count: { $sum: 1 },
          critical: { $sum: { $cond: [{ $eq: ['$category', 'Critical'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      zones: agg.map((z) => ({
        zone: z._id || 'Unknown',
        count: z.count,
        critical: z.critical,
        resolved: z.resolved,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function getStatusAnalytics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const match = buildMatchFilter(req.query);
    const statuses = ['Pending', 'Assigned', 'In Progress', 'Resolved'];

    const agg = await Report.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const map = new Map(agg.map((s) => [s._id, s.count]));
    const data = statuses.map((st) => ({
      status: st,
      count: map.get(st) || 0,
    }));

    res.status(200).json({
      success: true,
      statuses: data,
    });
  } catch (err) {
    next(err);
  }
}
