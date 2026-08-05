require('./setup');
const request = require('supertest');
const app = require('../app');

async function registerAndLogin() {
  const credentials = { name: 'Test Parent', email: 'growth@example.com', password: 'Password1' };
  const res = await request(app).post('/api/auth/signup').send(credentials);
  return res.body.data.token;
}

describe('Children API', () => {
  test('creates a child and auto-generates vaccination schedule', async () => {
    const token = await registerAndLogin();

    const childRes = await request(app)
      .post('/api/children')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Child', gender: 'female', dateOfBirth: '2023-01-01' });

    expect(childRes.status).toBe(201);
    const childId = childRes.body.data.child._id;

    const vaxRes = await request(app)
      .get(`/api/children/${childId}/vaccinations`)
      .set('Authorization', `Bearer ${token}`);
    expect(vaxRes.status).toBe(200);
    expect(vaxRes.body.data.vaccinations.length).toBeGreaterThan(0);
  });

  test('rejects access to another user\'s child', async () => {
    const tokenA = await registerAndLogin();
    const childRes = await request(app)
      .post('/api/children')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Owned Child', gender: 'male', dateOfBirth: '2022-01-01' });
    const childId = childRes.body.data.child._id;

    const otherRes = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Other Parent', email: 'other@example.com', password: 'Password1' });
    const tokenB = otherRes.body.data.token;

    const res = await request(app)
      .get(`/api/children/${childId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
  });
});

describe('Growth API', () => {
  test('adding a growth record auto-calculates BMI and percentile', async () => {
    const token = await registerAndLogin();
    const childRes = await request(app)
      .post('/api/children')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Growth Child', gender: 'male', dateOfBirth: '2022-06-01' });
    const childId = childRes.body.data.child._id;

    const recordRes = await request(app)
      .post(`/api/children/${childId}/growth`)
      .set('Authorization', `Bearer ${token}`)
      .send({ heightCm: 85, weightKg: 12 });

    expect(recordRes.status).toBe(201);
    expect(recordRes.body.data.record.bmi).toBeCloseTo(12 / (0.85 * 0.85), 1);
    expect(recordRes.body.data.heightPercentile).toBeGreaterThanOrEqual(0);
  });

  test('rejects invalid height/weight values', async () => {
    const token = await registerAndLogin();
    const childRes = await request(app)
      .post('/api/children')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Growth Child 2', gender: 'male', dateOfBirth: '2022-06-01' });
    const childId = childRes.body.data.child._id;

    const res = await request(app)
      .post(`/api/children/${childId}/growth`)
      .set('Authorization', `Bearer ${token}`)
      .send({ heightCm: -5, weightKg: 0 });
    expect(res.status).toBe(400);
  });
});
