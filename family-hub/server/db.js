const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'family-hub.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS family_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '👤',
    color TEXT NOT NULL DEFAULT '#6B7280',
    email TEXT,
    pin TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member', 'admin')),
    birthday TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    photo_path TEXT,
    location TEXT,
    weather_emoji TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    grandparent_email TEXT DEFAULT '',
    send_day TEXT DEFAULT 'sunday',
    send_time TEXT DEFAULT '09:00',
    reminder_enabled INTEGER DEFAULT 1,
    digest_title TEXT DEFAULT 'The Family Weekly'
  );

  CREATE TABLE IF NOT EXISTS reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    update_id INTEGER NOT NULL REFERENCES updates(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(update_id, member_id, emoji)
  );
`);

// Seed default settings if not present
const settingsRow = db.prepare('SELECT id FROM settings WHERE id = 1').get();
if (!settingsRow) {
  db.prepare(`INSERT INTO settings (id) VALUES (1)`).run();
}

// Seed sample family members for development if table is empty
const memberCount = db.prepare('SELECT COUNT(*) as count FROM family_members').get();
if (memberCount.count === 0) {
  const defaultPin = bcrypt.hashSync('1234', 10);
  const adminPin = bcrypt.hashSync('0000', 10);

  const members = [
    { name: 'Grandma Rose', emoji: '👵', color: '#E11D48', email: 'grandma@example.com', pin: adminPin, role: 'admin', birthday: '1945-03-15' },
    { name: 'Marco', emoji: '🧑', color: '#7C3AED', email: 'marco@example.com', pin: defaultPin, role: 'member', birthday: '1992-07-22' },
    { name: 'Sofia', emoji: '👩', color: '#0891B2', email: 'sofia@example.com', pin: defaultPin, role: 'member', birthday: '1990-11-05' },
    { name: 'Luca', emoji: '👦', color: '#059669', email: 'luca@example.com', pin: defaultPin, role: 'member', birthday: '1995-02-14' },
    { name: 'Elena', emoji: '👧', color: '#D97706', email: 'elena@example.com', pin: defaultPin, role: 'member', birthday: '1998-09-30' },
    { name: 'Nino', emoji: '🧔', color: '#DC2626', email: 'nino@example.com', pin: defaultPin, role: 'member', birthday: '1988-05-11' },
    { name: 'Chloe', emoji: '👱‍♀️', color: '#7C3AED', email: 'chloe@example.com', pin: defaultPin, role: 'member', birthday: '2001-12-03' },
    { name: 'Theo', emoji: '🧒', color: '#1D4ED8', email: 'theo@example.com', pin: defaultPin, role: 'member', birthday: '2003-06-18' },
  ];

  const insertMember = db.prepare(
    'INSERT INTO family_members (name, emoji, color, email, pin, role, birthday) VALUES (@name, @emoji, @color, @email, @pin, @role, @birthday)'
  );
  for (const m of members) insertMember.run(m);

  console.log('✅ Database seeded with sample family members');
  console.log('   Admin: "Grandma Rose" PIN: 0000');
  console.log('   Members PIN: 1234');
}

module.exports = db;
