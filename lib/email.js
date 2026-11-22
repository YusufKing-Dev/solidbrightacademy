export async function sendEmail({ to, subject, html, replyTo }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: 'RESEND_API_KEY is not set' };
  if (!to) return { ok: false, error: 'No notification email is configured' };
  try {
    const body = {
      from: process.env.EMAIL_FROM || 'Solid Bright Academy <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    };
    if (replyTo) body.reply_to = replyTo;
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) return { ok: false, error: (await r.text()).slice(0, 300) };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e.message || e).slice(0, 300) };
  }
}
