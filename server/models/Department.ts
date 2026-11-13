import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  code: string;
  description: string;
  headOfDepartment: string;
  contactExtension: string;
  zonesSupported: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    headOfDepartment: {
      type: String,
      trim: true,
      default: '',
    },
    contactExtension: {
      type: String,
      trim: true,
      default: '',
    },
    zonesSupported: {
      type: [String],
      default: ['North Wing', 'South Wing', 'East Wing', 'West Wing', 'ICU Complex', 'Emergency Wing'],
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

export const Department = mongoose.model<IDepartment>('Department', departmentSchema);
