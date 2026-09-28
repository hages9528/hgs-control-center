const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function todayJst() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

export function shiftDate(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function validDate(value) {
  return ISO_DATE.test(String(value || '')) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export function parsePeriod(params = {}, { defaultPreset = '30d', maxDays = 366 } = {}) {
  const today = todayJst();
  const preset = ['today', 'yesterday', '7d', '30d', '90d', 'custom'].includes(params.range) ? params.range : defaultPreset;
  let to = today;
  let from = today;
  if (preset === 'yesterday') from = to = shiftDate(today, -1);
  if (preset === '7d') from = shiftDate(today, -6);
  if (preset === '30d') from = shiftDate(today, -29);
  if (preset === '90d') from = shiftDate(today, -89);
  if (preset === 'custom') {
    from = validDate(params.from) ? params.from : shiftDate(today, -29);
    to = validDate(params.to) ? params.to : today;
  }
  if (to > today) to = today;
  if (from > to) [from, to] = [to, from];
  const rawDays = Math.floor((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000) + 1;
  const days = Math.min(Math.max(rawDays, 1), maxDays);
  if (rawDays > maxDays) from = shiftDate(to, -(maxDays - 1));
  const label = from === to ? from : `${from} 〜 ${to}`;
  return { preset, from, to, days, label, maxDate: today };
}

export function parseLineDate(params = {}) {
  const maxDate = shiftDate(todayJst(), -1);
  let date = validDate(params.date) ? params.date : maxDate;
  if (date > maxDate) date = maxDate;
  return { date, label: date, maxDate };
}

export function periodUnix(period) {
  return {
    gte: Math.floor(Date.parse(`${period.from}T00:00:00+09:00`) / 1000),
    lt: Math.floor(Date.parse(`${shiftDate(period.to, 1)}T00:00:00+09:00`) / 1000),
  };
}
