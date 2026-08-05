require('./setup');
const request = require('supertest');
const app = require('../app');

async function registerAndLogin(email = 'features@example.com') {
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

describe('Appointments API', () => {
  test('schedules and completes an appointment', async () => {
    const token = await registerAndLogin();
    const childId = await createChild(token);

    const createRes = await request(app)
      .post(`/api/children/${childId}/appointments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Checkup', dateTime: '2026-12-01T10:00:00.000Z', doctorName: 'Dr. Rao' });
    expect(createRes.status).toBe(201);

    const apptId = createRes.body.data.appointment._id;
    const updateRes = await request(app)
      .patch(`/api/appointments/${apptId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'completed' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.appointment.status).toBe('completed');
  });

  test('rejects an appointment with no title', async () => {
    const token = await registerAndLogin();
    const childId = await createChild(token);
    const res = await request(app)
      .post(`/api/children/${childId}/appointments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ dateTime: '2026-12-01T10:00:00.000Z' });
    expect(res.status).toBe(400);
  });
});

describe('Medicine Reminders API', () => {
  test('adds a reminder and marks it taken', async () => {
    const token = await registerAndLogin('meds@example.com');
    const childId = await createChild(token);

    const createRes = await request(app)
      .post(`/api/children/${childId}/medicines`)
      .set('Authorization', `Bearer ${token}`)
      .send({ medicineName: 'Paracetamol', dosage: '5ml', frequency: 'daily' });
    expect(createRes.status).toBe(201);

    const medId = createRes.body.data.medicine._id;
    const takenRes = await request(app)
      .patch(`/api/medicines/${medId}/taken`)
      .set('Authorization', `Bearer ${token}`);
    expect(takenRes.status).toBe(200);
    expect(takenRes.body.data.medicine.lastTakenAt).toBeDefined();
  });
});

describe('CSV Import API', () => {
  test('imports valid rows and reports invalid ones', async () => {
    const token = await registerAndLogin('csv@example.com');
    const csv = 'name,gender,dateOfBirth,bloodGroup\nAarav,male,2023-01-01,B+\n,female,2023-01-01,O+\nDiya,female,2024-06-15,O+';

    const res = await request(app)
      .post('/api/children/import')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from(csv), 'children.csv');

    expect(res.status).toBe(201);
    expect(res.body.data.created.length).toBe(2);
    expect(res.body.data.errors.length).toBe(1);
  });

  test('rejects a non-CSV file', async () => {
    const token = await registerAndLogin('csv2@example.com');
    const res = await request(app)
      .post('/api/children/import')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('not a csv'), 'file.txt');
    expect(res.status).toBe(400);
  });
});
