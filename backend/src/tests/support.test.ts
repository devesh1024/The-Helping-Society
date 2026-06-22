import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../models/User';
import { SupportRequest } from '../models/SupportRequest';
import { AuditLog } from '../models/AuditLog';
import supportRoutes from '../routes/supportRoutes';
import { signAccessToken } from '../utils/jwt';

let mongoServer: MongoMemoryServer;

const testApp = express();
testApp.use(express.json());
testApp.use('/api/v1', supportRoutes);

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

describe('Support Module Tests', () => {
  let studentAId: mongoose.Types.ObjectId;
  let studentBId: mongoose.Types.ObjectId;
  let contributorId: mongoose.Types.ObjectId;
  let adminId: mongoose.Types.ObjectId;

  let tokenStudentA: string;
  let tokenStudentB: string;
  let tokenContributor: string;
  let tokenAdmin: string;

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

    // 2. Create Student B
    const studentB = await User.create({
      fullName: 'Student B',
      email: '0701cs231002@uecu.ac.in',
      password: 'password123',
      role: 'student',
      status: 'active',
      isEmailVerified: true,
      registrationNumber: '0701cs231002',
      branch: 'cs',
      yearOfRegistration: 2023,
      dob: new Date('2003-05-15'),
      phoneNumber: '9876543201'
    });
    studentBId = studentB._id as mongoose.Types.ObjectId;
    tokenStudentB = signAccessToken({
      id: studentBId.toString(),
      role: 'student',
      email: studentB.email,
      isCoreTeam: false
    });

    // 3. Create Contributor
    const contributor = await User.create({
      fullName: 'Contributor A',
      email: 'recruiter@external.com',
      password: 'password123',
      role: 'contributor',
      status: 'active',
      isEmailVerified: true,
      phoneNumber: '9876543202',
      organizationName: 'Recruiter Corp',
      roleInOrganization: 'Recruiter'
    });
    contributorId = contributor._id as mongoose.Types.ObjectId;
    tokenContributor = signAccessToken({
      id: contributorId.toString(),
      role: 'contributor',
      email: contributor.email,
      isCoreTeam: false
    });

    // 4. Create Admin
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
  });

  describe('POST /support-requests', () => {
    it('should create a standard support request as pending', async () => {
      const res = await request(testApp)
        .post('/api/v1/support-requests')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          title: 'Standard Request',
          description: 'Need help with room rent issue',
          contactNumber: '1234567890',
          location: 'Block A, Hostel 2',
          isEmergency: false
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.request.status).toBe('pending');
      expect(res.body.data.request.isEmergency).toBe(false);
    });

    it('should create an emergency support request as approved instantly', async () => {
      const res = await request(testApp)
        .post('/api/v1/support-requests')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          title: 'Emergency Request',
          description: 'Accident near gate number 3',
          contactNumber: '1234567890',
          location: 'Main Gate',
          isEmergency: true
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.request.status).toBe('approved');
      expect(res.body.data.request.isEmergency).toBe(true);
    });

    it('should reject creation if description exceeds 500 characters', async () => {
      const longDescription = 'a'.repeat(501);
      const res = await request(testApp)
        .post('/api/v1/support-requests')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          title: 'Too Long Description Request',
          description: longDescription,
          contactNumber: '1234567890',
          location: 'Main Gate',
          isEmergency: false
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should block contributor from creating a support request', async () => {
      const res = await request(testApp)
        .post('/api/v1/support-requests')
        .set('Authorization', `Bearer ${tokenContributor}`)
        .send({
          title: 'Contributor Request',
          description: 'Should fail',
          contactNumber: '1234567890',
          location: 'Unknown',
          isEmergency: false
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /support-requests', () => {
    it('should allow admin to see all support requests', async () => {
      await SupportRequest.create({
        title: 'Pending A',
        description: 'Standard pending',
        contactNumber: '1234567890',
        location: 'A',
        isEmergency: false,
        status: 'pending',
        ownerId: studentAId
      });

      await SupportRequest.create({
        title: 'Approved B',
        description: 'Standard approved',
        contactNumber: '1234567890',
        location: 'B',
        isEmergency: false,
        status: 'approved',
        ownerId: studentBId
      });

      const res = await request(testApp)
        .get('/api/v1/support-requests')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.data.posts.length).toBe(2);
    });

    it('should only allow student A to see their own pending requests and approved ones from student B', async () => {
      await SupportRequest.create({
        title: 'Pending A',
        description: 'Standard pending',
        contactNumber: '1234567890',
        location: 'A',
        isEmergency: false,
        status: 'pending',
        ownerId: studentAId
      });

      await SupportRequest.create({
        title: 'Pending B',
        description: 'Standard pending B',
        contactNumber: '1234567890',
        location: 'B',
        isEmergency: false,
        status: 'pending',
        ownerId: studentBId
      });

      await SupportRequest.create({
        title: 'Approved B',
        description: 'Standard approved B',
        contactNumber: '1234567890',
        location: 'B',
        isEmergency: false,
        status: 'approved',
        ownerId: studentBId
      });

      const res = await request(testApp)
        .get('/api/v1/support-requests')
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.posts.length).toBe(2);
      const titles = res.body.data.posts.map((p: any) => p.title);
      expect(titles).toContain('Pending A');
      expect(titles).toContain('Approved B');
      expect(titles).not.toContain('Pending B');
    });
  });

  describe('PUT /support-requests/:id (BOLA Check)', () => {
    it('should block Student B from editing Student A request', async () => {
      const requestDoc = await SupportRequest.create({
        title: 'A Request',
        description: 'Description A',
        contactNumber: '1234567890',
        location: 'A',
        isEmergency: false,
        status: 'pending',
        ownerId: studentAId
      });

      const res = await request(testApp)
        .put(`/api/v1/support-requests/${requestDoc._id}`)
        .set('Authorization', `Bearer ${tokenStudentB}`)
        .send({
          title: 'Modified by B'
        });

      expect(res.status).toBe(403);
    });

    it('should allow Student A to edit their own request and reset status to pending if previously approved', async () => {
      const requestDoc = await SupportRequest.create({
        title: 'A Request',
        description: 'Description A',
        contactNumber: '1234567890',
        location: 'A',
        isEmergency: false,
        status: 'approved',
        ownerId: studentAId
      });

      const res = await request(testApp)
        .put(`/api/v1/support-requests/${requestDoc._id}`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          title: 'Modified by A'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.request.status).toBe('pending');
      expect(res.body.data.request.title).toBe('Modified by A');
    });

    it('should not reset to pending if editing an emergency request (keeps approved)', async () => {
      const requestDoc = await SupportRequest.create({
        title: 'A Emergency',
        description: 'Description A',
        contactNumber: '1234567890',
        location: 'A',
        isEmergency: true,
        status: 'approved',
        ownerId: studentAId
      });

      const res = await request(testApp)
        .put(`/api/v1/support-requests/${requestDoc._id}`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          title: 'Modified Emergency'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.request.status).toBe('approved');
      expect(res.body.data.request.title).toBe('Modified Emergency');
    });
  });

  describe('PATCH approval, rejection, and resolve', () => {
    it('should allow admin to approve a support request and log audit trail', async () => {
      const requestDoc = await SupportRequest.create({
        title: 'A Request',
        description: 'Description A',
        contactNumber: '1234567890',
        location: 'A',
        isEmergency: false,
        status: 'pending',
        ownerId: studentAId
      });

      const res = await request(testApp)
        .patch(`/api/v1/support-requests/${requestDoc._id}/approve`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.data.request.status).toBe('approved');

      const log = await AuditLog.findOne({ action: 'approval', targetId: requestDoc._id });
      expect(log).not.toBeNull();
      expect(log?.actorId.toString()).toBe(adminId.toString());
    });

    it('should allow admin to reject a support request and log audit trail', async () => {
      const requestDoc = await SupportRequest.create({
        title: 'A Request',
        description: 'Description A',
        contactNumber: '1234567890',
        location: 'A',
        isEmergency: false,
        status: 'pending',
        ownerId: studentAId
      });

      const res = await request(testApp)
        .patch(`/api/v1/support-requests/${requestDoc._id}/reject`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.data.request.status).toBe('rejected');

      const log = await AuditLog.findOne({ action: 'rejection', targetId: requestDoc._id });
      expect(log).not.toBeNull();
    });

    it('should allow owner to resolve their request', async () => {
      const requestDoc = await SupportRequest.create({
        title: 'A Request',
        description: 'Description A',
        contactNumber: '1234567890',
        location: 'A',
        isEmergency: false,
        status: 'approved',
        ownerId: studentAId
      });

      const res = await request(testApp)
        .patch(`/api/v1/support-requests/${requestDoc._id}/resolve`)
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.request.status).toBe('resolved');
    });

    it('should block non-owner and non-admin from resolving the request', async () => {
      const requestDoc = await SupportRequest.create({
        title: 'A Request',
        description: 'Description A',
        contactNumber: '1234567890',
        location: 'A',
        isEmergency: false,
        status: 'approved',
        ownerId: studentAId
      });

      const res = await request(testApp)
        .patch(`/api/v1/support-requests/${requestDoc._id}/resolve`)
        .set('Authorization', `Bearer ${tokenStudentB}`);

      expect(res.status).toBe(403);
    });
  });
});
