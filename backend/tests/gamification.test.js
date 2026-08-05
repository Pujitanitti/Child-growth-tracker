require('./setup');
const request = require('supertest');
const app = require('../app');

async function registerAndLogin(email = 'gamify@example.com') {
  const res = await request(app).post('/api/auth/signup').send({ name: 'Test Parent', email, password: 'Password1' });
  return res.body.data.token;
}

async function createChild(token) {
  const res = await request(app)
    .post('/api/children')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Test Child', gender: 'male', dateOfBirth: '2023-01-01' });
  return res.body.data.child._id;
}

describe('Memory Timeline API', () => {
  test('adds and lists a memory', async () => {
    const token = await registerAndLogin();
    const childId = await createChild(token);

    const createRes = await request(app)
      .post(`/api/children/${childId}/memories`)
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'First steps')
      .field('type', 'first-steps');
    expect(createRes.status).toBe(201);

    const listRes = await request(app)
      .get(`/api/children/${childId}/memories`)
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.body.data.memories.length).toBe(1);
  });
});

describe('Badges API', () => {
  test('returns all badge definitions, none earned for a brand new child', async () => {
    const token = await registerAndLogin('badges@example.com');
    const childId = await createChild(token);

    const res = await request(app)
      .get(`/api/children/${childId}/badges`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.badges.length).toBe(5);
    expect(res.body.data.earnedCount).toBe(0);
  });

  test('growth-tracker badge is earned after 5 growth records', async () => {
    const token = await registerAndLogin('badges2@example.com');
    const childId = await createChild(token);

    for (let i = 0; i < 5; i += 1) {
      await request(app)
        .post(`/api/children/${childId}/growth`)
        .set('Authorization', `Bearer ${token}`)
        .send({ heightCm: 80 + i, weightKg: 10 + i, date: new Date(2026, i, 1).toISOString() });
    }

    const res = await request(app)
      .get(`/api/children/${childId}/badges`)
      .set('Authorization', `Bearer ${token}`);
    const growthBadge = res.body.data.badges.find((b) => b.id === 'growth-tracker');
    expect(growthBadge.earned).toBe(true);
  });
});

describe('AI Assistant API', () => {
  test('reports unavailable when no API key is configured', async () => {
    const originalKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const token = await registerAndLogin('assistant@example.com');
    const res = await request(app)
      .get('/api/assistant/status')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.data.available).toBe(false);

    if (originalKey) process.env.ANTHROPIC_API_KEY = originalKey;
  });

  test('ask endpoint returns 503 when not configured', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const token = await registerAndLogin('assistant2@example.com');
    const childId = await createChild(token);

    const res = await request(app)
      .post(`/api/children/${childId}/assistant/ask`)
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Is my child growing normally?' });
    expect(res.status).toBe(503);
  });
});
