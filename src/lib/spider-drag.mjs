// Geometry shared by mouse, touch and pen dragging; no game state is changed here.
export function dragThreshold(start, point, pointerType = 'mouse') {
  return Math.hypot(point.x - start.x, point.y - start.y) >= (pointerType === 'mouse' ? 4 : 8)
}
export function dropColumnAtPoint(point, viewport, columns) {
  if (![point.x, point.y].every(Number.isFinite)) return null
  if (point.x < viewport.left || point.x > viewport.right || point.y < viewport.top || point.y > viewport.bottom) return null
  let closest = null,
    distance = Infinity
  columns.forEach((rect, index) => {
    if (point.y < rect.top || point.y > rect.bottom || point.x < rect.left - 6 || point.x > rect.right + 6) return
    const next = Math.abs(point.x - (rect.left + rect.right) / 2)
    if (next < distance) {
      closest = index
      distance = next
    }
  })
  return closest
}
export function dragScroll(point, rect) {
  const speed = (position, start, end) => {
    if (position < start - 20 || position > end + 20) return 0
    const zone = Math.min(38, (end - start) / 4)
    if (position < start + zone) return -Math.ceil(12 * Math.min(1, (start + zone - position) / zone))
    if (position > end - zone) return Math.ceil(12 * Math.min(1, (position - end + zone) / zone))
    return 0
  }
  return { x: speed(point.x, rect.left, rect.right), y: speed(point.y, rect.top, rect.bottom) }
}
