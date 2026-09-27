import { NextResponse } from 'next/server';
import { ingestMetric } from '../../../../lib/hgs';
function allowed(req){const secret=process.env.HGS_INGEST_SECRET;if(!secret)return false;const auth=req.headers.get('authorization');return auth===`Bearer ${secret}`;}
export async function POST(req){
  if(!allowed(req))return NextResponse.json({error:'unauthorized'},{status:401});
  try{const body=await req.json();const items=Array.isArray(body)?body:[body];if(items.length>100)return NextResponse.json({error:'max 100 metrics/request'},{status:400});const created=[];for(const m of items){const p=await ingestMetric(m);created.push({id:p.id,url:p.url});}return NextResponse.json({ok:true,created},{status:201});}catch(e){return NextResponse.json({ok:false,error:e.message},{status:400})}
}
