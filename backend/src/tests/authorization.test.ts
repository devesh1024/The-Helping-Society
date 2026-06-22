import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../models/User';
import { RoomPost } from '../models/RoomPost';
import { authenticateUser, authorizeOwnership, authorizeRoles } from '../middleware/authMiddleware';
import { signAccessToken } from '../utils/jwt';

let mongoServer: MongoMemoryServer;

const testApp = express();
testApp.use(express.json());

// Register test routes on testApp for testing middlewares in isolation
testApp.put(
  '/api/v1/test-routes/rooms/:id',
  authenticateUser,
  authorizeOwnership('RoomPost', 'id'),
  (req, res) => {
    res.status(200).json({ success: true, message: 'Ownership verified' });
  }
);

testApp.get(
  '/api/v1/test-routes/admin-only',
  authenticateUser,
  authorizeRoles('admin'),
  (req, res) => {
    res.status(200).json({ success: true, message: 'Admin verified' });
  }
);

// Global Error Handler for testApp
testApp.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(err.status || 500).json({ success: false, message: err.message });
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

describe('Authorization & BOLA Middleware Tests', () => {
  let studentAId: mongoose.Types.ObjectId;
  let studentBId: mongoose.Types.ObjectId;
  let adminId: mongoose.Types.ObjectId;

  let tokenStudentA: string;
  let tokenStudentB: string;
  let tokenAdmin: string;

  let testRoomPostId: string;

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

    // 3. Create Admin
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

    // 4. Create RoomPost owned by Student A
    const roomPost = await RoomPost.create({
      title: 'Cozy Room',
      description: 'Cozy study room next to campus',
      price: 1500,
      location: 'Campus West Gate',
      contactNumber: '1234567890',
      ownerId: studentAId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    testRoomPostId = (roomPost._id as mongoose.Types.ObjectId).toString();
  });

  describe('RBAC Middleware - authorizeRoles', () => {
    it('should allow admin to access admin-only endpoint', async () => {
      const res = await request(testApp)
        .get('/api/v1/test-routes/admin-only')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject student from accessing admin-only endpoint', async () => {
      const res = await request(testApp)
        .get('/api/v1/test-routes/admin-only')
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('do not have permission');
    });
  });

  describe('BOLA Prevention - authorizeOwnership', () => {
    it('should allow owner (Student A) to modify their own RoomPost', async () => {
      const res = await request(testApp)
        .put(`/api/v1/test-routes/rooms/${testRoomPostId}`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({ title: 'New Room Title' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Ownership verified');
    });

    it('should block non-owner (Student B) from modifying Student A RoomPost with 403 Forbidden', async () => {
      const res = await request(testApp)
        .put(`/api/v1/test-routes/rooms/${testRoomPostId}`)
        .set('Authorization', `Bearer ${tokenStudentB}`)
        .send({ title: 'Hacked Room Title' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('permission to modify');
    });

    it('should allow administrator to modify Student A RoomPost (bypassing ownership)', async () => {
      const res = await request(testApp)
        .put(`/api/v1/test-routes/rooms/${testRoomPostId}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ title: 'Moderated Room Title' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Ownership verified');
    });

    it('should return 404 if the resource does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(testApp)
        .put(`/api/v1/test-routes/rooms/${fakeId}`)
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 if the ID parameter is malformed', async () => {
      const res = await request(testApp)
        .put('/api/v1/test-routes/rooms/invalid-id')
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
