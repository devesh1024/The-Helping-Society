import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../models/User';
import { LostFoundPost } from '../models/LostFoundPost';
import { RoomPost } from '../models/RoomPost';
import { MarketplacePost } from '../models/MarketplacePost';
import { Comment } from '../models/Comment';
import communityRoutes from '../routes/communityRoutes';
import { signAccessToken } from '../utils/jwt';

let mongoServer: MongoMemoryServer;

const testApp = express();
testApp.use(express.json());
testApp.use('/api/v1', communityRoutes);

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

describe('Community & Comments Module Tests', () => {
  let studentAId: mongoose.Types.ObjectId;
  let studentBId: mongoose.Types.ObjectId;
  let facultyId: mongoose.Types.ObjectId;
  let adminId: mongoose.Types.ObjectId;

  let tokenStudentA: string;
  let tokenStudentB: string;
  let tokenFaculty: string;
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

    // 4. Create Admin
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

  describe('Lost & Found Module', () => {
    it('should create a Lost & Found post successfully with active status and no deleteAt', async () => {
      const res = await request(testApp)
        .post('/api/v1/lost-found')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          title: 'Lost Keys',
          description: 'Car keys with blue keychain',
          contactNumber: '9876543210',
          location: 'Library basement'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const post = await LostFoundPost.findOne({ title: 'Lost Keys' });
      expect(post).not.toBeNull();
      expect(post?.status).toBe('active');
      expect(post?.deleteAt).toBeNull();
    });

    it('should set resolve timers (deleteAt +24h) when post is marked resolved', async () => {
      const post = await LostFoundPost.create({
        title: 'Lost Wallet',
        description: 'Black leather wallet',
        contactNumber: '9876543210',
        location: 'Cafeteria',
        ownerId: studentAId,
        status: 'active'
      });

      const res = await request(testApp)
        .patch(`/api/v1/lost-found/${post._id}/resolve`)
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await LostFoundPost.findById(post._id);
      expect(updated?.status).toBe('resolved');
      expect(updated?.resolvedAt).toBeDefined();
      expect(updated?.deleteAt).not.toBeNull();
      
      const expectedTime = Date.now() + 24 * 60 * 60 * 1000;
      expect(Math.abs(updated!.deleteAt!.getTime() - expectedTime)).toBeLessThan(5000); // 5 seconds margin
    });

    it('should block non-owners from resolving a post', async () => {
      const post = await LostFoundPost.create({
        title: 'Lost Watch',
        description: 'Silver watch',
        contactNumber: '9876543210',
        location: 'Grounds',
        ownerId: studentAId,
        status: 'active'
      });

      const res = await request(testApp)
        .patch(`/api/v1/lost-found/${post._id}/resolve`)
        .set('Authorization', `Bearer ${tokenStudentB}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Rooms Module', () => {
    it('should create a RoomPost with 7-day expiresAt TTL index', async () => {
      const res = await request(testApp)
        .post('/api/v1/rooms')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          title: 'Single Room',
          description: 'Single room flat near East Gate',
          price: 2000,
          location: 'East Gate Apartments',
          contactNumber: '9876543210'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const room = await RoomPost.findOne({ title: 'Single Room' });
      expect(room).not.toBeNull();
      expect(room?.expiresAt).toBeDefined();

      const expectedExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
      expect(Math.abs(room!.expiresAt.getTime() - expectedExpiry)).toBeLessThan(5000);
    });
  });

  describe('Marketplace Module', () => {
    it('should reject marketplace posts containing 0 images or more than 5 images', async () => {
      // 0 images
      const res0 = await request(testApp)
        .post('/api/v1/marketplace')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          title: 'Laptop Charger',
          description: '65W USB-C charger',
          price: 500,
          contactNumber: '9876543210',
          images: []
        });
      expect(res0.status).toBe(400);

      // 6 images
      const res6 = await request(testApp)
        .post('/api/v1/marketplace')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          title: 'Laptop Charger',
          description: '65W USB-C charger',
          price: 500,
          contactNumber: '9876543210',
          images: ['img1', 'img2', 'img3', 'img4', 'img5', 'img6']
        });
      expect(res6.status).toBe(400);

      // 2 images (succeeds)
      const res2 = await request(testApp)
        .post('/api/v1/marketplace')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          title: 'Laptop Charger',
          description: '65W USB-C charger',
          price: 500,
          contactNumber: '9876543210',
          images: ['img1', 'img2']
        });
      expect(res2.status).toBe(201);
    });
  });

  describe('Comments & Nesting & Cascade Deletion', () => {
    let testRoomPostId: string;

    beforeEach(async () => {
      const room = await RoomPost.create({
        title: 'BHK Flat',
        description: '2 BHK Flat near West Gate',
        price: 5000,
        location: 'West Gate St',
        contactNumber: '9876543210',
        ownerId: studentAId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      testRoomPostId = (room._id as mongoose.Types.ObjectId).toString();
    });

    it('should create plain text comment successfully, but reject HTML comments', async () => {
      // Plain text succeeds
      const res1 = await request(testApp)
        .post('/api/v1/comments')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          targetId: testRoomPostId,
          targetType: 'room',
          content: 'Is this room still available?'
        });
      expect(res1.status).toBe(201);

      // HTML comment fails
      const res2 = await request(testApp)
        .post('/api/v1/comments')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          targetId: testRoomPostId,
          targetType: 'room',
          content: 'Is this room <script>alert("Hacked")</script> available?'
        });
      expect(res2.status).toBe(400);
      expect(res2.body.message).toContain('HTML tags are prohibited');
    });

    it('should allow 1-level reply nesting, but reject nested reply-to-reply', async () => {
      // 1. Create Parent Comment
      const parent = await Comment.create({
        targetId: testRoomPostId,
        targetType: 'room',
        content: 'Parent comment content',
        ownerId: studentAId,
        parentId: null
      });

      // 2. Create Reply (Succeeds)
      const res1 = await request(testApp)
        .post(`/api/v1/comments/${parent._id}/reply`)
        .set('Authorization', `Bearer ${tokenStudentB}`)
        .send({ content: 'First-level reply' });

      expect(res1.status).toBe(201);
      const replyId = res1.body.data.reply._id;

      // 3. Create Reply-to-Reply (Fails)
      const res2 = await request(testApp)
        .post(`/api/v1/comments/${replyId}/reply`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({ content: 'Second-level reply' });

      expect(res2.status).toBe(400);
      expect(res2.body.message).toContain('Nesting depth limit exceeded');
    });

    it('should cascade delete all comments thread when target post is deleted', async () => {
      // Create parent comment
      const parent = await Comment.create({
        targetId: testRoomPostId,
        targetType: 'room',
        content: 'Parent comment',
        ownerId: studentAId
      });

      // Create reply
      await Comment.create({
        targetId: testRoomPostId,
        targetType: 'room',
        content: 'Reply comment',
        ownerId: studentBId,
        parentId: parent._id
      });

      // Assert comments exist
      const countBefore = await Comment.countDocuments({ targetId: testRoomPostId });
      expect(countBefore).toBe(2);

      // Delete RoomPost
      const deleteRes = await request(testApp)
        .delete(`/api/v1/rooms/${testRoomPostId}`)
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(deleteRes.status).toBe(200);

      // Verify all target comments are cascade deleted
      const countAfter = await Comment.countDocuments({ targetId: testRoomPostId });
      expect(countAfter).toBe(0);
    });
  });
});
