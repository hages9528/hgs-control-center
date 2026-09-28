'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from './Navigation';

export function AutoRefresh({ seconds = 60 }) {
  const router = useRouter();
  useEffect(() => { const id = setInterval(() => router.refresh(), seconds * 1000); return () => clearInterval(id); }, [router, seconds]);
  return null;
}

export function Badge({ children, tone = 'neutral' }) { return <span className={`badge ${tone}`}>{children}</span>; }

export function MetricCard({ label, value, hint, icon = 'activity', tone = 'blue' }) {
  return <article className={`metric-card ${tone}`}><div className="metric-icon"><Icon name={icon} /></div><div><p>{label}</p><strong>{value}</strong><small>{hint}</small></div></article>;
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return <header className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{actions && <div className="header-actions">{actions}</div>}</header>;
}

export function Panel({ title, subtitle, action, children, className = '' }) {
  return <section className={`panel ${className}`}><header className="panel-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action && <div className="panel-action">{action}</div>}</header>{children}</section>;
}

export function EmptyState({ title, description, compact = false }) {
  return <div className={`empty-state ${compact ? 'compact' : ''}`}><span className="empty-dot" /><div><strong>{title}</strong><p>{description}</p></div></div>;
}

export function SetupNotice({ title, description, variables = [] }) {
  return <div className="setup-notice"><div><Badge tone="warn">接続設定待ち</Badge><h3>{title}</h3><p>{description}</p></div><div className="variable-list">{variables.map((v) => <code key={v}>{v}</code>)}</div></div>;
}
