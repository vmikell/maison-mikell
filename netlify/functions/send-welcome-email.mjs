const allowedOrigins = new Set([
  'https://maison-mikell.netlify.app',
  'https://maison-reset.web.app',
  'https://maison-reset.firebaseapp.com',
])

function corsHeaders(origin = '') {
  const allowOrigin = allowedOrigins.has(origin) ? origin : 'https://maison-mikell.netlify.app'
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function json(statusCode, body, origin = '') {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders(origin),
    },
    body: JSON.stringify(body),
  }
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const handler = async (event) => {
  const origin = event.headers.origin || ''

  if (event.httpMethod === 'OPTIONS') return json(204, {}, origin)
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' }, origin)

  let payload = {}
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Request body must be valid JSON.' }, origin)
  }

  const email = String(payload.email || '').trim().toLowerCase()
  const name = String(payload.name || '').trim() || 'there'
  const provider = String(payload.provider || 'unknown').trim() || 'unknown'

  if (!email || !email.includes('@')) return json(400, { error: 'A valid email address is required.' }, origin)

  const resendApiKey = process.env.MAISON_RESEND_API_KEY || process.env.RESEND_API_KEY || ''
  const fromEmail = process.env.MAISON_WELCOME_EMAIL_FROM || 'Maison <welcome@mail.maison.place>'
  const replyTo = process.env.MAISON_WELCOME_EMAIL_REPLY_TO || ''

  if (!resendApiKey) {
    return json(202, {
      ok: true,
      delivered: false,
      disabled: true,
      message: 'Welcome email automation is configured in code, but no Resend API key is set yet.',
    }, origin)
  }

  const subject = 'Welcome to Maison'
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #1f1630; max-width: 560px; margin: 0 auto; padding: 24px;">
      <p style="font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #8b7aa7; margin-bottom: 16px;">Maison</p>
      <h1 style="font-size: 28px; line-height: 1.2; margin: 0 0 16px;">Welcome to Maison, ${escapeHtml(name)}.</h1>
      <p style="margin: 0 0 14px;">Thanks for creating your account. Maison is built to make shared home life feel calmer, cleaner, and less dependent on memory.</p>
      <p style="margin: 0 0 14px;">You can come back anytime to create a household, join one with an invite code, and start using Maison as your shared home system.</p>
      <p style="margin: 0 0 14px;">Sign-up method: <strong>${escapeHtml(provider)}</strong></p>
      <p style="margin: 22px 0 0;">Glad you’re here,<br/>Maison</p>
    </div>
  `
  const text = [
    `Welcome to Maison, ${name}.`,
    '',
    'Thanks for creating your account. Maison is built to make shared home life feel calmer, cleaner, and less dependent on memory.',
    'You can come back anytime to create a household, join one with an invite code, and start using Maison as your shared home system.',
    '',
    `Sign-up method: ${provider}`,
    '',
    'Glad you’re here,',
    'Maison',
  ].join('\n')

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [email],
      reply_to: replyTo || undefined,
      subject,
      html,
      text,
    }),
  })

  const resendData = await resendResponse.json().catch(() => ({}))
  if (!resendResponse.ok) {
    return json(502, {
      error: resendData?.message || 'Resend rejected the welcome email request.',
      provider: 'resend',
    }, origin)
  }

  return json(200, {
    ok: true,
    delivered: true,
    provider: 'resend',
    id: resendData?.id || null,
  }, origin)
}
