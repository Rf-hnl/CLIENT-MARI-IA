import { NextRequest, NextResponse } from 'next/server';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export async function PUT(request: NextRequest) {
  try {
    const { displayName, photoURL } = await request.json();
    const user = auth.currentUser;

    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const updateData: { displayName?: string; photoURL?: string | null } = {};
    
    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }
    
    if (photoURL !== undefined) {
      updateData.photoURL = photoURL || null;
    }

    await updateProfile(user, updateData);

    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message || 'Profile update failed' },
      { status: 400 }
    );
  }
}