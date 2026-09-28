import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { ingestMetric } from '../../../../lib/hgs';

export const runtime = 'nodejs';

function validSignature(raw, signature, secret) {
  if (!signature || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('base64');
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function metricFor(event) {
  const names = {
    message: ['LINE受信メッセージ', 'line_message_received'],
    follow: ['LINE友だち追加', 'line_follow'],
    unfollow: ['LINEブロック・解除', 'line_unfollow'],
    postback: ['LINEポストバック', 'line_postback'],
  };
  const pair = names[event.type];
  if (!pair) return null;
  return {
    name: pair[0], key: pair[1], value: 1, unit: 'count', granularity: 'event', state: 'VERIFIED',
    source: 'LINE Official Account', project: 'NextLife', account: 'Official LINE',
    occurredAt: new Date(event.timestamp || Date.now()).toISOString(),
    eventId: `line:${event.webhookEventId || `${event.type}:${event.timestamp}`}`,
    dimension: { eventType: event.type, redelivery: Boolean(event.deliveryContext?.isRedelivery) },
  };
}

export async function POST(request) {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) return NextResponse.json({ error: 'line webhook not configured' }, { status: 503 });
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get('x-line-signature'), secret)) return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  try {
    const body = JSON.parse(raw);
    const results = [];
    for (const event of body.events || []) {
      const metric = metricFor(event);
      if (!metric) continue;
      const page = await ingestMetric(metric);
      results.push({ eventId: metric.eventId, id: page.id, deduplicated: page.deduplicated });
    }
    return NextResponse.json({ received: true, processed: results.length, results });
  } catch (error) {
    return NextResponse.json({ received: false, error: error.message }, { status: 400 });
  }
}
