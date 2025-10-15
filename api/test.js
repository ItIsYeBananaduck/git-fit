const request = require('supertest');
const app = require('./server');

describe('API Tests', () => {
  it('GET /intensity returns score', async () => {
    const res = await request(app).get('/intensity');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('score');
  });

  it('POST /avatar/:userId saves avatar', async () => {
    const res = await request(app)
      .post('/avatar/testuser')
      .send({ color: '#ff0000', glowIntensity: 50 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /rest-periods returns rest time', async () => {
    const res = await request(app)
      .post('/rest-periods')
      .send({ strain: 8 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('rest');
  });
});