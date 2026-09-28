'use client';
import { useMemo, useState } from 'react';

const yen = (value) => `¥${Math.round(Number(value) || 0).toLocaleString('ja-JP')}`;

function linePoints(data, key, x, y) {
  return data.map((point, index) => `${x(index)},${y(point[key])}`).join(' ');
}

export default function ProfitChart({ data = [], compact = false }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const width = 900; const height = compact ? 230 : 290;
  const pad = { top: 18, right: 18, bottom: 34, left: 18 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const scale = useMemo(() => {
    const values = data.flatMap((point) => [point.revenue, point.adSpend, point.contribution].filter(Number.isFinite));
    const min = Math.min(0, ...values); const max = Math.max(1, ...values);
    const range = max - min || 1;
    return { min, max, y: (value) => pad.top + (max - (Number(value) || 0)) / range * plotHeight };
  }, [data, plotHeight]);
  const x = (index) => pad.left + (data.length <= 1 ? plotWidth / 2 : index / (data.length - 1) * plotWidth);
  const active = activeIndex == null ? null : data[activeIndex];
  const hasContribution = data.some((point) => Number.isFinite(point.contribution));

  if (!data.length) return <div className="empty-profit">表示できる期間データがありません。</div>;

  return <div className={`profit-chart ${compact ? 'compact' : ''}`} onMouseLeave={() => setActiveIndex(null)}>
    <div className="profit-legend"><span className="profit-dot revenue" />売上<span className="profit-dot spend" />広告費<span className="profit-dot contribution" />広告差引利益（概算）</div>
    <div className="profit-canvas">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="売上・広告費・広告差引利益の推移">
        {[0, .25, .5, .75, 1].map((step) => <line key={step} x1={pad.left} x2={width - pad.right} y1={pad.top + step * plotHeight} y2={pad.top + step * plotHeight} className="grid-line" />)}
        {scale.min < 0 && <line x1={pad.left} x2={width - pad.right} y1={scale.y(0)} y2={scale.y(0)} className="zero-line" />}
        <polyline points={linePoints(data, 'revenue', x, scale.y)} className="profit-line revenue" />
        <polyline points={linePoints(data, 'adSpend', x, scale.y)} className="profit-line spend" />
        {hasContribution && <polyline points={linePoints(data, 'contribution', x, scale.y)} className="profit-line contribution" />}
        {data.map((point, index) => <g key={point.date}>
          {Number.isFinite(point.contribution) && <circle cx={x(index)} cy={scale.y(point.contribution)} r={activeIndex === index ? 6 : 3.5} className="profit-point" />}
          <rect x={Math.max(pad.left, x(index) - plotWidth / Math.max(2, data.length) / 2)} y={pad.top} width={Math.max(18, plotWidth / Math.max(1, data.length))} height={plotHeight} className="profit-hit" tabIndex="0" aria-label={`${point.date} 売上${yen(point.revenue)} 成功決済${point.requests}件`} onMouseEnter={() => setActiveIndex(index)} onFocus={() => setActiveIndex(index)} onClick={() => setActiveIndex(index)} />
          {(index % Math.max(1, Math.ceil(data.length / 7)) === 0 || index === data.length - 1) && <text x={x(index)} y={height - 8} textAnchor="middle">{point.date.slice(5)}</text>}
        </g>)}
        {active && <line x1={x(activeIndex)} x2={x(activeIndex)} y1={pad.top} y2={pad.top + plotHeight} className="hover-line" />}
      </svg>
      {active && <div className="profit-tooltip" style={{ left: `${Math.min(88, Math.max(12, x(activeIndex) / width * 100))}%` }}>
        <strong>{active.date}</strong>
        <dl><div><dt>売上</dt><dd>{yen(active.revenue)}</dd></div><div><dt>依頼</dt><dd>{active.requests}件 <small>成功決済ベース</small></dd></div><div><dt>発生時刻</dt><dd>{active.times.length ? <>{active.times.slice(0, 8).join('、')}{active.times.length > 8 ? ` ほか${active.times.length - 8}件` : ''}</> : '—'}</dd></div><div><dt>広告費</dt><dd>{yen(active.adSpend)}</dd></div><div><dt>広告差引</dt><dd className={Number.isFinite(active.contribution) ? (active.contribution < 0 ? 'negative' : 'positive') : ''}>{Number.isFinite(active.contribution) ? yen(active.contribution) : '算定不能'}</dd></div></dl>
      </div>}
    </div>
    <p className="profit-help">線または日付付近にカーソルを合わせると、その日の内訳を確認できます。タッチ操作では日付を選択してください。</p>
  </div>;
}
