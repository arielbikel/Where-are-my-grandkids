const { Resend } = require('resend');
const db = require('../db');
const { getWeekBounds } = require('./digest');

async function sendReminders() {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  if (!settings.reminder_enabled) return { skipped: true };

  const { start, end } = getWeekBounds();

  // Members who have NOT posted this week
  const membersWhoPosted = db.prepare(`
    SELECT DISTINCT member_id FROM updates
    WHERE created_at >= ? AND created_at <= ?
  `).all(start, end).map(r => r.member_id);

  const allMembers = db.prepare(
    'SELECT * FROM family_members WHERE role = ? AND email IS NOT NULL AND email != ?'
  ).all('member', '');

  const recipients = allMembers.filter(m => !membersWhoPosted.includes(m.id));
  if (recipients.length === 0) return { sent: 0 };

  const resend = new Resend(process.env.RESEND_API_KEY);
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  let sent = 0;
  for (const member of recipients) {
    const html = buildReminderHTML(member, baseUrl);
    const { error } = await resend.emails.send({
      from: 'The Family Hub <onboarding@resend.dev>',
      to: [member.email],
      subject: `Hey ${member.name}! Grandma & Grandpa would love to hear from you 💌`,
      html,
    });
    if (!error) sent++;
  }

  return { sent, total: recipients.length };
}

function buildReminderHTML(member, baseUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#F5EDE0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EDE0;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="max-width:500px;width:100%;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#C2410C,#E76F2A);padding:32px;text-align:center;">
              <div style="font-size:48px;margin-bottom:8px;">💌</div>
              <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-family:Georgia,serif;">
                Hey ${member.name}! ${member.emoji}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;text-align:center;">
              <p style="font-size:18px;line-height:1.7;color:#3D2B1F;margin:0 0 16px 0;">
                It's Friday — which means Grandma & Grandpa's weekly digest goes out this Sunday! 🌻
              </p>
              <p style="font-size:16px;line-height:1.7;color:#6B5445;margin:0 0 28px 0;">
                You haven't posted an update yet this week. Share what you've been up to — even a few sentences would make their day!
              </p>
              <a href="${baseUrl}" style="display:inline-block;background:#C2410C;color:#FFFFFF;text-decoration:none;padding:14px 28px;border-radius:50px;font-size:16px;font-family:Arial,sans-serif;font-weight:600;">
                Post my update now →
              </a>
              <p style="font-size:14px;color:#B8A495;margin:24px 0 0 0;font-style:italic;">
                With love from the whole family 💕
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = { sendReminders };
