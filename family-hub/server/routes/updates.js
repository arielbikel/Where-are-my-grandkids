const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Multer: store in memory, we'll process with sharp before saving
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

function getWeekBounds() {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diff);
  monday.setUTCHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  return { start: monday.toISOString(), end: sunday.toISOString() };
}

// GET /api/updates/week — all updates this week
router.get('/week', requireAuth, (req, res) => {
  const { start, end } = getWeekBounds();
  const updates = db.prepare(`
    SELECT u.*, m.name, m.emoji, m.color
    FROM updates u
    JOIN family_members m ON m.id = u.member_id
    WHERE u.created_at >= ? AND u.created_at <= ?
    ORDER BY u.created_at DESC
  `).all(start, end);

  // Attach reactions
  const withReactions = updates.map(u => {
    const reactions = db.prepare(`
      SELECT r.emoji, COUNT(*) as count,
             MAX(CASE WHEN r.member_id = ? THEN 1 ELSE 0 END) as reacted_by_me
      FROM reactions r WHERE r.update_id = ?
      GROUP BY r.emoji
    `).all(req.session.memberId, u.id);
    return { ...u, reactions };
  });

  res.json(withReactions);
});

// GET /api/updates/mine — current member's history
router.get('/mine', requireAuth, (req, res) => {
  const updates = db.prepare(`
    SELECT u.*, m.name, m.emoji, m.color
    FROM updates u
    JOIN family_members m ON m.id = u.member_id
    WHERE u.member_id = ?
    ORDER BY u.created_at DESC
    LIMIT 50
  `).all(req.session.memberId);
  res.json(updates);
});

// POST /api/updates — create new update
router.post('/', requireAuth, upload.single('photo'), async (req, res) => {
  const { text, location, weather_emoji } = req.body;
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required' });
  }
  if (text.length > 500) {
    return res.status(400).json({ error: 'Text must be 500 characters or less' });
  }

  let photo_path = null;
  if (req.file) {
    const filename = `photo_${Date.now()}_${req.session.memberId}.jpg`;
    const filepath = path.join(UPLOADS_DIR, filename);
    await sharp(req.file.buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(filepath);
    photo_path = `/uploads/${filename}`;
  }

  const result = db.prepare(`
    INSERT INTO updates (member_id, text, photo_path, location, weather_emoji)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.session.memberId, text.trim(), photo_path, location || null, weather_emoji || null);

  const update = db.prepare(`
    SELECT u.*, m.name, m.emoji, m.color
    FROM updates u JOIN family_members m ON m.id = u.member_id
    WHERE u.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(update);
});

// POST /api/updates/:id/react
router.post('/:id/react', requireAuth, (req, res) => {
  const { emoji } = req.body;
  const updateId = parseInt(req.params.id);
  if (!emoji) return res.status(400).json({ error: 'emoji required' });

  const existing = db.prepare(
    'SELECT id FROM reactions WHERE update_id = ? AND member_id = ? AND emoji = ?'
  ).get(updateId, req.session.memberId, emoji);

  if (existing) {
    db.prepare('DELETE FROM reactions WHERE id = ?').run(existing.id);
    return res.json({ action: 'removed' });
  } else {
    db.prepare('INSERT INTO reactions (update_id, member_id, emoji) VALUES (?, ?, ?)').run(updateId, req.session.memberId, emoji);
    return res.json({ action: 'added' });
  }
});

module.exports = router;
