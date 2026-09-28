'use client';

export default function ErrorPage({ error, reset }) {
  return <section className="fatal-error"><span>DATA LOAD ERROR</span><h1>画面を読み込めませんでした</h1><p>{error?.message || '一時的な接続エラーが発生しました。'}</p><button className="button" type="button" onClick={reset}>再試行</button></section>;
}
