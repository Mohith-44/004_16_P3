import mongoose from 'mongoose';
import {
  Notification,
  type NotificationSeverity,
  type NotificationType,
} from '../models/Notification.ts';

interface CreateNotificationInput {
  recipient?: mongoose.Types.ObjectId;
  targetRoles?: string[];
  title: string;
  message: string;
  type: NotificationType;
  severity: NotificationSeverity;
  reportId?: string;
  reportRef?: mongoose.Types.ObjectId;
}

export async function createNotification(input: CreateNotificationInput) {
  return Notification.create({
    recipient: input.recipient,
    targetRoles: input.targetRoles || ['Admin', 'Nurse / Reporter', 'Handler', 'Routing Manager'],
    title: input.title,
    message: input.message,
    type: input.type,
    severity: input.severity,
    reportId: input.reportId,
    reportRef: input.reportRef,
  });
}
