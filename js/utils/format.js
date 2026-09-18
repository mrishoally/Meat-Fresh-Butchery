/**
 * Formatting helpers for currency, numbers, and dates
 */

/**
 * Format a number as currency (defaults to TZS or USD depending on preference)
 * @param {number} amount
 * @param {string} [currency='TZS']
 * @returns {string}
 */
export function formatCurrency(amount, currency = 'TZS') {
  const num = Number(amount) || 0;
  if (currency === 'TZS') {
    return `TZS ${num.toLocaleString('en-US')}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(num);
}

/**
 * Format an ISO date string into a human-readable date & time
 * @param {string} isoString
 * @returns {string}
 */
export function formatDate(isoString) {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return isoString;
  }
}

/**
 * Short relative time (e.g., "5 mins ago", "Just now")
 * @param {string} isoString
 * @returns {string}
 */
export function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
