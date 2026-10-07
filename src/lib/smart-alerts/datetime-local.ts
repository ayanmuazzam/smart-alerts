/**
 * Restock countdown: datetime-local is site wall-clock; storage is true UTC ISO.
 */

const LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

type WallParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function wallPartsInTz(date: Date, timeZone: string): WallParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value || 0);

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

/** Wall-clock YYYY-MM-DDTHH:mm in `timeZone` → UTC ISO string. */
export function datetimeLocalToStored(
  local: string | null | undefined,
  timeZone = 'UTC',
): string | null {
  if (!local || !String(local).trim()) return null;
  const m = String(local).trim().match(LOCAL_RE);
  if (!m) return null;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);
  const tz = timeZone || 'UTC';

  // Assume UTC, then correct by the TZ offset at that instant (2 passes for DST edges).
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let i = 0; i < 2; i++) {
    const got = wallPartsInTz(new Date(utcMs), tz);
    const gotAsUtc = Date.UTC(got.year, got.month - 1, got.day, got.hour, got.minute, got.second);
    const wantAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
    utcMs += wantAsUtc - gotAsUtc;
  }

  return new Date(utcMs).toISOString();
}

/** Stored UTC Date/ISO → datetime-local value in `timeZone`. */
export function storedToDatetimeLocal(
  value: string | Date | null | undefined,
  timeZone = 'UTC',
): string {
  if (value == null || value === '') return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';

  const p = wallPartsInTz(d, timeZone || 'UTC');
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}
