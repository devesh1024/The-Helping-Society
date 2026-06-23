import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../models/User';
import { Opportunity } from '../models/Opportunity';
import { SupportRequest } from '../models/SupportRequest';
import { SupportReply } from '../models/SupportReply';
import opportunityRoutes from '../routes/opportunityRoutes';
import userRoutes from '../routes/userRoutes';
import supportRoutes from '../routes/supportRoutes';
import { signAccessToken } from '../utils/jwt';

let mongoServer: MongoMemoryServer;

const testApp = express();
testApp.use(express.json());
testApp.use('/api/v1', opportunityRoutes);
testApp.use('/api/v1', userRoutes);
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

describe('Backend Contract Gaps Resolution Tests', () => {
  let studentId: mongoose.Types.ObjectId;
  let contributorId: mongoose.Types.ObjectId;
  let otherContributorId: mongoose.Types.ObjectId;
  let adminId: mongoose.Types.ObjectId;

  let tokenStudent: string;
  let tokenContributor: string;
  let tokenOtherContributor: string;
  let tokenAdmin: string;

  beforeEach(async () => {
    // Create Student
    const student = await User.create({
      fullName: 'Test Student',
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
    studentId = student._id as mongoose.Types.ObjectId;
    tokenStudent = signAccessToken({ id: studentId.toString(), role: 'student', email: student.email });

    // Create Contributor A
    const contributor = await User.create({
      fullName: 'Test Contributor',
      email: 'contributor@example.com',
      password: 'password123',
      role: 'contributor',
      status: 'active',
      isEmailVerified: true,
      organizationName: 'Society',
      roleInOrganization: 'Lead'
    });
    contributorId = contributor._id as mongoose.Types.ObjectId;
    tokenContributor = signAccessToken({ id: contributorId.toString(), role: 'contributor', email: contributor.email });

    // Create Contributor B
    const otherContributor = await User.create({
      fullName: 'Test Contributor B',
      email: 'contributorB@example.com',
      password: 'password123',
      role: 'contributor',
      status: 'active',
      isEmailVerified: true,
      organizationName: 'Society B',
      roleInOrganization: 'Staff'
    });
    otherContributorId = otherContributor._id as mongoose.Types.ObjectId;
    tokenOtherContributor = signAccessToken({ id: otherContributorId.toString(), role: 'contributor', email: otherContributor.email });

    // Create Admin
    const admin = await User.create({
      fullName: 'Test Admin',
      email: 'admin@uecu.ac.in',
      password: 'password123',
      role: 'admin',
      status: 'active',
      isEmailVerified: true
    });
    adminId = admin._id as mongoose.Types.ObjectId;
    tokenAdmin = signAccessToken({ id: adminId.toString(), role: 'admin', email: admin.email });
  });

  // ==========================================
  // 1. Opportunities Module Tests
  // ==========================================
  describe('Opportunities API', () => {
    it('should allow contributor or admin to create an opportunity', async () => {
      const res = await request(testApp)
        .post('/api/v1/opportunities')
        .set('Authorization', `Bearer ${tokenContributor}`)
        .send({
          title: 'Internship Role',
          description: 'Working on React Node stack.',
          type: 'internship',
          link: 'https://intern.com/apply'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.opportunity.title).toBe('Internship Role');
    });

    it('should reject opportunity creation from students', async () => {
      const res = await request(testApp)
        .post('/api/v1/opportunities')
        .set('Authorization', `Bearer ${tokenStudent}`)
        .send({
          title: 'Internship Role',
          description: 'Working on React Node stack.',
          type: 'internship',
          link: 'https://intern.com/apply'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow all users to retrieve opportunities', async () => {
      await Opportunity.create({
        title: 'intern job',
        description: 'details here',
        type: 'internship',
        link: 'https://example.com',
        createdBy: contributorId
      });

      const res = await request(testApp)
        .get('/api/v1/opportunities')
        .set('Authorization', `Bearer ${tokenStudent}`);

      expect(res.status).toBe(200);
      expect(res.body.data.opportunities.length).toBe(1);
    });

    it('should allow only owner or admin to update/delete an opportunity', async () => {
      const opp = await Opportunity.create({
        title: 'hackathon',
        description: 'code and win',
        type: 'hackathon',
        link: 'https://hack.com',
        createdBy: contributorId
      });

      // Contributor B (not owner) should be rejected
      const failRes = await request(testApp)
        .put(`/api/v1/opportunities/${opp._id}`)
        .set('Authorization', `Bearer ${tokenOtherContributor}`)
        .send({ title: 'hacked hackathon' });

      expect(failRes.status).toBe(403);

      // Owner should be allowed
      const successRes = await request(testApp)
        .put(`/api/v1/opportunities/${opp._id}`)
        .set('Authorization', `Bearer ${tokenContributor}`)
        .send({ title: 'updated hackathon' });

      expect(successRes.status).toBe(200);
      expect(successRes.body.data.opportunity.title).toBe('updated hackathon');

      // Admin should be allowed to delete
      const delRes = await request(testApp)
        .delete(`/api/v1/opportunities/${opp._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(delRes.status).toBe(200);

      const count = await Opportunity.countDocuments({});
      expect(count).toBe(0);
    });
  });

  // ==========================================
  // 2. User Profile Update Tests
  // ==========================================
  describe('User Profile Updates', () => {
    it('should allow user to update permitted fields', async () => {
      const res = await request(testApp)
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${tokenStudent}`)
        .send({
          fullName: 'Updated Student Name',
          phoneNumber: '9876543211',
          branch: 'ec',
          yearOfRegistration: 2024
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.fullName).toBe('Updated Student Name');
      expect(res.body.data.user.branch).toBe('ec');
    });

    it('should block users from updating restricted fields (privilege escalation prevention)', async () => {
      const res = await request(testApp)
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${tokenStudent}`)
        .send({
          role: 'admin',
          status: 'active'
        });

      expect(res.status).toBe(200); // Route passes validation, but service must drop these fields
      
      const dbUser = await User.findById(studentId);
      expect(dbUser?.role).toBe('student'); // remains student
    });
  });

  // ==========================================
  // 3. Support Request Replies Tests
  // ==========================================
  describe('Support Request Replies API', () => {
    let reqDoc: any;

    beforeEach(async () => {
      reqDoc = await SupportRequest.create({
        title: 'Emergency helper needed',
        description: 'Need blood donor.',
        contactNumber: '9999999999',
        location: 'Block A',
        isEmergency: true,
        status: 'approved',
        ownerId: studentId
      });
    });

    it('should allow owner or admin to post and view replies', async () => {
      const postRes = await request(testApp)
        .post(`/api/v1/support-requests/${reqDoc._id}/replies`)
        .set('Authorization', `Bearer ${tokenStudent}`)
        .send({ message: 'I can help!' });

      expect(postRes.status).toBe(201);
      expect(postRes.body.data.reply.message).toBe('I can help!');

      // Get replies (owner)
      const getRes = await request(testApp)
        .get(`/api/v1/support-requests/${reqDoc._id}/replies`)
        .set('Authorization', `Bearer ${tokenStudent}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.replies.length).toBe(1);

      // Get replies (admin)
      const getAdminRes = await request(testApp)
        .get(`/api/v1/support-requests/${reqDoc._id}/replies`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(getAdminRes.status).toBe(200);
      expect(getAdminRes.body.data.replies.length).toBe(1);
    });

    it('should deny unauthorized users from posting or viewing replies', async () => {
      // Unauthorized poster (Contributor A)
      const postRes = await request(testApp)
        .post(`/api/v1/support-requests/${reqDoc._id}/replies`)
        .set('Authorization', `Bearer ${tokenContributor}`)
        .send({ message: 'Hack reply' });

      expect(postRes.status).toBe(403);

      // Unauthorized viewer
      const getRes = await request(testApp)
        .get(`/api/v1/support-requests/${reqDoc._id}/replies`)
        .set('Authorization', `Bearer ${tokenContributor}`);

      expect(getRes.status).toBe(403);
    });
  });
});
