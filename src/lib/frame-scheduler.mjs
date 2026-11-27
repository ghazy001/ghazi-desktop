// Coalesce bursty pointer/resize input without dropping the final position.
export function createFrameScheduler(paint, request = (callback) => globalThis.requestAnimationFrame(callback), cancel = (id) => globalThis.cancelAnimationFrame(id)) {
  let frame = null,
    latest,
    pending = false
  const run = () => {
    frame = null
    if (pending) {
      pending = false
      paint(latest)
    }
  }
  return {
    push(value) {
      latest = value
      pending = true
      if (frame === null) frame = request(run)
    },
    flush() {
      if (frame !== null) cancel(frame)
      frame = null
      run()
    },
    cancel() {
      if (frame !== null) cancel(frame)
      frame = null
      pending = false
    }
  }
}
