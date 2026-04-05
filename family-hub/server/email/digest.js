const { Resend } = require('resend');
const db = require('../db');

function getWeekBounds() {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diff);
  monday.setUTCHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  return { start: monday.toISOString(), end: sunday.toISOString() };
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'
  });
}

function buildDigestHTML(updates, settings, allMembers, baseUrl) {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const title = settings.digest_title || 'The Family Weekly';

  const postedIds = new Set(updates.map(u => u.member_id));
  const missing = allMembers.filter(m => m.role === 'member' && !postedIds.has(m.id));

  // Check for birthdays this week
  const { start, end } = getWeekBounds();
  const weekStart = new Date(start);
  const weekEnd = new Date(end);
  const birthdayMembers = allMembers.filter(m => {
    if (!m.birthday) return false;
    const bday = new Date(m.birthday);
    const thisYearBday = new Date(weekStart.getFullYear(), bday.getMonth(), bday.getDate());
    return thisYearBday >= weekStart && thisYearBday <= weekEnd;
  });

  const updatesHTML = updates.length === 0
    ? `<tr><td style="padding: 32px; text-align: center; color: #888; font-size: 18px; font-family: Georgia, serif;">
        It's been a quiet week! No updates yet — maybe give everyone a nudge 😊
       </td></tr>`
    : updates.map(u => {
        const photoBlock = u.photo_path
          ? `<tr><td style="padding: 0 32px 16px 32px;">
              <img src="${baseUrl}${u.photo_path}" alt="Photo by ${u.name}" style="max-width:100%; border-radius:12px; display:block;" />
             </td></tr>`
          : '';
        const meta = [
          u.location ? `📍 ${u.location}` : '',
          u.weather_emoji || '',
        ].filter(Boolean).join('  ');

        return `
        <tr>
          <td style="padding: 24px 32px 8px 32px; border-bottom: 1px solid #F3E8DC;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="52">
                  <div style="width:44px;height:44px;border-radius:50%;background:${u.color};display:inline-flex;align-items:center;justify-content:center;font-size:22px;text-align:center;line-height:44px;">
                    ${u.emoji}
                  </div>
                </td>
                <td style="padding-left:12px;vertical-align:middle;">
                  <div style="font-size:17px;font-weight:700;color:#2D1B0E;font-family:Georgia,serif;">${u.name}</div>
                  ${meta ? `<div style="font-size:13px;color:#8B7355;margin-top:2px;font-family:Arial,sans-serif;">${meta}</div>` : ''}
                </td>
                <td style="text-align:right;vertical-align:top;">
                  <div style="font-size:12px;color:#B8A495;font-family:Arial,sans-serif;">${formatDate(u.created_at)}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 32px 24px 32px;">
            <p style="margin:0;font-size:16px;line-height:1.7;color:#3D2B1F;font-family:Georgia,serif;">${u.text.replace(/\n/g, '<br>')}</p>
          </td>
        </tr>
        ${photoBlock}
        `;
      }).join('');

  const birthdayBanner = birthdayMembers.length > 0
    ? `<tr><td style="padding: 16px 32px; background: #FEF3C7; text-align: center; font-family: Georgia, serif; font-size: 16px; color: #92400E;">
        🎂 ${birthdayMembers.map(m => `Happy Birthday, ${m.name}!`).join(' & ')}
       </td></tr>`
    : '';

  const missingBlock = missing.length > 0
    ? `<p style="margin:0 0 8px 0;font-size:14px;color:#B8A495;font-family:Arial,sans-serif;">
        Still waiting to hear from: <strong>${missing.map(m => `${m.emoji} ${m.name}`).join(', ')}</strong>
       </p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F5EDE0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EDE0;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#C2410C,#E76F2A);border-radius:16px 16px 0 0;padding:40px 32px;text-align:center;">
              <div style="font-size:40px;margin-bottom:8px;">💌</div>
              <h1 style="margin:0;color:#FFFFFF;font-size:32px;font-family:Georgia,serif;font-weight:700;">${title}</h1>
              <p style="margin:8px 0 0 0;color:#FFD8BC;font-size:15px;font-family:Arial,sans-serif;">${today}</p>
              <p style="margin:16px 0 0 0;color:#FFE8D6;font-size:16px;font-family:Georgia,serif;font-style:italic;">
                "Here's what everyone's been up to this week!"
              </p>
            </td>
          </tr>

          ${birthdayBanner}

          <!-- Updates -->
          <tr>
            <td style="background:#FFFFFF;border-left:1px solid #F3E8DC;border-right:1px solid #F3E8DC;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${updatesHTML}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#FFF8F0;border:1px solid #F3E8DC;border-top:none;border-radius:0 0 16px 16px;padding:24px 32px;text-align:center;">
              ${missingBlock}
              <p style="margin:${missing.length > 0 ? '12px' : '0'} 0 0 0;font-size:15px;color:#8B7355;font-family:Georgia,serif;font-style:italic;">
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

async function sendDigest(toEmail, previewOnly = false) {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  const { start, end } = getWeekBounds();

  const updates = db.prepare(`
    SELECT u.*, m.name, m.emoji, m.color
    FROM updates u
    JOIN family_members m ON m.id = u.member_id
    WHERE u.created_at >= ? AND u.created_at <= ?
    ORDER BY u.created_at ASC
  `).all(start, end);

  const allMembers = db.prepare('SELECT * FROM family_members WHERE role = ?').all('member');
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const html = buildDigestHTML(updates, settings, allMembers, baseUrl);

  if (previewOnly) return html;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const { data, error } = await resend.emails.send({
    from: 'The Family Hub <onboarding@resend.dev>',
    to: [toEmail],
    subject: `${settings.digest_title || 'The Family Weekly'} — ${today}`,
    html,
  });

  if (error) throw new Error(error.message);
  return data;
}

module.exports = { sendDigest, buildDigestHTML, getWeekBounds };
