require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const cron = require('node-cron');

const db = require('./db');
const authRoutes = require('./routes/auth');
const updatesRoutes = require('./routes/updates');
const adminRoutes = require('./routes/admin');
const { sendDigest } = require('./email/digest');
const { sendReminders } = require('./email/reminder');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'family-hub-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// Static files: uploaded photos
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/updates', updatesRoutes);
app.use('/api/admin', adminRoutes);

// Members list (public — no PINs)
app.get('/api/members', (req, res) => {
  const members = db.prepare('SELECT id, name, emoji, color FROM family_members').all();
  res.json(members);
});

// Serve built React app in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ─── Cron Jobs ────────────────────────────────────────────────────────────────

function getDigestCronExpression(sendDay, sendTime) {
  const [hour, minute] = (sendTime || '09:00').split(':');
  const dayMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
  const dow = dayMap[sendDay] ?? 0;
  return `${minute} ${hour} * * ${dow}`;
}

let digestJob = null;
let reminderJob = null;

function scheduleDigest() {
  if (digestJob) digestJob.stop();
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  const cronExpr = getDigestCronExpression(settings.send_day, settings.send_time);
  console.log(`📅 Digest scheduled: ${cronExpr} (${settings.send_day} at ${settings.send_time} UTC)`);

  digestJob = cron.schedule(cronExpr, async () => {
    console.log('📧 Running scheduled weekly digest...');
    const s = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    if (!s.grandparent_email) {
      console.log('⚠️  No grandparent email set — skipping digest');
      return;
    }
    try {
      await sendDigest(s.grandparent_email);
      console.log(`✅ Digest sent to ${s.grandparent_email}`);
    } catch (err) {
      console.error('❌ Digest send failed:', err.message);
    }
  }, { timezone: 'UTC' });
}

function scheduleReminders() {
  if (reminderJob) reminderJob.stop();
  // Every Friday at 10:00 AM UTC
  reminderJob = cron.schedule('0 10 * * 5', async () => {
    console.log('📧 Running Friday reminders...');
    try {
      const result = await sendReminders();
      console.log(`✅ Reminders sent: ${result.sent || 0}/${result.total || 0}`);
    } catch (err) {
      console.error('❌ Reminder send failed:', err.message);
    }
  }, { timezone: 'UTC' });
}

scheduleDigest();
scheduleReminders();

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏠 The Family Hub running at http://localhost:${PORT}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
});
