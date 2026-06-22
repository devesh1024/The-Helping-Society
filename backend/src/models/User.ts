import mongoose, { Schema, Document } from 'mongoose';

// Base User Document Interface
export interface IUser extends Document {
  fullName: string;
  email: string;
  password?: string;
  role: 'student' | 'faculty' | 'contributor' | 'admin';
  status: 'pendingVerification' | 'pendingApproval' | 'active' | 'disabled' | 'banned';
  isEmailVerified: boolean;
  emailVerificationToken?: string | null;
  emailVerificationTokenExpires?: Date | null;
  resetPasswordToken?: string | null;
  resetPasswordTokenExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Base User Schema
const BaseUserSchema = new Schema<IUser>({
  fullName: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true
  },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['student', 'faculty', 'contributor', 'admin'], 
    required: true 
  },
  status: {
    type: String,
    enum: ['pendingVerification', 'pendingApproval', 'active', 'disabled', 'banned'],
    default: 'pendingVerification'
  },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, select: false, default: null },
  emailVerificationTokenExpires: { type: Date, select: false, default: null },
  resetPasswordToken: { type: String, select: false, default: null },
  resetPasswordTokenExpires: { type: Date, select: false, default: null }
}, { 
  timestamps: true, 
  discriminatorKey: 'role', 
  strict: true 
});

BaseUserSchema.index({ email: 1 });

export const User = mongoose.model<IUser>('User', BaseUserSchema);

// Student Discriminator Interface
export interface IStudent extends IUser {
  registrationNumber: string;
  branch: 'cs' | 'ce' | 'ec' | 'ee' | 'me' | 'cm';
  yearOfRegistration: number;
  dob: Date;
  phoneNumber: string;
  isCoreTeam: boolean;
}

// Student Schema
const StudentSchema = new Schema<IStudent>({
  registrationNumber: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    validate: {
      validator: function(val: string) {
        return /^0701(CS|CE|EC|EE|ME|CM)\d{2}(\d{4}|3D\d{2})$/i.test(val);
      },
      message: 'Registration number must match regular UECU or direct-entry diploma patterns.'
    }
  },
  branch: { type: String, enum: ['cs', 'ce', 'ec', 'ee', 'me', 'cm'], required: true },
  yearOfRegistration: { type: Number, required: true },
  dob: { type: Date, required: true },
  phoneNumber: { type: String, required: true },
  isCoreTeam: { type: Boolean, default: false }
});

export const Student = User.discriminator<IStudent>('student', StudentSchema);

// Faculty Discriminator Interface
export interface IFaculty extends IUser {
  phoneNumber: string;
}

// Faculty Schema
const FacultySchema = new Schema<IFaculty>({
  phoneNumber: { type: String, required: true }
});

export const Faculty = User.discriminator<IFaculty>('faculty', FacultySchema);

// Contributor Discriminator Interface
export interface IContributor extends IUser {
  organizationName: string;
  roleInOrganization: string;
}

// Contributor Schema
const ContributorSchema = new Schema<IContributor>({
  organizationName: { type: String, required: true },
  roleInOrganization: { type: String, required: true }
});

export const Contributor = User.discriminator<IContributor>('contributor', ContributorSchema);

// Admin Discriminator Interface (Inherits base fields without additional fields)
export interface IAdmin extends IUser {}

// Admin Schema
const AdminSchema = new Schema<IAdmin>({});

export const Admin = User.discriminator<IAdmin>('admin', AdminSchema);
