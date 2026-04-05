const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { memberId, pin } = req.body;
  if (!memberId || !pin) {
    return res.status(400).json({ error: 'memberId and pin required' });
  }

  const member = db.prepare('SELECT * FROM family_members WHERE id = ?').get(memberId);
  if (!member) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = bcrypt.compareSync(String(pin), member.pin);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }

  req.session.memberId = member.id;
  req.session.role = member.role;

  res.json({
    id: member.id,
    name: member.name,
    emoji: member.emoji,
    color: member.color,
    role: member.role,
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.session || !req.session.memberId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const member = db.prepare('SELECT id, name, emoji, color, role FROM family_members WHERE id = ?').get(req.session.memberId);
  if (!member) return res.status(401).json({ error: 'Not found' });
  res.json(member);
});

module.exports = router;
