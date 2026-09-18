import { NextResponse } from 'next/server';
import { ACCESS_COOKIE_MAX_AGE, ACCESS_COOKIE_NAME, createAccessToken } from '@/lib/access';

export async function POST(request:Request){
  const configured=process.env.RAPIDCREW_ACCESS_PASSWORD;
  if(!configured) return NextResponse.json({error:'Access password is not configured on the server.'},{status:500});
  let password='';
  try{ const body=await request.json(); password=typeof body?.password==='string'?body.password:''; }catch{}
  if(!password || password!==configured) return NextResponse.json({error:'Incorrect password. Please try again.'},{status:401});
  const token=await createAccessToken(configured);
  const response=NextResponse.json({ok:true});
  response.cookies.set({name:ACCESS_COOKIE_NAME,value:token,httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:ACCESS_COOKIE_MAX_AGE});
  return response;
}
