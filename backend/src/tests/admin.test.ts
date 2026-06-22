import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../models/User';
import { Resource } from '../models/Resource';
import { ResourceRequest } from '../models/ResourceRequest';
import { Report } from '../models/Report';
import { Opportunity } from '../models/Opportunity';
import { AuditLog } from '../models/AuditLog';
import adminRoutes from '../routes/adminRoutes';
import { signAccessToken } from '../utils/jwt';

let mongoServer: MongoMemoryServer;

const testApp = express();
testApp.use(express.json());
testApp.use('/api/v1', adminRoutes);

// Global Error Handler for testApp
testApp.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(err.status || err.statusCode || 500).json({ success: false, message: err.message });
});

beforeAll(async () => {
  await mongoose.disconnect();
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
}, 60000);

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Admin Panel Module Tests', () => {
  let studentAId: mongoose.Types.ObjectId;
  let adminId: mongoose.Types.ObjectId;
  let adminBId: mongoose.Types.ObjectId;
  let facultyId: mongoose.Types.ObjectId;

  let tokenStudentA: string;
  let tokenAdmin: string;
  let tokenAdminB: string;

  beforeEach(async () => {
    // 1. Create Student A
    const studentA = await User.create({
      fullName: 'Student A',
      email: '0701cs231001@uecu.ac.in',
      password: 'password123',
      role: 'student',
      status: 'active',
      isEmailVerified: true,
      registrationNumber: '0701cs231001',
      branch: 'cs',
      yearOfRegistration: 2023,
      dob: new Date('2003-05-15'),
      phoneNumber: '9876543200'
    });
    studentAId = studentA._id as mongoose.Types.ObjectId;
    tokenStudentA = signAccessToken({
      id: studentAId.toString(),
      role: 'student',
      email: studentA.email,
      isCoreTeam: false
    });

    // 2. Create Admin
    const admin = await User.create({
      fullName: 'Admin User',
      email: 'admin@uecu.ac.in',
      password: 'password123',
      role: 'admin',
      status: 'active',
      isEmailVerified: true,
      phoneNumber: '9876543203'
    });
    adminId = admin._id as mongoose.Types.ObjectId;
    tokenAdmin = signAccessToken({
      id: adminId.toString(),
      role: 'admin',
      email: admin.email,
      isCoreTeam: false
    });

    // 3. Create Admin B (for self-action check)
    const adminB = await User.create({
      fullName: 'Admin User B',
      email: 'adminb@uecu.ac.in',
      password: 'password123',
      role: 'admin',
      status: 'active',
      isEmailVerified: true,
      phoneNumber: '9876543204'
    });
    adminBId = adminB._id as mongoose.Types.ObjectId;
    tokenAdminB = signAccessToken({
      id: adminBId.toString(),
      role: 'admin',
      email: adminB.email,
      isCoreTeam: false
    });

    // 4. Create Faculty in pendingApproval state
    const faculty = await User.create({
      fullName: 'Faculty User',
      email: 'faculty@uecu.ac.in',
      password: 'password123',
      role: 'faculty',
      status: 'pendingApproval',
      isEmailVerified: true,
      phoneNumber: '9876543205'
    });
    facultyId = faculty._id as mongoose.Types.ObjectId;
  });

  describe('GET /admin/stats', () => {
    it('should aggregate dashboard counts correctly', async () => {
      // Setup some resources & opportunities
      await Resource.create({
        title: 'Resource X',
        description: 'Desc',
        category: 'notes',
        file: { publicId: 'a', secureUrl: 'http://a', fileType: 'pdf', fileSize: 100 },
        uploadedBy: studentAId
      });

      await ResourceRequest.create({
        title: 'Req X',
        description: 'Desc',
        category: 'notes',
        file: { publicId: 'a', secureUrl: 'http://a', fileType: 'pdf', fileSize: 100 },
        uploadedBy: studentAId,
        status: 'pending'
      });

      await Opportunity.create({
        title: 'Internship X',
        description: 'Desc',
        type: 'internship',
        link: 'https://test.com',
        createdBy: adminId
      });

      const res = await request(testApp)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalUsers).toBe(3); // admin, adminB, studentA
      expect(res.body.data.pendingVerifications).toBe(1); // faculty
      expect(res.body.data.totalResources).toBe(1);
      expect(res.body.data.pendingResourceRequests).toBe(1);
      expect(res.body.data.totalOpportunities).toBe(1);
    });

    it('should block non-admins from stats', async () => {
      const res = await request(testApp)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(res.status).toBe(403);
    });
  });

  describe('User Management Endpoints', () => {
    it('should retrieve a paginated/searchable list of users', async () => {
      const res = await request(testApp)
        .get('/api/v1/admin/users?search=Student')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users.length).toBe(1);
      expect(res.body.data.users[0].fullName).toBe('Student A');
    });

    it('should allow admin to change a student role to admin and log audit log', async () => {
      const res = await request(testApp)
        .patch(`/api/v1/admin/users/${studentAId}/role`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(200);
      
      const updated = await User.findById(studentAId);
      expect(updated?.role).toBe('admin');

      // Verify Audit Log
      const log = await AuditLog.findOne({ action: 'roleChange', targetId: studentAId });
      expect(log).not.toBeNull();
      expect(log?.actorId.toString()).toBe(adminId.toString());
    });

    it('should prevent admin from changing their own role', async () => {
      const res = await request(testApp)
        .patch(`/api/v1/admin/users/${adminId}/role`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ role: 'student' });

      expect(res.status).toBe(400);
    });

    it('should allow admin to ban a user, dispatching email and logging audit', async () => {
      const res = await request(testApp)
        .patch(`/api/v1/admin/users/${studentAId}/ban`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);

      const updated = await User.findById(studentAId);
      expect(updated?.status).toBe('banned');

      // Verify Audit Log
      const log = await AuditLog.findOne({ action: 'ban', targetId: studentAId });
      expect(log).not.toBeNull();
    });

    it('should block admin from banning another admin', async () => {
      const res = await request(testApp)
        .patch(`/api/v1/admin/users/${adminBId}/ban`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(400);
    });
  });

  describe('Pending Verification Queue & Approval', () => {
    it('should retrieve pending verifications list', async () => {
      const res = await request(testApp)
        .get('/api/v1/admin/users/pending-approval')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users.length).toBe(1);
      expect(res.body.data.users[0].fullName).toBe('Faculty User');
    });

    it('should allow admin to approve a pending user', async () => {
      const res = await request(testApp)
        .patch(`/api/v1/admin/users/${facultyId}/approve`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      
      const updated = await User.findById(facultyId);
      expect(updated?.status).toBe('active');

      const log = await AuditLog.findOne({ action: 'approval', targetId: facultyId });
      expect(log).not.toBeNull();
    });

    it('should allow admin to reject a pending user', async () => {
      const res = await request(testApp)
        .patch(`/api/v1/admin/users/${facultyId}/reject`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);

      const updated = await User.findById(facultyId);
      expect(updated?.status).toBe('disabled');

      const log = await AuditLog.findOne({ action: 'rejection', targetId: facultyId });
      expect(log).not.toBeNull();
    });
  });

  describe('Reports Endpoints', () => {
    it('should allow student to submit a report, and admin to list and resolve it', async () => {
      // 1. Submit report
      const resReport = await request(testApp)
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          targetId: studentAId.toString(),
          targetType: 'user',
          reason: 'Spamming behavior.'
        });

      expect(resReport.status).toBe(201);
      expect(resReport.body.success).toBe(true);

      const reportId = resReport.body.data.report._id;

      // 2. Admin retrieves reports
      const resList = await request(testApp)
        .get('/api/v1/admin/reports')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(resList.status).toBe(200);
      expect(resList.body.data.reports.length).toBe(1);
      expect(resList.body.data.reports[0].status).toBe('pending');

      // 3. Admin resolves report
      const resResolve = await request(testApp)
        .patch(`/api/v1/admin/reports/${reportId}/resolve`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(resResolve.status).toBe(200);
      expect(resResolve.body.data.report.status).toBe('resolved');
      expect(resResolve.body.data.report.resolvedBy).toBe(adminId.toString());
    });
  });

  describe('Audit Logs Access', () => {
    it('should retrieve audit logs list', async () => {
      // Create a dummy audit log
      await AuditLog.create({
        actorId: adminId,
        action: 'approval',
        targetId: studentAId,
        details: 'Approved resources'
      });

      const res = await request(testApp)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.data.logs.length).toBe(1);
      expect(res.body.data.logs[0].details).toBe('Approved resources');
    });
  });
});
