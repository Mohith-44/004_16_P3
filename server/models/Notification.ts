import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'report_submitted'
  | 'report_assigned'
  | 'report_updated'
  | 'report_resolved'
  | 'system';

export type NotificationSeverity = 'critical' | 'urgent' | 'info' | 'resolved';

export interface INotification extends Document {
  recipient?: mongoose.Types.ObjectId;
  targetRoles: string[];
  title: string;
  message: string;
  type: NotificationType;
  severity: NotificationSeverity;
  reportId?: string;
  reportRef?: mongoose.Types.ObjectId;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    targetRoles: {
      type: [String],
      default: ['Admin', 'Nurse / Reporter', 'Handler', 'Routing Manager'],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['report_submitted', 'report_assigned', 'report_updated', 'report_resolved', 'system'],
      default: 'system',
    },
    severity: {
      type: String,
      enum: ['critical', 'urgent', 'info', 'resolved'],
      default: 'info',
    },
    reportId: {
      type: String,
      trim: true,
    },
    reportRef: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
    },
    readBy: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ recipient: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
