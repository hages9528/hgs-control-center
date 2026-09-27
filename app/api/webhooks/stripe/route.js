import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { ingestMetric } from '../../../../lib/hgs';
export const runtime='nodejs';
export async function POST(req){
  if(!process.env.STRIPE_SECRET_KEY||!process.env.STRIPE_WEBHOOK_SECRET)return NextResponse.json({error:'stripe webhook not configured'},{status:503});
  const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);const raw=await req.text();const sig=req.headers.get('stripe-signature');let event;
  try{event=stripe.webhooks.constructEvent(raw,sig,process.env.STRIPE_WEBHOOK_SECRET)}catch(e){return NextResponse.json({error:`invalid signature: ${e.message}`},{status:400})}
  try{
    const o=event.data.object;const base={source:'Stripe',eventId:event.id,occurredAt:new Date(event.created*1000).toISOString(),granularity:'event',state:'VERIFIED',account:event.account||''};
    if(event.type==='payment_intent.succeeded')await ingestMetric({...base,name:'売上',key:'revenue_gross',value:(o.amount_received||o.amount||0)/100,unit:(o.currency||'').toUpperCase()==='JPY'?'JPY':'other'});
    if(event.type==='charge.refunded')await ingestMetric({...base,name:'返金',key:'refund_amount',value:(o.amount_refunded||0)/100,unit:(o.currency||'').toUpperCase()==='JPY'?'JPY':'other'});
    if(event.type==='customer.subscription.created')await ingestMetric({...base,name:'新規サブスクリプション',key:'subscription_created',value:1,unit:'count'});
    if(event.type==='customer.subscription.deleted')await ingestMetric({...base,name:'解約サブスクリプション',key:'subscription_cancelled',value:1,unit:'count'});
    return NextResponse.json({received:true,type:event.type});
  }catch(e){return NextResponse.json({received:true,ingestError:e.message},{status:202})}
}
