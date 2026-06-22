import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../index';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Stop the server from connecting to the real DB during tests if MONGO_URI is set
  // mongodb-memory-server starts a local MongoDB instance in memory
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
  // Clear all database collections before each test run
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Authentication Module Tests', () => {
  const studentData = {
    fullName: 'Jane Doe',
    registrationNumber: '0701cs231026',
    branch: 'cs',
    yearOfRegistration: 2023,
    dob: '2003-05-15',
    phoneNumber: '9876543210',
    email: '0701cs231026@uecu.ac.in',
    password: 'password123'
  };

  const facultyData = {
    fullName: 'Dr. John Smith',
    phoneNumber: '9998887776',
    email: 'john.smith@uecu.ac.in',
    password: 'password123'
  };

  describe('POST /api/v1/auth/register/student', () => {
    it('should register a student successfully with correct initial status', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/student')
        .send(studentData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Verification email sent');

      const user = await User.findOne({ email: studentData.email });
      expect(user).not.toBeNull();
      expect(user?.role).toBe('student');
      expect(user?.status).toBe('pendingVerification');
      expect(user?.isEmailVerified).toBe(false);
      expect(user?.emailVerificationToken).not.toBeNull();
    });

    it('should reject student registration with invalid registration number format', async () => {
      const invalidStudent = { ...studentData, registrationNumber: 'invalid_format' };
      const res = await request(app)
        .post('/api/v1/auth/register/student')
        .send(invalidStudent);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject student registration if email does not match registration number', async () => {
      const mismatchStudent = { ...studentData, email: '0701cs231027@uecu.ac.in' };
      const res = await request(app)
        .post('/api/v1/auth/register/student')
        .send(mismatchStudent);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/register/faculty', () => {
    it('should register a faculty successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/faculty')
        .send(facultyData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const user = await User.findOne({ email: facultyData.email });
      expect(user).not.toBeNull();
      expect(user?.role).toBe('faculty');
      expect(user?.status).toBe('pendingVerification');
    });

    it('should reject faculty registration with non-college email domain', async () => {
      const invalidFaculty = { ...facultyData, email: 'john.smith@gmail.com' };
      const res = await request(app)
        .post('/api/v1/auth/register/faculty')
        .send(invalidFaculty);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/verify-email', () => {
    it('should verify email and activate student accounts directly', async () => {
      // Register
      await request(app).post('/api/v1/auth/register/student').send(studentData);
      const user = await User.findOne({ email: studentData.email }).select('+emailVerificationToken');
      const token = user?.emailVerificationToken;

      const res = await request(app)
        .get(`/api/v1/auth/verify-email?token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedUser = await User.findOne({ email: studentData.email });
      expect(updatedUser?.isEmailVerified).toBe(true);
      expect(updatedUser?.status).toBe('active');
    });

    it('should verify email and set faculty accounts to pendingApproval', async () => {
      // Register
      await request(app).post('/api/v1/auth/register/faculty').send(facultyData);
      const user = await User.findOne({ email: facultyData.email }).select('+emailVerificationToken');
      const token = user?.emailVerificationToken;

      const res = await request(app)
        .get(`/api/v1/auth/verify-email?token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedUser = await User.findOne({ email: facultyData.email });
      expect(updatedUser?.isEmailVerified).toBe(true);
      expect(updatedUser?.status).toBe('pendingApproval');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should sign in active student and return tokens', async () => {
      // Register & Verify
      await request(app).post('/api/v1/auth/register/student').send(studentData);
      const user = await User.findOne({ email: studentData.email }).select('+emailVerificationToken');
      await request(app).get(`/api/v1/auth/verify-email?token=${user?.emailVerificationToken}`);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: studentData.email,
          password: studentData.password
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.header['set-cookie']).toBeDefined(); // Refresh token cookie
    });

    it('should reject login for unverified accounts', async () => {
      await request(app).post('/api/v1/auth/register/student').send(studentData);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: studentData.email,
          password: studentData.password
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('verify your email');
    });
  });

  describe('Refresh Token Rotation & Reuse Detection', () => {
    it('should rotate tokens and then revoke all sessions if old refresh token is reused', async () => {
      // Setup active user
      await request(app).post('/api/v1/auth/register/student').send(studentData);
      const user = await User.findOne({ email: studentData.email }).select('+emailVerificationToken');
      await request(app).get(`/api/v1/auth/verify-email?token=${user?.emailVerificationToken}`);

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: studentData.email,
          password: studentData.password
        });

      const firstCookie = loginRes.header['set-cookie'][0];
      const firstRefreshToken = firstCookie.split(';')[0].split('=')[1];

      // Delay 1 second to ensure new token has a different 'iat' timestamp (JWT iat resolution is in seconds)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Perform first rotation
      const rotateRes1 = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', [`refreshToken=${firstRefreshToken}`]);

      expect(rotateRes1.status).toBe(200);
      const secondCookie = rotateRes1.header['set-cookie'][0];
      const secondRefreshToken = secondCookie.split(';')[0].split('=')[1];

      // Verify first token is no longer in the DB
      const firstInDb = await RefreshToken.findOne({ token: firstRefreshToken });
      expect(firstInDb).toBeNull();

      // Verify second token IS in the DB
      const secondInDb = await RefreshToken.findOne({ token: secondRefreshToken });
      expect(secondInDb).not.toBeNull();

      // Re-use first token (replay attack)
      const reuseRes = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', [`refreshToken=${firstRefreshToken}`]);

      expect(reuseRes.status).toBe(401);
      expect(reuseRes.body.message).toContain('Replay attack');

      // Assert all tokens for user are deleted from DB
      const activeTokensCount = await RefreshToken.countDocuments({ userId: user?._id });
      expect(activeTokensCount).toBe(0);
    });
  });
});
