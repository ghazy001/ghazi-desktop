// This module contains only public form data. Resend credentials live in server/contact.mjs.
export function newSubmissionId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
export async function submitContact(payload, { fetchImpl = fetch, signal } = {}) {
  const response = await fetchImpl('/api/contact', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal
  })
  const result = await response.json().catch(() => null)
  if (!response.ok || result?.ok !== true) {
    const error = new Error(result?.error || 'provider_error')
    error.retryAfter = Number(response.headers.get('Retry-After')) || 0
    throw error
  }
}
