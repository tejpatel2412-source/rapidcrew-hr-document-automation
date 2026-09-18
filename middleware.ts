import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE_NAME, isValidAccessToken } from './lib/access';

export async function middleware(request:NextRequest){
  const {pathname}=request.nextUrl;
  if(pathname.startsWith('/api/access') || pathname.startsWith('/api/lock')) return NextResponse.next();

  const password=process.env.RAPIDCREW_ACCESS_PASSWORD;
  const token=request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const allowed=await isValidAccessToken(token,password);

  if(pathname==='/access'){
    if(allowed) return NextResponse.redirect(new URL('/',request.url));
    return NextResponse.next();
  }
  if(!allowed) return NextResponse.redirect(new URL('/access',request.url));
  return NextResponse.next();
}

export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)']};
