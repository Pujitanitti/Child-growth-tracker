require('./setup');
const request = require('supertest');
const app = require('../app');

describe('Auth API', () => {
  const credentials = { name: 'Test Parent', email: 'test@example.com', password: 'Password1' };

  test('signup creates a user and returns a token', async () => {
    const res = await request(app).post('/api/auth/signup').send(credentials);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('signup rejects a duplicate email', async () => {
    await request(app).post('/api/auth/signup').send(credentials);
    const res = await request(app).post('/api/auth/signup').send(credentials);
    expect(res.status).toBe(409);
  });

  test('signup rejects a weak password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...credentials, password: 'short' });
    expect(res.status).toBe(400);
  });

  test('login succeeds with correct credentials', async () => {
    await request(app).post('/api/auth/signup').send(credentials);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  test('login fails with wrong password', async () => {
    await request(app).post('/api/auth/signup').send(credentials);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'WrongPassword1' });
    expect(res.status).toBe(401);
  });

  test('/auth/me requires authentication', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
