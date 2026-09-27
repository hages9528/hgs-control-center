import { NextResponse } from 'next/server';
import { configured, queryDataSource } from '../../../lib/notion';
import { DS } from '../../../lib/hgs';
export async function GET(){
  const status={ok:true,notionConfigured:configured(),time:new Date().toISOString()};
  if(configured()){
    try{const r=await queryDataSource(DS.integrations,{page_size:1});status.notionRead=true;status.sampleRows=r.results?.length||0;}
    catch(e){status.ok=false;status.notionRead=false;status.error=e.message;}
  }
  return NextResponse.json(status,{status:status.ok?200:503});
}
