import { NextResponse } from 'next/server';
import { configured, queryDataSource } from '../../../lib/notion';
import { DS } from '../../../lib/hgs';

export async function GET() {
  const notionConfigured = configured();
  const dashboardAuthConfigured = Boolean(process.env.DASHBOARD_USER && process.env.DASHBOARD_PASSWORD);
  const ingestConfigured = Boolean(process.env.HGS_INGEST_SECRET);
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
  const deploymentHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || null;

  const status = {
    ok: true,
    readyForOperations: false,
    notionConfigured,
    notionRead: false,
    dashboardAuthConfigured,
    ingestConfigured,
    stripeConfigured,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || null,
    deploymentUrl: deploymentHost ? `https://${deploymentHost}` : null,
    time: new Date().toISOString(),
  };

  if (notionConfigured) {
    try {
      const r = await queryDataSource(DS.integrations, { page_size: 1 });
      status.notionRead = true;
      status.sampleRows = r.results?.length || 0;
    } catch (e) {
      status.ok = false;
      status.error = e.message;
    }
  }

  status.readyForOperations =
    status.notionConfigured &&
    status.notionRead &&
    status.dashboardAuthConfigured &&
    status.ingestConfigured;

  return NextResponse.json(status, { status: status.ok ? 200 : 503 });
}
