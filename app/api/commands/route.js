import { NextResponse } from 'next/server';
import { DS, enqueueCommand } from '../../../lib/hgs';
import { queryDataSource, pageToObject } from '../../../lib/notion';
export async function GET(){try{const r=await queryDataSource(DS.commands,{sorts:[{timestamp:'last_edited_time',direction:'descending'}]});return NextResponse.json((r.results||[]).map(pageToObject))}catch(e){return NextResponse.json({error:e.message},{status:503})}}
export async function POST(req){try{const body=await req.json();const out=await enqueueCommand(body);return NextResponse.json({ok:true,id:out.id,url:out.url},{status:201})}catch(e){return NextResponse.json({ok:false,error:e.message},{status:400})}}
