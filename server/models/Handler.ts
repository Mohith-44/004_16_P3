import mongoose, { Document, Schema } from 'mongoose';

export type HandlerAvailability = 'Available' | 'Busy' | 'On Break' | 'Off Duty';

export interface IHandler extends Document {
  user?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  department: string;
  departmentRef?: mongoose.Types.ObjectId;
  specialization: string;
  assignedZones: string[];
  availability: HandlerAvailability;
  currentWorkload: number;
  maxCapacity: number;
  resolvedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const handlerSchema = new Schema<IHandler>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    name: {
      type: String,
      required: [true, 'Handler name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Handler email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    departmentRef: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    specialization: {
      type: String,
      trim: true,
      default: 'Clinical Operations',
    },
    assignedZones: {
      type: [String],
      default: ['North Wing', 'ICU Complex'],
    },
    availability: {
      type: String,
      enum: ['Available', 'Busy', 'On Break', 'Off Duty'],
      default: 'Available',
    },
    currentWorkload: {
      type: Number,
      default: 0,
      min: [0, 'Workload cannot be negative'],
    },
    maxCapacity: {
      type: Number,
      default: 6,
      min: [1, 'Minimum capacity is 1'],
      max: [50, 'Maximum capacity is 50'],
    },
    resolvedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

handlerSchema.index({ department: 1, availability: 1 });

export const Handler = mongoose.model<IHandler>('Handler', handlerSchema);
