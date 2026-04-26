// Robust YouTube ID extractor.
// Handles: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID,
// youtube.com/shorts/ID, youtube.com/live/ID, youtube.com/v/ID,
// youtube-nocookie.com/embed/ID, m.youtube.com, music.youtube.com,
// and bare 11-character IDs.
export function getYouTubeId(rawUrl: string | undefined | null): string | null {
  if (!rawUrl) return null
  const url = rawUrl.trim()
  if (!url) return null

  // Bare 11-char ID
  if (/^[A-Za-z0-9_-]{11}$/.test(url)) return url

  const patterns = [
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([A-Za-z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function isYouTubeUrl(url: string | undefined | null): boolean {
  return getYouTubeId(url) !== null
}

export function isVideoUrl(url: string | undefined | null): boolean {
  if (!url) return false
  if (isYouTubeUrl(url)) return true
  return /\.(mp4|webm|ogg|mov|m4v|mkv|3gp)(\?|#|$)/i.test(url)
}
