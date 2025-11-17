const request = require('supertest');
const { app } = require('./server');
const mongoose = require('mongoose');

describe('Internship Platform API', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/internship-platform-test');
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  describe('Health Check', () => {
    test('GET /api/health should return server status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Server is running');
    });
  });

  describe('Authentication', () => {
    test('POST /api/auth/register should create a new user', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
    });

    test('POST /api/auth/login should authenticate user', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(loginData.email);
    });

    test('POST /api/auth/register-company should create a new company', async () => {
      const companyData = {
        name: 'Test Company',
        email: 'company@example.com',
        password: 'password123',
        industry: 'Technology'
      };

      const response = await request(app)
        .post('/api/auth/register-company')
        .send(companyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.company.name).toBe(companyData.name);
    });
  });

  describe('Internships', () => {
    test('GET /api/internships should return internships list', async () => {
      const response = await request(app)
        .get('/api/internships')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.internships)).toBe(true);
    });

    test('GET /api/internships/featured should return featured internships', async () => {
      const response = await request(app)
        .get('/api/internships/featured')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.internships)).toBe(true);
    });

    test('GET /api/internships/stats should return statistics', async () => {
      const response = await request(app)
        .get('/api/internships/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stats).toBeDefined();
    });
  });

  describe('Resources', () => {
    test('GET /api/resources should return resources list', async () => {
      const response = await request(app)
        .get('/api/resources')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.resources)).toBe(true);
    });

    test('GET /api/resources/featured should return featured resources', async () => {
      const response = await request(app)
        .get('/api/resources/featured')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.resources)).toBe(true);
    });
  });

  describe('Forum', () => {
    test('GET /api/forum should return forum posts', async () => {
      const response = await request(app)
        .get('/api/forum')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.posts)).toBe(true);
    });

    test('GET /api/forum/pinned should return pinned posts', async () => {
      const response = await request(app)
        .get('/api/forum/pinned')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.posts)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('GET /api/nonexistent should return 404', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Route not found');
    });

    test('POST /api/auth/register with invalid data should return validation error', async () => {
      const invalidData = {
        firstName: '',
        email: 'invalid-email',
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });
});
