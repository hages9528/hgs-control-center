import { NextResponse } from 'next/server';
import { getOverview } from '../../../lib/hgs';
export async function GET(){try{return NextResponse.json(await getOverview())}catch(e){return NextResponse.json({error:e.message},{status:503})}}
