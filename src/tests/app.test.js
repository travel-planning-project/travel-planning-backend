const request = require('supertest');
const app = require('../app');

describe('Travel Planning API', () => {
  describe('Health Check', () => {
    test('GET /health should return 200 and status OK', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('message', 'Travel Planning API is running');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('404 Handler', () => {
    test('GET /nonexistent should return 404', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Route not found');
    });
  });

  describe('Authentication Routes', () => {
    test('POST /api/auth/register should require valid input', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    test('POST /api/auth/login should require valid input', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });
  });

  describe('Protected Routes', () => {
    test('GET /api/trips should require authentication', async () => {
      const response = await request(app)
        .get('/api/trips')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access denied. No token provided.');
    });

    test('GET /api/flights/search should require authentication', async () => {
      const response = await request(app)
        .get('/api/flights/search')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access denied. No token provided.');
    });

    test('GET /api/hotels/search should require authentication', async () => {
      const response = await request(app)
        .get('/api/hotels/search')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access denied. No token provided.');
    });
  });
});
