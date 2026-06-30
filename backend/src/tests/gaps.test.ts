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
import { OpportunityArchive } from '../models/OpportunityArchive';
import { MarketplacePost } from '../models/MarketplacePost';
import { RoomPost } from '../models/RoomPost';
import { LostFoundPost } from '../models/LostFoundPost';
import { runCleanup } from '../jobs/cleanupJob';
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
    tokenStudent = signAccessToken({ id: studentId.toString(), role: 'student', email: student.email, isCoreTeam: false });

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
    tokenContributor = signAccessToken({ id: contributorId.toString(), role: 'contributor', email: contributor.email, isCoreTeam: false });

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
    tokenOtherContributor = signAccessToken({ id: otherContributorId.toString(), role: 'contributor', email: otherContributor.email, isCoreTeam: false });

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
    tokenAdmin = signAccessToken({ id: adminId.toString(), role: 'admin', email: admin.email, isCoreTeam: true });
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

    it('should allow student to submit an opportunity request (pending approval)', async () => {
      const res = await request(testApp)
        .post('/api/v1/opportunities')
        .set('Authorization', `Bearer ${tokenStudent}`)
        .send({
          title: 'Internship Role',
          description: 'Working on React Node stack.',
          type: 'internship',
          link: 'https://intern.com/apply'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.opportunity.approvalStatus).toBe('pending');
    });

    it('should allow admin to approve opportunity request', async () => {
      const opp = await Opportunity.create({
        title: 'Pending Opportunity',
        description: 'Details for pending opportunity',
        type: 'internship',
        link: 'https://intern.com/apply',
        createdBy: studentId,
        approvalStatus: 'pending'
      });

      const res = await request(testApp)
        .patch(`/api/v1/opportunity-requests/${opp._id}/approve`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.opportunity.approvalStatus).toBe('approved');
    });

    it('should allow admin to reject opportunity request', async () => {
      const opp = await Opportunity.create({
        title: 'Pending Opportunity 2',
        description: 'Details for pending opportunity 2',
        type: 'internship',
        link: 'https://intern.com/apply',
        createdBy: studentId,
        approvalStatus: 'pending'
      });

      const res = await request(testApp)
        .patch(`/api/v1/opportunity-requests/${opp._id}/reject`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.opportunity.approvalStatus).toBe('rejected');
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

    it('should reject opportunity creation if deadline is in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const res = await request(testApp)
        .post('/api/v1/opportunities')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          title: 'Past Deadline Role',
          description: 'Working on React Node stack.',
          type: 'internship',
          link: 'https://intern.com/apply',
          deadline: pastDate.toISOString()
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation Failed');
    });

    it('should allow opportunity creation if deadline is today or in the future', async () => {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const resToday = await request(testApp)
        .post('/api/v1/opportunities')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          title: 'Today Deadline Role',
          description: 'Working on React Node stack.',
          type: 'internship',
          link: 'https://intern.com/apply',
          deadline: today.toISOString()
        });

      expect(resToday.status).toBe(201);

      const resFuture = await request(testApp)
        .post('/api/v1/opportunities')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          title: 'Future Deadline Role',
          description: 'Working on React Node stack.',
          type: 'internship',
          link: 'https://intern.com/apply',
          deadline: futureDate.toISOString()
        });

      expect(resFuture.status).toBe(201);
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

  describe('Anonymous Support Requests API', () => {
    let anonymousReq: any;
    let peerStudentId: mongoose.Types.ObjectId;
    let tokenPeerStudent: string;

    beforeEach(async () => {
      const peerStudent = await User.create({
        fullName: 'Peer Student',
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
      peerStudentId = peerStudent._id as mongoose.Types.ObjectId;
      tokenPeerStudent = signAccessToken({ id: peerStudentId.toString(), role: 'student', email: peerStudent.email, isCoreTeam: false });

      anonymousReq = await SupportRequest.create({
        title: 'Anonymous helper needed',
        description: 'Need confidential food supplies.',
        contactNumber: '1112223333',
        location: 'Hostel 4',
        isEmergency: true,
        anonymous: true,
        status: 'approved',
        ownerId: studentId
      });
    });

    it('should sanitize creator details for other users but keep them for creator and admin', async () => {
      // 1. Peer student gets the request
      const peerRes = await request(testApp)
        .get(`/api/v1/support-requests/${anonymousReq._id}`)
        .set('Authorization', `Bearer ${tokenPeerStudent}`);

      expect(peerRes.status).toBe(200);
      expect(peerRes.body.data.request.ownerId._id).toBe('anonymous');
      expect(peerRes.body.data.request.ownerId.fullName).toBe('Anonymous');
      expect(peerRes.body.data.request.contactNumber).toBeUndefined();
      expect(peerRes.body.data.request.location).toBeUndefined();

      // 2. Creator gets the request
      const creatorRes = await request(testApp)
        .get(`/api/v1/support-requests/${anonymousReq._id}`)
        .set('Authorization', `Bearer ${tokenStudent}`);

      expect(creatorRes.status).toBe(200);
      expect(creatorRes.body.data.request.ownerId._id).toBe(studentId.toString());
      expect(creatorRes.body.data.request.ownerId.fullName).toBe('Test Student');

      // 3. Admin gets the request
      const adminRes = await request(testApp)
        .get(`/api/v1/support-requests/${anonymousReq._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(adminRes.status).toBe(200);
      expect(adminRes.body.data.request.ownerId._id).toBe(studentId.toString());
    });

    it('should allow creator and admin to reply but deny others', async () => {
      // 1. Creator replies
      const creatorReply = await request(testApp)
        .post(`/api/v1/support-requests/${anonymousReq._id}/replies`)
        .set('Authorization', `Bearer ${tokenStudent}`)
        .send({ message: 'Creator reply' });
      expect(creatorReply.status).toBe(201);

      // 2. Admin replies
      const adminReply = await request(testApp)
        .post(`/api/v1/support-requests/${anonymousReq._id}/replies`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ message: 'Admin reply' });
      expect(adminReply.status).toBe(201);

      // 3. Peer replies (should be forbidden)
      const peerReply = await request(testApp)
        .post(`/api/v1/support-requests/${anonymousReq._id}/replies`)
        .set('Authorization', `Bearer ${tokenPeerStudent}`)
        .send({ message: 'Peer reply' });
      expect(peerReply.status).toBe(403);
    });
  });

  describe('Sprint 2 Auto-Delete & Archiving Tests', () => {
    let mockUser: any;
    let mockAdmin: any;
    let tokenUser: string;
    let tokenAdminUser: string;

    beforeEach(async () => {
      await Opportunity.deleteMany({});
      await OpportunityArchive.deleteMany({});
      await MarketplacePost.deleteMany({});
      await RoomPost.deleteMany({});
      await LostFoundPost.deleteMany({});
      await SupportRequest.deleteMany({});

      mockUser = await User.create({
        fullName: 'Test Contributor',
        email: 'contrib@test.com',
        password: 'password123',
        role: 'contributor',
        status: 'active',
        isEmailVerified: true,
        organizationName: 'Test Org',
        roleInOrganization: 'Developer'
      });
      tokenUser = signAccessToken({ id: mockUser._id.toString(), role: mockUser.role, email: mockUser.email, isCoreTeam: false });

      mockAdmin = await User.create({
        fullName: 'Test Admin',
        email: 'adm@test.com',
        password: 'password123',
        role: 'admin',
        status: 'active',
        isEmailVerified: true
      });
      tokenAdminUser = signAccessToken({ id: mockAdmin._id.toString(), role: mockAdmin.role, email: mockAdmin.email, isCoreTeam: true });
    });

    it('should archive opportunity manually when deleted by owner/creator', async () => {
      const opp = await Opportunity.create({
        title: 'Software Dev',
        description: 'React developer job',
        type: 'job',
        link: 'https://test.com/apply',
        createdBy: mockUser._id,
        company: 'Innovate LLC'
      });

      const res = await request(testApp)
        .delete(`/api/v1/opportunities/${opp._id}`)
        .set('Authorization', `Bearer ${tokenUser}`);

      expect(res.status).toBe(200);

      const foundOpp = await Opportunity.findById(opp._id);
      expect(foundOpp).toBeNull();

      const archives = await OpportunityArchive.find({ 'originalOpportunity._id': opp._id });
      expect(archives.length).toBe(1);
      expect(archives[0].deletionReason).toBe('manual_user');
      expect(archives[0].uploaderName).toBe('Test Contributor');
      expect(archives[0].uploaderRole).toBe('contributor');
      expect(archives[0].companyName).toBe('Innovate LLC');
    });

    it('should archive opportunity manually when deleted by admin', async () => {
      const opp = await Opportunity.create({
        title: 'React Dev',
        description: 'React developer job',
        type: 'job',
        link: 'https://test.com/apply',
        createdBy: mockUser._id,
        company: 'Innovate LLC'
      });

      const res = await request(testApp)
        .delete(`/api/v1/opportunities/${opp._id}`)
        .set('Authorization', `Bearer ${tokenAdminUser}`);

      expect(res.status).toBe(200);

      const archives = await OpportunityArchive.find({ 'originalOpportunity._id': opp._id });
      expect(archives.length).toBe(1);
      expect(archives[0].deletionReason).toBe('manual_admin');
    });

    it('should run cleanup job and auto-expire posts older than 30 days while archiving opportunities', async () => {
      const freshOpp = await Opportunity.create({
        title: 'Fresh Dev',
        description: 'React dev job',
        type: 'job',
        link: 'https://test.com/apply',
        createdBy: mockUser._id,
        company: 'Innovate LLC'
      });

      const oldOpp = await Opportunity.create({
        title: 'Old Dev',
        description: 'React dev job',
        type: 'job',
        link: 'https://test.com/apply',
        createdBy: mockUser._id,
        company: 'Old LLC'
      });
      await Opportunity.collection.updateOne({ _id: oldOpp._id }, { $set: { createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) } });

      const oldMarketplace = await MarketplacePost.create({
        title: 'Old Marketplace',
        description: 'Old item',
        price: 100,
        images: ['img1.png'],
        contactNumber: '1234567890',
        ownerId: mockUser._id
      });
      await MarketplacePost.collection.updateOne({ _id: oldMarketplace._id }, { $set: { createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) } });

      const oldRoom = await RoomPost.create({
        title: 'Old Room',
        description: 'Old room description',
        price: 1000,
        location: 'West Gate',
        contactNumber: '1234567890',
        ownerId: mockUser._id,
        expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      });
      await RoomPost.collection.updateOne({ _id: oldRoom._id }, { $set: { createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) } });

      const oldLostFound = await LostFoundPost.create({
        title: 'Old Lost Found',
        description: 'Old lost post',
        location: 'East Gate',
        ownerId: mockUser._id
      });
      await LostFoundPost.collection.updateOne({ _id: oldLostFound._id }, { $set: { createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) } });

      const oldSupport = await SupportRequest.create({
        title: 'Old Support',
        description: 'Old support request description',
        ownerId: mockUser._id
      });
      await SupportRequest.collection.updateOne({ _id: oldSupport._id }, { $set: { createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) } });

      await runCleanup();

      expect(await Opportunity.findById(oldOpp._id)).toBeNull();
      expect(await MarketplacePost.findById(oldMarketplace._id)).toBeNull();
      expect(await RoomPost.findById(oldRoom._id)).toBeNull();
      expect(await LostFoundPost.findById(oldLostFound._id)).toBeNull();
      expect(await SupportRequest.findById(oldSupport._id)).toBeNull();

      expect(await Opportunity.findById(freshOpp._id)).not.toBeNull();

      const archives = await OpportunityArchive.find({ 'originalOpportunity._id': oldOpp._id });
      expect(archives.length).toBe(1);
      expect(archives[0].deletionReason).toBe('auto_expired');
    });

    it('should not delete live opportunity if archiving fails', async () => {
      const opp = await Opportunity.create({
        title: 'Fail Dev',
        description: 'React dev job',
        type: 'job',
        link: 'https://test.com/apply',
        createdBy: mockUser._id,
        company: 'Innovate LLC'
      });

      const originalCreate = OpportunityArchive.create;
      OpportunityArchive.create = async () => {
        throw new Error('Database constraint violation or network failure');
      };

      try {
        await request(testApp)
          .delete(`/api/v1/opportunities/${opp._id}`)
          .set('Authorization', `Bearer ${tokenUser}`);
      } catch (err) {}

      OpportunityArchive.create = originalCreate;

      const foundOpp = await Opportunity.findById(opp._id);
      expect(foundOpp).not.toBeNull();
    });

    describe('Sprint 3 Support Deletion Permissions', () => {
      let mockStudent: any;
      let tokenStudent: string;

      beforeEach(async () => {
        mockStudent = await User.create({
          fullName: 'Test Student',
          email: '0701cs231011@uecu.ac.in',
          password: 'password123',
          role: 'student',
          status: 'active',
          isEmailVerified: true,
          registrationNumber: '0701cs231011',
          branch: 'cs',
          yearOfRegistration: 2023,
          dob: new Date('2003-05-15'),
          phoneNumber: '9876543211'
        });
        tokenStudent = signAccessToken({ id: mockStudent._id.toString(), role: mockStudent.role, email: mockStudent.email, isCoreTeam: false });
      });

      it('should allow creator to delete their own support request', async () => {
        const reqDoc = await SupportRequest.create({
          title: 'Need help',
          description: 'Need help with rent',
          ownerId: mockStudent._id,
          status: 'pending'
        });

        const res = await request(testApp)
          .delete(`/api/v1/support-requests/${reqDoc._id}`)
          .set('Authorization', `Bearer ${tokenStudent}`);

        expect(res.status).toBe(200);
        expect(await SupportRequest.findById(reqDoc._id)).toBeNull();
      });

      it('should allow admin to delete any support request', async () => {
        const reqDoc = await SupportRequest.create({
          title: 'Need help',
          description: 'Need help with rent',
          ownerId: mockStudent._id,
          status: 'approved'
        });

        const res = await request(testApp)
          .delete(`/api/v1/support-requests/${reqDoc._id}`)
          .set('Authorization', `Bearer ${tokenAdminUser}`);

        expect(res.status).toBe(200);
        expect(await SupportRequest.findById(reqDoc._id)).toBeNull();
      });

      it('should prevent other users from deleting support requests', async () => {
        const otherUser = await User.create({
          fullName: 'Other User',
          email: 'other@test.com',
          password: 'password123',
          role: 'student',
          status: 'active',
          isEmailVerified: true,
          registrationNumber: '0701cs231005',
          branch: 'cs',
          yearOfRegistration: 2023,
          dob: new Date('2003-05-15'),
          phoneNumber: '9876543299'
        });
        const tokenOther = signAccessToken({ id: otherUser._id.toString(), role: otherUser.role, email: otherUser.email, isCoreTeam: false });

        const reqDoc = await SupportRequest.create({
          title: 'Need help',
          description: 'Need help with rent',
          ownerId: mockStudent._id,
          status: 'pending'
        });

        const res = await request(testApp)
          .delete(`/api/v1/support-requests/${reqDoc._id}`)
          .set('Authorization', `Bearer ${tokenOther}`);

        expect(res.status).toBe(403);
        expect(await SupportRequest.findById(reqDoc._id)).not.toBeNull();
      });
    });
  });
});
