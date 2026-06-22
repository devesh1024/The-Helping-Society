import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { GlobalNotificationRead } from '../models/GlobalNotificationRead';
import notificationRoutes from '../routes/notificationRoutes';
import { signAccessToken } from '../utils/jwt';

let mongoServer: MongoMemoryServer;

const testApp = express();
testApp.use(express.json());
testApp.use('/api/v1', notificationRoutes);

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

describe('Notification Module Tests', () => {
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

  describe('POST /notifications', () => {
    it('should allow admin to create a global notification', async () => {
      const res = await request(testApp)
        .post('/api/v1/notifications')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          title: 'Exam Notice',
          message: 'End semester exams start next week.',
          type: 'global'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notification.recipientId).toBeNull();
    });

    it('should block non-admins from creating a notification', async () => {
      const res = await request(testApp)
        .post('/api/v1/notifications')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          title: 'Cheat Notice',
          message: 'Free marks for everyone.',
          type: 'global'
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /notifications', () => {
    it('should retrieve personal and global notifications, mapping read statuses correctly', async () => {
      // Create a global notification
      const globalNote = await Notification.create({
        title: 'Global Notice',
        message: 'Holiday tomorrow.',
        type: 'global',
        recipientId: null
      });

      // Create a personal notification for Student A
      await Notification.create({
        title: 'Personal A',
        message: 'Your request was approved.',
        type: 'resourceApproved',
        recipientId: studentAId
      });

      // Create a personal notification for Student B
      await Notification.create({
        title: 'Personal B',
        message: 'Your request was rejected.',
        type: 'resourceRejected',
        recipientId: studentBId
      });

      // Student A queries notifications
      const resA = await request(testApp)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(resA.status).toBe(200);
      expect(resA.body.data.notifications.length).toBe(2);
      
      const titlesA = resA.body.data.notifications.map((n: any) => n.title);
      expect(titlesA).toContain('Global Notice');
      expect(titlesA).toContain('Personal A');
      expect(titlesA).not.toContain('Personal B');

      // Both should show as unread initially
      resA.body.data.notifications.forEach((n: any) => {
        expect(n.isRead).toBe(false);
      });
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('should mark a personal notification as read in-place', async () => {
      const personalNote = await Notification.create({
        title: 'Personal A',
        message: 'Approved.',
        type: 'resourceApproved',
        recipientId: studentAId
      });

      const res = await request(testApp)
        .patch(`/api/v1/notifications/${personalNote._id}/read`)
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notification.isRead).toBe(true);

      const dbNote = await Notification.findById(personalNote._id);
      expect(dbNote?.isRead).toBe(true);
    });

    it('should mark a global notification as read by creating a GlobalNotificationRead entry', async () => {
      const globalNote = await Notification.create({
        title: 'Global Alert',
        message: 'Fire drill.',
        type: 'global',
        recipientId: null
      });

      const res = await request(testApp)
        .patch(`/api/v1/notifications/${globalNote._id}/read`)
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(res.status).toBe(200);

      // Verify read entry in database
      const readRecord = await GlobalNotificationRead.findOne({
        userId: studentAId,
        notificationId: globalNote._id
      });
      expect(readRecord).not.toBeNull();

      // Verify Student A sees it as read now
      const resA = await request(testApp)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${tokenStudentA}`);
      
      const globalA = resA.body.data.notifications.find((n: any) => n.title === 'Global Alert');
      expect(globalA.isRead).toBe(true);

      // Verify Student B still sees it as unread
      const resB = await request(testApp)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${tokenStudentB}`);
      
      const globalB = resB.body.data.notifications.find((n: any) => n.title === 'Global Alert');
      expect(globalB.isRead).toBe(false);
    });

    it('should block Student B from marking Student A personal notification as read', async () => {
      const personalNote = await Notification.create({
        title: 'Personal A',
        message: 'Approved.',
        type: 'resourceApproved',
        recipientId: studentAId
      });

      const res = await request(testApp)
        .patch(`/api/v1/notifications/${personalNote._id}/read`)
        .set('Authorization', `Bearer ${tokenStudentB}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /notifications/read-all', () => {
    it('should mark all personal and global notifications as read in bulk', async () => {
      // Create a global notification
      const globalNote = await Notification.create({
        title: 'Global Notice',
        message: 'Holiday tomorrow.',
        type: 'global',
        recipientId: null
      });

      // Create a personal notification
      await Notification.create({
        title: 'Personal A',
        message: 'Approved.',
        type: 'resourceApproved',
        recipientId: studentAId
      });

      const res = await request(testApp)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify both show as read for Student A
      const resA = await request(testApp)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${tokenStudentA}`);

      resA.body.data.notifications.forEach((n: any) => {
        expect(n.isRead).toBe(true);
      });
    });
  });
});
