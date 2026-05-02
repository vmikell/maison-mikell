function getWelcomeEmailEndpoint() {
  if (typeof window === 'undefined') return 'https://maisonhomeapp.com/.netlify/functions/send-welcome-email'

  const host = window.location.hostname || ''
  if (host === 'localhost' || host === '127.0.0.1') return '/.netlify/functions/send-welcome-email'
  if (host === 'maisonhomeapp.com' || host === 'www.maisonhomeapp.com' || host === 'maison-mikell.netlify.app' || host.endsWith('--maison-mikell.netlify.app')) return '/.netlify/functions/send-welcome-email'

  return 'https://maisonhomeapp.com/.netlify/functions/send-welcome-email'
}

export async function sendWelcomeEmail(input = {}) {
  const response = await fetch(getWelcomeEmailEndpoint(), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email || '',
      name: input.name || '',
      provider: input.provider || 'unknown',
    }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.error || 'Could not send the welcome email right now.')
  }

  return data
}
