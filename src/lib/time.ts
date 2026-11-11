const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export function timeAgo(ms: number, now = Date.now()): string {
  const d = now - ms;
  if (d < MIN) return 'just now';
  if (d < HOUR) return `${Math.floor(d / MIN)} min ago`;
  if (d < DAY) return `${Math.floor(d / HOUR)} h ago`;
  if (d < 7 * DAY) return `${Math.floor(d / DAY)} d ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** "6:30 PM" today, "Tue 6:30 PM" this week, otherwise a date. */
export function formatWhen(ms: number, now = Date.now()): string {
  const date = new Date(ms);
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (new Date(now).toDateString() === date.toDateString()) return time;
  if (Math.abs(ms - now) < 6 * DAY) return `${date.toLocaleDateString(undefined, { weekday: 'short' })} ${time}`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function untilText(ms: number, now = Date.now()): string {
  const d = ms - now;
  if (d <= 0) return 'now';
  if (d < DAY) {
    const total = Math.ceil(d / MIN);
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (!h) return `in ${m} min`;
    return m ? `in ${h} h ${m} min` : `in ${h} h`;
  }
  return `on ${formatWhen(ms, now)}`;
}

export const HOURS = HOUR;
export const DAYS = DAY;
