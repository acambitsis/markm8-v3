import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Require authentication in server components or actions.
 * Throws an error if not authenticated.
 * @returns The authenticated user's ID
 */
export async function requireAuth(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  return userId;
}

/**
 * Result type for API route authentication
 */
type AuthResult =
  | { userId: string; error: null }
  | { userId: null; error: NextResponse };

/**
 * Require authentication in API routes.
 * Returns a response object on failure instead of throwing.
 * @returns Object with either userId or error response
 */
export async function requireAuthApi(): Promise<AuthResult> {
  const { userId } = await auth();

  if (!userId) {
    return {
      userId: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { userId, error: null };
}
