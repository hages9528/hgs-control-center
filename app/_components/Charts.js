function points(data, key, width, height, max) {
  if (!data.length) return '';
  return data.map((item, i) => `${data.length === 1 ? width / 2 : i / (data.length - 1) * width},${height - (Number(item[key]) || 0) / max * height}`).join(' ');
}

export function TrendChart({ data = [], primaryKey, secondaryKey, primaryLabel, secondaryLabel }) {
  const width = 720; const height = 220;
  const max = Math.max(1, ...data.flatMap((x) => [Number(x[primaryKey]) || 0, Number(x[secondaryKey]) || 0]));
  return <div className="chart-wrap"><div className="chart-legend"><span className="legend-primary">{primaryLabel}</span><span className="legend-secondary">{secondaryLabel}</span></div><svg className="trend-chart" viewBox={`0 0 ${width} ${height + 28}`} role="img" aria-label={`${primaryLabel}と${secondaryLabel}の推移`}>
    {[0, .25, .5, .75, 1].map((n) => <line key={n} x1="0" y1={n * height} x2={width} y2={n * height} className="grid-line" />)}
    <polyline points={points(data, primaryKey, width, height, max)} className="line-primary" />
    <polyline points={points(data, secondaryKey, width, height, max)} className="line-secondary" />
    {data.map((item, i) => i % Math.max(1, Math.ceil(data.length / 7)) === 0 && <text key={item.date || i} x={data.length === 1 ? width / 2 : i / (data.length - 1) * width} y={height + 22} textAnchor="middle">{String(item.date || '').slice(5)}</text>)}
  </svg></div>;
}

export function DonutChart({ value = 0, label }) {
  const safe = Math.max(0, Math.min(100, value));
  return <div className="donut" style={{ '--progress': `${safe * 3.6}deg` }}><div><strong>{safe}%</strong><span>{label}</span></div></div>;
}

export function ActivityBars({ values = [], labels = [] }) {
  const max = Math.max(1, ...values);
  return <div className="activity-bars">{values.map((value, i) => <div key={labels[i]}><div className="bar-track"><span style={{ height: `${Math.max(5, value / max * 100)}%` }} /></div><strong>{Number(value).toLocaleString('ja-JP')}</strong><small>{labels[i]}</small></div>)}</div>;
}

export function HorizontalBars({ items = [], valueKey, labelKey, format = (v) => v }) {
  const max = Math.max(1, ...items.map((x) => Number(x[valueKey]) || 0));
  return <div className="horizontal-bars">{items.map((item) => <div key={item[labelKey]}><div className="bar-label"><span>{item[labelKey]}</span><strong>{format(item[valueKey])}</strong></div><div className="horizontal-track"><span style={{ width: `${(Number(item[valueKey]) || 0) / max * 100}%` }} /></div></div>)}</div>;
}
