import { NextResponse } from 'next/server';
import { getOverview } from '../../../lib/hgs';
import { parsePeriod } from '../../../lib/period';
export async function GET(request){try{const params=Object.fromEntries(request.nextUrl.searchParams);return NextResponse.json(await getOverview(parsePeriod(params)))}catch(e){return NextResponse.json({error:e.message},{status:503})}}
