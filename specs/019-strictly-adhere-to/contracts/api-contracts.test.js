const request = require('supertest');
const app = require('../api/server.js'); // Adjust path as needed

describe('API Contracts', () => {
  test('POST /avatar/:userId - should save avatar preferences', async () => {
    const response = await request(app)
      .post('/avatar/testUser')
      .send({ color: 'blue', glowIntensity: 0.5 });
    expect(response.status).toBe(200);
  });

  test('GET /intensity - should get intensity score', async () => {
    const response = await request(app).get('/intensity');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('score');
  });

  test('POST /rest-periods - should calculate rest periods', async () => {
    const response = await request(app)
      .post('/rest-periods')
      .send({ strain: 0.8 });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('rest');
  });

  test('GET /metrics - should get user metrics', async () => {
    const response = await request(app)
      .get('/metrics')
      .set('role', 'trainer');
    expect(response.status).toBe(200);
  });

  test('POST /strain-sync - should sync strain with music', async () => {
    const response = await request(app)
      .post('/strain-sync')
      .send({ songs: ['song1'], hr: 120 });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('suggestions');
  });

  test('POST /suggest-food - should suggest food macros', async () => {
    const response = await request(app)
      .post('/suggest-food')
      .send({ carbs: 50, protein: 30, fats: 20 });
    expect(response.status).toBe(200);
  });

  test('POST /purchase - should purchase marketplace plan', async () => {
    const response = await request(app)
      .post('/purchase')
      .send({ plan: {} });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('csv');
  });

  test('GET /activity - should check activity status', async () => {
    const response = await request(app).get('/activity');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('isActive');
  });

  test('POST /chat - should send chat message', async () => {
    const response = await request(app)
      .post('/chat')
      .send({ message: 'Hello' });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('response');
  });

  test('GET /clients - should get trainer clients', async () => {
    const response = await request(app).get('/clients');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('POST /import-training - should import training data', async () => {
    const response = await request(app).post('/import-training');
    expect(response.status).toBe(200);
  });

  test('POST /csv-import - should import CSV plan', async () => {
    const response = await request(app)
      .post('/csv-import')
      .attach('csv', Buffer.from('test csv'), 'test.csv');
    expect(response.status).toBe(200);
  });

  test('GET /posts - should get social feed posts', async () => {
    const response = await request(app).get('/posts');
    expect(response.status).toBe(200);
  });

  test('POST /like/:postId/:type - should like a post element', async () => {
    const response = await request(app).post('/like/testPost/avatar');
    expect(response.status).toBe(200);
  });
});