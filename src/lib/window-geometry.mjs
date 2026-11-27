const clamp = (n, min, max) => Math.max(min, Math.min(n, Math.max(min, max)))
export function dragWindowPosition(start, point, origin, size, viewport) {
  return { x: clamp(origin.x + point.x - start.x, 0, viewport.width - Math.min(size.width, 160)), y: clamp(origin.y + point.y - start.y, 0, viewport.height - 28) }
}
export function resizeWindowSize(start, delta, direction, minimum, viewport, origin) {
  const widthLimit = Math.max(1, viewport.width - origin.x),
    heightLimit = Math.max(1, viewport.height - origin.y)
  return {
    width: direction === 'bottom' ? start.width : clamp(start.width + delta.x, Math.min(minimum.width, widthLimit), widthLimit),
    height: direction === 'right' ? start.height : clamp(start.height + delta.y, Math.min(minimum.height, heightLimit), heightLimit)
  }
}
