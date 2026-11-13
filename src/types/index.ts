export type UserRole = 'Admin' | 'Nurse / Reporter' | 'Handler' | 'Routing Manager';

export type ReportCategory = 'Critical' | 'Urgent' | 'Routine' | 'Supply' | 'Maintenance';
export type ReportPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type ReportStatus = 'Pending' | 'Assigned' | 'In Progress' | 'Resolved';
export type HandlerAvailability = 'Available' | 'Busy' | 'On Break' | 'Off Duty';
export type EscalationStatus = 'Normal' | 'Escalated' | 'Standby';
export type PriorityOverride = 'None' | 'Critical' | 'High' | 'Medium' | 'Low';

export interface UserPreferences {
  emailNotifications: boolean;
  criticalAlertsOnly: boolean;
  compactTables: boolean;
  defaultZone: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  ward: string;
  phone: string;
  preferences: UserPreferences;
  createdAt?: string;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  description: string;
  headOfDepartment: string;
  contactExtension: string;
  zonesSupported: string[];
  isActive: boolean;
}

export interface HandlerProfile {
  _id: string;
  user?: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  departmentRef?: Department | string;
  specialization: string;
  assignedZones: string[];
  availability: HandlerAvailability;
  currentWorkload: number;
  maxCapacity: number;
  resolvedCount: number;
}

export interface StatusHistoryEntry {
  _id?: string;
  previousStatus: string;
  updatedStatus: ReportStatus;
  updatedBy: string;
  updatedByRole?: string;
  timestamp: string;
  remarks: string;
}

export interface Report {
  _id: string;
  reportId: string;
  reporter?: string;
  reporterName: string;
  reporterEmail: string;
  contactNumber: string;
  hospitalWard: string;
  wardIdentifier: string;
  zone: string;
  alertCode: string;
  alertType: string;
  category: ReportCategory;
  priority: ReportPriority;
  description: string;
  additionalNotes: string;
  department: string;
  departmentRef?: Department;
  assignedHandler?: HandlerProfile | string | null;
  assignedHandlerName: string;
  status: ReportStatus;
  resolutionNotes: string;
  submittedAt: string;
  updatedAt: string;
  resolvedAt?: string;
  statusHistory: StatusHistoryEntry[];
}

export interface ReportSummaryStats {
  totalReports: number;
  pendingReports: number;
  assignedReports: number;
  assignedOnlyReports: number;
  inProgressReports: number;
  resolvedReports: number;
}

export interface RoutingRule {
  _id: string;
  category: ReportCategory;
  department: string;
  departmentRef?: Department;
  assignedHandler?: HandlerProfile | null;
  backupHandler?: HandlerProfile | null;
  zone: string;
  queuedReports: number;
  escalationStatus: EscalationStatus;
  priorityOverride: PriorityOverride;
  notes: string;
  isActive: boolean;
  updatedAt: string;
}

export interface AppNotification {
  _id: string;
  title: string;
  message: string;
  type: 'report_submitted' | 'report_assigned' | 'report_updated' | 'report_resolved' | 'system';
  severity: 'critical' | 'urgent' | 'info' | 'resolved';
  reportId?: string;
  reportRef?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AnalyticsOverviewResponse {
  overview: {
    totalReports: number;
    pendingReports: number;
    assignedReports: number;
    inProgressReports: number;
    resolvedReports: number;
    criticalReports: number;
    unresolvedReports: number;
    resolutionRate: number;
    avgResolutionHours: number;
  };
  resolvedVsUnresolved: Array<{ name: string; value: number }>;
  dailyTrends: Array<{ date: string; label: string; total: number; resolved: number; critical: number }>;
  weeklyStats: Array<{ week: string; total: number; resolved: number; unresolved: number }>;
  departmentDistribution: Array<{ department: string; total: number; resolved: number; pending: number }>;
  priorityDistribution: Array<{ priority: string; count: number }>;
}
