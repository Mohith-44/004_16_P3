import type {
  EscalationStatus,
  HandlerAvailability,
  PriorityOverride,
  ReportCategory,
  ReportPriority,
  ReportStatus,
  UserRole,
} from '../types/index.ts';

export const REPORT_CATEGORIES: ReportCategory[] = [
  'Critical',
  'Urgent',
  'Routine',
  'Supply',
  'Maintenance',
];

export const REPORT_PRIORITIES: ReportPriority[] = ['Critical', 'High', 'Medium', 'Low'];

export const REPORT_STATUSES: ReportStatus[] = ['Pending', 'Assigned', 'In Progress', 'Resolved'];

export const HOSPITAL_ZONES: string[] = [
  'ICU Complex',
  'Emergency Wing',
  'North Wing',
  'South Wing',
  'East Wing',
  'West Wing',
];

export const HOSPITAL_DEPARTMENTS: string[] = [
  'Biomedical Engineering',
  'Pharmacy',
  'Maintenance Department',
  'Nursing Supervisor',
];

export const USER_ROLES: UserRole[] = ['Admin', 'Nurse / Reporter', 'Handler', 'Routing Manager'];

export const HANDLER_AVAILABILITIES: HandlerAvailability[] = [
  'Available',
  'Busy',
  'On Break',
  'Off Duty',
];

export const ESCALATION_STATUSES: EscalationStatus[] = ['Normal', 'Escalated', 'Standby'];

export const PRIORITY_OVERRIDES: PriorityOverride[] = ['None', 'Critical', 'High', 'Medium', 'Low'];

export const ALERT_TYPE_SUGGESTIONS: string[] = [
  'Ventilator Pressure Alarm',
  'Central Telemetry Lead Dropout',
  'Crash Cart Defibrillator Self-Test Fail',
  'Urgent Patient Transfer Support',
  'Rapid Response Pre-Alert',
  'Pediatric Antibiotic Shortage',
  'Sterile Arterial Line Kit Low',
  'IV Fluid Supply Shortage',
  'Negative Pressure Differential Drop',
  'Wall Oxygen Outlet Leak',
  'Nurse Call Button Malfunction',
  'Infusion Pump Calibration',
];
