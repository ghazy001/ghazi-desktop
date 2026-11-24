export function normalizeWebAddress(value, home) {
  const input = String(value).trim()
  if (!input) throw new Error('Enter a website address.')
  const candidate = input.startsWith('/') ? new URL(input, home) : new URL(/^[a-z][a-z\d+.-]*:/i.test(input) ? input : `https://${input}`)
  if (!['https:', 'http:'].includes(candidate.protocol) || !candidate.hostname || candidate.username || candidate.password) {
    throw new Error('Enter an HTTP or HTTPS website address without account credentials.')
  }
  return candidate.href
}
export function frameRestriction(value, policies) {
  const hostname = new URL(value).hostname
  return policies.find((policy) => hostname === policy.hostname || hostname.endsWith(`.${policy.hostname}`)) || null
}
