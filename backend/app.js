const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const childRoutes = require('./routes/childRoutes');
const growthRoutes = require('./routes/growthRoutes');
const vaccinationRoutes = require('./routes/vaccinationRoutes');
const milestoneRoutes = require('./routes/milestoneRoutes');
const nutritionRoutes = require('./routes/nutritionRoutes');
const sleepRoutes = require('./routes/sleepRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const memoryRoutes = require('./routes/memoryRoutes');
const badgeRoutes = require('./routes/badgeRoutes');
const assistantRoutes = require('./routes/assistantRoutes');
const insightRoutes = require('./routes/insightRoutes');

const app = express();

// --- Security & core middleware -------------------------------------------------
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize()); // strips $ / . operators from user input to block NoSQL injection

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// General API rate limit (auth routes apply their own stricter limiter on top).
app.use(
  '/api',
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MIN || 15) * 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_MAX || 200),
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Serve uploaded photos (child photos, avatars).
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Health check -----------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is healthy', timestamp: new Date().toISOString() });
});

// --- Routes -------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/children', childRoutes);
app.use('/api', growthRoutes); // exposes /api/children/:childId/growth* and /api/growth/:id
app.use('/api', vaccinationRoutes); // /api/children/:childId/vaccinations*, /api/vaccinations/:id*
app.use('/api', milestoneRoutes);
app.use('/api', nutritionRoutes);
app.use('/api', sleepRoutes);
app.use('/api', reportRoutes);
app.use('/api', appointmentRoutes);
app.use('/api', medicineRoutes);
app.use('/api', memoryRoutes);
app.use('/api', badgeRoutes);
app.use('/api', assistantRoutes);
app.use('/api', insightRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// --- 404 + error handling (must be last) --------------------------------------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
