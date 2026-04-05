const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { sendDigest } = require('../email/digest');
const { sendReminders } = require('../email/reminder');

const router = express.Router();

// All admin routes require admin role
router.use(requireAdmin);

// GET /api/admin/settings
router.get('/settings', (req, res) => {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  res.json(settings);
});

// PUT /api/admin/settings
router.put('/settings', (req, res) => {
  const { grandparent_email, send_day, send_time, reminder_enabled, digest_title } = req.body;
  db.prepare(`
    UPDATE settings SET
      grandparent_email = COALESCE(?, grandparent_email),
      send_day = COALESCE(?, send_day),
      send_time = COALESCE(?, send_time),
      reminder_enabled = COALESCE(?, reminder_enabled),
      digest_title = COALESCE(?, digest_title)
    WHERE id = 1
  `).run(
    grandparent_email ?? null,
    send_day ?? null,
    send_time ?? null,
    reminder_enabled !== undefined ? (reminder_enabled ? 1 : 0) : null,
    digest_title ?? null
  );
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  res.json(settings);
});

// POST /api/admin/preview
router.post('/preview', async (req, res) => {
  try {
    const html = await sendDigest(null, true);
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/send-test
router.post('/send-test', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  try {
    await sendDigest(email);
    res.json({ ok: true, message: `Test digest sent to ${email}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/send-now
router.post('/send-now', async (req, res) => {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  if (!settings.grandparent_email) {
    return res.status(400).json({ error: 'No grandparent email configured' });
  }
  try {
    await sendDigest(settings.grandparent_email);
    res.json({ ok: true, message: `Digest sent to ${settings.grandparent_email}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/send-reminders
router.post('/send-reminders', async (req, res) => {
  try {
    const result = await sendReminders();
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/members
router.get('/members', (req, res) => {
  const members = db.prepare('SELECT id, name, emoji, color, email, role, birthday, created_at FROM family_members').all();
  res.json(members);
});

// POST /api/admin/members
router.post('/members', (req, res) => {
  const { name, emoji, color, email, pin, role, birthday } = req.body;
  if (!name || !pin) return res.status(400).json({ error: 'name and pin required' });
  if (String(pin).length !== 4 || !/^\d{4}$/.test(String(pin))) {
    return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
  }

  const hashedPin = bcrypt.hashSync(String(pin), 10);
  const result = db.prepare(`
    INSERT INTO family_members (name, emoji, color, email, pin, role, birthday)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    emoji || '👤',
    color || '#6B7280',
    email || null,
    hashedPin,
    role === 'admin' ? 'admin' : 'member',
    birthday || null
  );

  const member = db.prepare('SELECT id, name, emoji, color, email, role, birthday FROM family_members WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(member);
});

// DELETE /api/admin/members/:id
router.delete('/members/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (id === req.session.memberId) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }
  db.prepare('DELETE FROM family_members WHERE id = ?').run(id);
  res.json({ ok: true });
});

// PUT /api/admin/members/:id/reset-pin
router.put('/members/:id/reset-pin', (req, res) => {
  const { pin } = req.body;
  if (!pin || !/^\d{4}$/.test(String(pin))) {
    return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
  }
  const hashedPin = bcrypt.hashSync(String(pin), 10);
  db.prepare('UPDATE family_members SET pin = ? WHERE id = ?').run(hashedPin, parseInt(req.params.id));
  res.json({ ok: true });
});

module.exports = router;
