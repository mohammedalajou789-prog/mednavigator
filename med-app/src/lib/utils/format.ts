export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function getRemainingDays(expiryDate: string): number | null {
  const expiry = new Date(expiryDate)
  const now = new Date()
  const diffMs = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : null
}

export function formatPrice(price: number, currency = 'JOD'): string {
  if (price === 0) return 'Free'
  return `${price} ${currency}`
}

export function formatProgress(percentage: number): string {
  return `${Math.min(100, Math.max(0, Math.round(percentage)))}%`
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3)}...`
}

export function formatNumber(num: number): string {
  return num.toLocaleString('en-US')
}
