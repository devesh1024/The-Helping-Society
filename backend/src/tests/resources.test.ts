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
import { AuditLog } from '../models/AuditLog';
import resourceRoutes from '../routes/resourceRoutes';
import { signAccessToken } from '../utils/jwt';

let mongoServer: MongoMemoryServer;

const testApp = express();
testApp.use(express.json());
testApp.use('/api/v1', resourceRoutes);

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

describe('Resources Hub Module Tests', () => {
  let studentAId: mongoose.Types.ObjectId;
  let studentBId: mongoose.Types.ObjectId;
  let facultyId: mongoose.Types.ObjectId;
  let contributorId: mongoose.Types.ObjectId;
  let adminId: mongoose.Types.ObjectId;

  let tokenStudentA: string;
  let tokenStudentB: string;
  let tokenFaculty: string;
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
      phoneNumber: '9876543210'
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
      phoneNumber: '9876543211'
    });
    studentBId = studentB._id as mongoose.Types.ObjectId;
    tokenStudentB = signAccessToken({
      id: studentBId.toString(),
      role: 'student',
      email: studentB.email,
      isCoreTeam: false
    });

    // 3. Create Faculty
    const faculty = await User.create({
      fullName: 'Faculty User',
      email: 'faculty@uecu.ac.in',
      password: 'password123',
      role: 'faculty',
      status: 'active',
      isEmailVerified: true,
      phoneNumber: '9988776655'
    });
    facultyId = faculty._id as mongoose.Types.ObjectId;
    tokenFaculty = signAccessToken({
      id: facultyId.toString(),
      role: 'faculty',
      email: faculty.email,
      isCoreTeam: false
    });

    // 4. Create Contributor
    const contributor = await User.create({
      fullName: 'Contributor User',
      email: 'recruiter@company.com',
      password: 'password123',
      role: 'contributor',
      status: 'active',
      isEmailVerified: true,
      organizationName: 'Google',
      roleInOrganization: 'Tech Lead'
    });
    contributorId = contributor._id as mongoose.Types.ObjectId;
    tokenContributor = signAccessToken({
      id: contributorId.toString(),
      role: 'contributor',
      email: contributor.email,
      isCoreTeam: false
    });

    // 5. Create Admin
    const admin = await User.create({
      fullName: 'Admin User',
      email: 'admin@uecu.ac.in',
      password: 'password123',
      role: 'admin',
      status: 'active',
      isEmailVerified: true
    });
    adminId = admin._id as mongoose.Types.ObjectId;
    tokenAdmin = signAccessToken({
      id: adminId.toString(),
      role: 'admin',
      email: admin.email,
      isCoreTeam: false
    });
  });

  describe('Resource Upload Workflows', () => {
    it('should submit an upload request for students, placing it in resourcerequests', async () => {
      const res = await request(testApp)
        .post('/api/v1/resources/request')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .attach('file', Buffer.from('PDF Content Dummy'), 'document.pdf')
        .field('title', 'Advanced Calculus')
        .field('description', 'Calculus notes by Prof. Dave')
        .field('category', 'notes');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('pending administrator approval');

      // Verify request is saved in the database
      const requestDoc = await ResourceRequest.findOne({ title: 'Advanced Calculus' });
      expect(requestDoc).not.toBeNull();
      expect(requestDoc?.status).toBe('pending');
      expect(requestDoc?.uploadedBy.toString()).toBe(studentAId.toString());
      expect(requestDoc?.file.fileType).toBe('pdf');
    });

    it('should allow faculty to upload directly, placing it in resources', async () => {
      const res = await request(testApp)
        .post('/api/v1/resources')
        .set('Authorization', `Bearer ${tokenFaculty}`)
        .attach('file', Buffer.from('PPT Content Dummy'), 'slides.ppt')
        .field('title', 'Compiler Design Slides')
        .field('description', 'Lecture slides for CD course')
        .field('category', 'syllabus');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const resource = await Resource.findOne({ title: 'Compiler Design Slides' });
      expect(resource).not.toBeNull();
      expect(resource?.uploadedBy.toString()).toBe(facultyId.toString());
    });

    it('should block contributors and guests from uploading resources', async () => {
      const res = await request(testApp)
        .post('/api/v1/resources')
        .set('Authorization', `Bearer ${tokenContributor}`)
        .attach('file', Buffer.from('PDF Dummy'), 'cv.pdf')
        .field('title', 'Hiring Guide')
        .field('description', 'Contributor material')
        .field('category', 'study_material');

      expect(res.status).toBe(403);
    });
  });

  describe('Resource Viewing Access Control', () => {
    let testResourceId: string;

    beforeEach(async () => {
      // Create a resource
      const res = await Resource.create({
        title: 'Mock Book',
        description: 'Mock Book Description',
        category: 'books',
        file: {
          publicId: 'mock_pub',
          secureUrl: 'https://cloudinary.com/mock.pdf',
          fileType: 'pdf',
          fileSize: 1024
        },
        uploadedBy: facultyId,
        likesCount: 0
      });
      testResourceId = (res._id as mongoose.Types.ObjectId).toString();
    });

    it('should allow student to view paginated resources list', async () => {
      const res = await request(testApp)
        .get('/api/v1/resources')
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.resources).toBeDefined();
      expect(res.body.data.resources.length).toBe(1);
    });

    it('should block contributor from viewing resources list', async () => {
      const res = await request(testApp)
        .get('/api/v1/resources')
        .set('Authorization', `Bearer ${tokenContributor}`);

      expect(res.status).toBe(403);
    });

    it('should block guest (no token) from viewing resources', async () => {
      const res = await request(testApp)
        .get('/api/v1/resources');

      expect(res.status).toBe(401);
    });
  });

  describe('Resource Requests Approvals (Admin)', () => {
    let testRequestId: string;

    beforeEach(async () => {
      const reqDoc = await ResourceRequest.create({
        title: 'Calculus PYQ',
        description: 'Last 5 years papers',
        category: 'pyqs',
        file: {
          publicId: 'calc_pyq',
          secureUrl: 'https://cloudinary.com/calc.pdf',
          fileType: 'pdf',
          fileSize: 2048
        },
        uploadedBy: studentAId,
        status: 'pending'
      });
      testRequestId = (reqDoc._id as mongoose.Types.ObjectId).toString();
    });

    it('should allow admin to approve resource request, promoting it to Resources collection', async () => {
      const res = await request(testApp)
        .patch(`/api/v1/resource-requests/${testRequestId}/approve`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify request status is approved
      const updatedReq = await ResourceRequest.findById(testRequestId);
      expect(updatedReq?.status).toBe('approved');

      // Verify resource exists in resources collection
      const resource = await Resource.findOne({ title: 'Calculus PYQ' });
      expect(resource).not.toBeNull();
      expect(resource?.uploadedBy.toString()).toBe(studentAId.toString());

      // Verify audit log record exists
      const log = await AuditLog.findOne({ action: 'approval', targetId: testRequestId });
      expect(log).not.toBeNull();
      expect(log?.actorId.toString()).toBe(adminId.toString());
    });

    it('should allow admin to reject resource request', async () => {
      const res = await request(testApp)
        .patch(`/api/v1/resource-requests/${testRequestId}/reject`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedReq = await ResourceRequest.findById(testRequestId);
      expect(updatedReq?.status).toBe('rejected');

      // Assert no Resource was created
      const resource = await Resource.findOne({ title: 'Calculus PYQ' });
      expect(resource).toBeNull();
    });
  });

  describe('Likes Toggle System', () => {
    let testResourceId: string;

    beforeEach(async () => {
      const res = await Resource.create({
        title: 'Mock Study Material',
        description: 'Material description',
        category: 'study_material',
        file: {
          publicId: 'mat_pub',
          secureUrl: 'https://cloudinary.com/mat.pdf',
          fileType: 'pdf',
          fileSize: 1024
        },
        uploadedBy: facultyId,
        likesCount: 0
      });
      testResourceId = (res._id as mongoose.Types.ObjectId).toString();
    });

    it('should toggle likes correctly, updating likesCount', async () => {
      // 1. Add Like
      const likeRes = await request(testApp)
        .post(`/api/v1/resources/${testResourceId}/like`)
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(likeRes.status).toBe(200);
      expect(likeRes.body.data.liked).toBe(true);
      expect(likeRes.body.data.likesCount).toBe(1);

      // 2. Remove Like
      const unlikeRes = await request(testApp)
        .post(`/api/v1/resources/${testResourceId}/like`)
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(unlikeRes.status).toBe(200);
      expect(unlikeRes.body.data.liked).toBe(false);
      expect(unlikeRes.body.data.likesCount).toBe(0);
    });
  });
});
