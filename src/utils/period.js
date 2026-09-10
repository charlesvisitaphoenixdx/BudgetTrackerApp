// Budget period math for a configurable "start day of month".
//
// Example: startDay = 5 means the budget period for September runs
// Sep 5 -> Oct 4 (i.e. up to, but not including, the next start day).
//
// If the configured start day doesn't exist in a given month (e.g. 31 in
// February), it is clamped to that month's last day.

export function daysInMonth(year, monthIndex) {
  // monthIndex: 0 = Jan ... 11 = Dec
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function clampDay(year, monthIndex, day) {
  return Math.min(day, daysInMonth(year, monthIndex));
}

export function addMonthIndex(year, monthIndex, delta) {
  let m = monthIndex + delta;
  let y = year;
  while (m < 0) {
    m += 12;
    y -= 1;
  }
  while (m > 11) {
    m -= 12;
    y += 1;
  }
  return { y, m };
}

/**
 * Returns the { start, end } Dates of the budget period containing refDate,
 * given a configured start day of month (1-31).
 */
export function periodFor(refDate, startDay) {
  const y = refDate.getFullYear();
  const m = refDate.getMonth();
  const d = refDate.getDate();

  const effectiveStartThisMonth = clampDay(y, m, startDay);

  let startY = y;
  let startM = m;
  if (d < effectiveStartThisMonth) {
    const prev = addMonthIndex(y, m, -1);
    startY = prev.y;
    startM = prev.m;
  }

  const startDayClamped = clampDay(startY, startM, startDay);
  const start = new Date(startY, startM, startDayClamped);

  const next = addMonthIndex(startY, startM, 1);
  const nextStartDayClamped = clampDay(next.y, next.m, startDay);
  const end = new Date(next.y, next.m, nextStartDayClamped - 1);

  return { start, end };
}

/** Shifts to the previous (delta = -1) or next (delta = 1) period. */
export function shiftPeriod(period, startDay, delta) {
  const probe = new Date(period.start);
  probe.setMonth(probe.getMonth() + delta);
  probe.setDate(Math.min(probe.getDate(), daysInMonth(probe.getFullYear(), probe.getMonth())));
  return periodFor(probe, startDay);
}
