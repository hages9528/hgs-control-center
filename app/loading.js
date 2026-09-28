export default function Loading() {
  return <div className="loading-layout" aria-label="データを読み込んでいます">
    <div className="skeleton skeleton-title" /><div className="skeleton skeleton-subtitle" />
    <div className="loading-grid">{Array.from({ length: 4 }, (_, index) => <div className="skeleton skeleton-card" key={index} />)}</div>
    <div className="skeleton skeleton-panel" />
  </div>;
}
