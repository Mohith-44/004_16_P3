import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'Admin' | 'Nurse / Reporter' | 'Handler' | 'Routing Manager';

export interface IUserPreferences {
  emailNotifications: boolean;
  criticalAlertsOnly: boolean;
  compactTables: boolean;
  defaultZone: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  ward: string;
  phone: string;
  preferences: IUserPreferences;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['Admin', 'Nurse / Reporter', 'Handler', 'Routing Manager'],
      default: 'Nurse / Reporter',
      required: true,
    },
    department: {
      type: String,
      trim: true,
      default: 'General Nursing',
    },
    ward: {
      type: String,
      trim: true,
      default: 'Ward 1A',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      criticalAlertsOnly: { type: Boolean, default: false },
      compactTables: { type: Boolean, default: false },
      defaultZone: { type: String, default: 'All Zones' },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ role: 1 });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
