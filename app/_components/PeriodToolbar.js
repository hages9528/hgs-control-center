'use client';
import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

function shift(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export default function PeriodToolbar({ period, generatedAt, mode = 'range', refreshSeconds = 60 }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(period.from || period.date);
  const [to, setTo] = useState(period.to || period.date);
  const [refreshing, setRefreshing] = useState(false);
  const label = useMemo(() => generatedAt ? new Date(generatedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '未取得', [generatedAt]);

  function navigate(values) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(values)) value == null ? next.delete(key) : next.set(key, value);
    router.push(`${pathname}?${next.toString()}`);
  }

  function move(direction) {
    if (mode === 'day') {
      const date = shift(period.date, direction);
      if (date <= period.maxDate) navigate({ date });
      return;
    }
    navigate({ range: 'custom', from: shift(period.from, direction * period.days), to: shift(period.to, direction * period.days) });
  }

  function refresh() {
    setRefreshing(true);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 700);
  }

  return <section className="period-toolbar" aria-label="表示期間">
    <div className="period-controls">
      <button type="button" className="icon-button" onClick={() => move(-1)} aria-label="前の期間">←</button>
      {mode === 'day' ? <>
        <label><span>集計日</span><input type="date" max={period.maxDate} value={period.date} onChange={(event) => navigate({ date: event.target.value })} /></label>
      </> : <>
        <label><span>期間</span><select value={period.preset} onChange={(event) => navigate({ range: event.target.value, from: null, to: null })}>
          <option value="today">今日</option><option value="yesterday">昨日</option><option value="7d">直近7日</option><option value="30d">直近30日（今日含む）</option><option value="30c">過去30日（昨日まで）</option><option value="90d">直近90日</option><option value="custom">指定期間</option>
        </select></label>
        {period.preset === 'custom' && <div className="custom-dates">
          <input aria-label="開始日" type="date" max={period.maxDate} value={from} onChange={(event) => setFrom(event.target.value)} />
          <span>〜</span>
          <input aria-label="終了日" type="date" max={period.maxDate} value={to} onChange={(event) => setTo(event.target.value)} />
          <button type="button" className="apply-button" onClick={() => navigate({ range: 'custom', from, to })}>適用</button>
        </div>}
      </>}
      <button type="button" className="icon-button" onClick={() => move(1)} disabled={period.lockToLatest || (period.to || period.date) >= period.maxDate} aria-label="次の期間">→</button>
    </div>
    <div className="freshness"><span className="live-dot" /><div><strong>{refreshSeconds}秒ごとに画面更新</strong><small>最終取得 {label}</small></div><button type="button" onClick={refresh}>{refreshing ? '更新中…' : '今すぐ更新'}</button></div>
  </section>;
}
