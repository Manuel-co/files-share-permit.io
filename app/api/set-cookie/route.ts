import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ success: false, message: "No token provided" }, { status: 400 });
  }

  const response = NextResponse.json({ success: true });
  
  response.cookies.set({
    name: 'token',
    value: token,
    httpOnly: true,  // Makes it unavailable to JavaScript
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
