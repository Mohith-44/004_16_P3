import mongoose, { Document, Schema } from 'mongoose';

export type ReportCategory = 'Critical' | 'Urgent' | 'Routine' | 'Supply' | 'Maintenance';
export type ReportPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type ReportStatus = 'Pending' | 'Assigned' | 'In Progress' | 'Resolved';

export interface IStatusHistoryEntry {
  previousStatus: string;
  updatedStatus: ReportStatus;
  updatedBy: string;
  updatedByRole?: string;
  timestamp: Date;
  remarks: string;
}

export interface IReport extends Document {
  reportId: string;
  reporter?: mongoose.Types.ObjectId;
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
  departmentRef?: mongoose.Types.ObjectId;
  assignedHandler?: mongoose.Types.ObjectId;
  assignedHandlerName: string;
  status: ReportStatus;
  resolutionNotes: string;
  submittedAt: Date;
  resolvedAt?: Date;
  statusHistory: IStatusHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const statusHistorySchema = new Schema<IStatusHistoryEntry>(
  {
    previousStatus: {
      type: String,
      required: true,
    },
    updatedStatus: {
      type: String,
      enum: ['Pending', 'Assigned', 'In Progress', 'Resolved'],
      required: true,
    },
    updatedBy: {
      type: String,
      required: true,
      trim: true,
    },
    updatedByRole: {
      type: String,
      trim: true,
      default: 'Staff',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const reportSchema = new Schema<IReport>(
  {
    reportId: {
      type: String,
      required: [true, 'Report identifier is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reporterName: {
      type: String,
      required: [true, 'Reporter name is required'],
      trim: true,
    },
    reporterEmail: {
      type: String,
      required: [true, 'Reporter email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    hospitalWard: {
      type: String,
      required: [true, 'Hospital ward is required'],
      trim: true,
    },
    wardIdentifier: {
      type: String,
      required: [true, 'Ward identifier is required'],
      trim: true,
    },
    zone: {
      type: String,
      required: [true, 'Hospital zone is required'],
      trim: true,
    },
    alertCode: {
      type: String,
      required: [true, 'Alert code is required'],
      uppercase: true,
      trim: true,
    },
    alertType: {
      type: String,
      required: [true, 'Alert type is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Critical', 'Urgent', 'Routine', 'Supply', 'Maintenance'],
      required: [true, 'Report category is required'],
    },
    priority: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low'],
      required: [true, 'Priority level is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
    },
    additionalNotes: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      trim: true,
      default: 'Nursing Supervisor',
    },
    departmentRef: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    assignedHandler: {
      type: Schema.Types.ObjectId,
      ref: 'Handler',
    },
    assignedHandlerName: {
      type: String,
      trim: true,
      default: 'Unassigned',
    },
    status: {
      type: String,
      enum: ['Pending', 'Assigned', 'In Progress', 'Resolved'],
      default: 'Pending',
    },
    resolutionNotes: {
      type: String,
      trim: true,
      default: '',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ category: 1, status: 1 });
reportSchema.index({ priority: 1 });
reportSchema.index({ zone: 1 });
reportSchema.index({ department: 1 });
reportSchema.index({ submittedAt: -1 });
reportSchema.index({ assignedHandler: 1 });

export const Report = mongoose.model<IReport>('Report', reportSchema);
