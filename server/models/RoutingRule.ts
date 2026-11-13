import mongoose, { Document, Schema } from 'mongoose';

export type EscalationStatus = 'Normal' | 'Escalated' | 'Standby';
export type PriorityOverride = 'None' | 'Critical' | 'High' | 'Medium' | 'Low';

export interface IRoutingRule extends Document {
  category: 'Critical' | 'Urgent' | 'Routine' | 'Supply' | 'Maintenance';
  department: string;
  departmentRef?: mongoose.Types.ObjectId;
  assignedHandler?: mongoose.Types.ObjectId;
  backupHandler?: mongoose.Types.ObjectId;
  zone: string;
  escalationStatus: EscalationStatus;
  priorityOverride: PriorityOverride;
  notes: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const routingRuleSchema = new Schema<IRoutingRule>(
  {
    category: {
      type: String,
      enum: ['Critical', 'Urgent', 'Routine', 'Supply', 'Maintenance'],
      required: [true, 'Report category is required'],
    },
    department: {
      type: String,
      required: [true, 'Hospital department is required'],
      trim: true,
    },
    departmentRef: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    assignedHandler: {
      type: Schema.Types.ObjectId,
      ref: 'Handler',
    },
    backupHandler: {
      type: Schema.Types.ObjectId,
      ref: 'Handler',
    },
    zone: {
      type: String,
      required: [true, 'Hospital zone is required'],
      trim: true,
    },
    escalationStatus: {
      type: String,
      enum: ['Normal', 'Escalated', 'Standby'],
      default: 'Normal',
    },
    priorityOverride: {
      type: String,
      enum: ['None', 'Critical', 'High', 'Medium', 'Low'],
      default: 'None',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

routingRuleSchema.index({ category: 1, zone: 1 });

export const RoutingRule = mongoose.model<IRoutingRule>('RoutingRule', routingRuleSchema);
