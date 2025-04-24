// app/api/auth/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    // Access the token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      console.log('No token found in cookies');
      return NextResponse.json({ isValid: false, message: "No token found" }, { status: 401 });
    }
    
    try {
      // Verify the token with Firebase Admin
      await adminAuth.verifyIdToken(token);
      return NextResponse.json({ isValid: true }, { status: 200 });
    } catch (verifyError) {
      console.error("Token verification error:", verifyError);
      return NextResponse.json({ isValid: false, message: "Invalid token" }, { status: 401 });
    }
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ isValid: false, message: "Server error" }, { status: 500 });
  }
}