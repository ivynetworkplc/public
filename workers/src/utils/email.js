/**
 * Optional email notification layer.
 * Configure EMAIL_PROVIDER secret/var: none | resend | sendgrid | mailchannels
 * Secrets: EMAIL_API_KEY, EMAIL_FROM, EMAIL_TO
 */

export async function notifyEmail(env, { subject, text, replyTo }) {
  const provider = (env.EMAIL_PROVIDER || 'none').toLowerCase();
  if (provider === 'none' || !env.EMAIL_API_KEY) {
    return { sent: false, reason: 'email_disabled' };
  }

  const from = env.EMAIL_FROM || 'forms@ivynetwork.co.uk';
  const to = env.EMAIL_TO || 'team@ivynetwork.co.uk';

  try {
    if (provider === 'resend') {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.EMAIL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          text,
          reply_to: replyTo || undefined,
        }),
      });
      return { sent: res.ok, status: res.status };
    }

    if (provider === 'sendgrid') {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.EMAIL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: from },
          subject,
          content: [{ type: 'text/plain', value: text }],
          reply_to: replyTo ? { email: replyTo } : undefined,
        }),
      });
      return { sent: res.ok || res.status === 202, status: res.status };
    }

    if (provider === 'mailchannels') {
      const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: from, name: 'Ivy Network PLC Forms' },
          subject,
          content: [{ type: 'text/plain', value: text }],
        }),
      });
      return { sent: res.ok, status: res.status };
    }

    return { sent: false, reason: 'unknown_provider' };
  } catch (err) {
    console.error('email_error', err?.message || String(err));
    return { sent: false, reason: 'exception' };
  }
}
