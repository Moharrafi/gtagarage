let lastPlayedTimestamp = 0

/**
 * Plays the cash-in ringtone (/media/cash-in.mp3) with a debounce guard.
 * Prevents overlapping or double-playing if triggered multiple times within 4 seconds
 * (e.g. triggered by invoice completion and web push event simultaneously).
 */
export function playCashInSound(): void {
  if (typeof window === 'undefined') return

  const now = Date.now()
  if (now - lastPlayedTimestamp < 4000) {
    // Sound was already played within the last 4 seconds, ignore duplicate
    return
  }
  lastPlayedTimestamp = now

  try {
    const audio = new Audio('/media/cash-in.mp3')
    audio.currentTime = 0
    audio.play().catch((err) => {
      console.warn('Audio playback prevented or failed:', err)
    })
  } catch (err) {
    console.warn('Audio initialization error:', err)
  }
}
