// Storage may be blocked or full. The desktop should still work for this visit.
export function storedValue(key, fallback = null, storage) {
  try {
    return (storage || globalThis.localStorage)?.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}
export function storeValue(key, value, storage) {
  try {
    const target = storage || globalThis.localStorage
    if (!target) return false
    target.setItem(key, value)
    return true
  } catch {
    return false
  }
}
export function restoredWindows(storage) {
  try {
    const text = storedValue('windows', '[]', storage)
    if (text.length > 16000) return []
    const ids = JSON.parse(text)
    return Array.isArray(ids) ? [...new Set(ids.filter((id) => typeof id === 'string' && /^[a-zA-Z][a-zA-Z0-9_-]{0,49}$/.test(id)))].slice(0, 100) : []
  } catch {
    return []
  }
}
