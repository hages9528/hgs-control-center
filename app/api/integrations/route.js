import { NextResponse } from 'next/server';
import { DS } from '../../../lib/hgs';
import { queryDataSource, pageToObject } from '../../../lib/notion';
export async function GET(){try{const r=await queryDataSource(DS.integrations,{sorts:[{timestamp:'last_edited_time',direction:'descending'}]});return NextResponse.json((r.results||[]).map(pageToObject))}catch(e){return NextResponse.json({error:e.message},{status:503})}}
