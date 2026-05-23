import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api';
import { signUpWithEmail } from '@/lib/services/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.email || !body?.password || !body?.fullName) {
    return err('email, password and fullName are required', 422);
  }

  if (body.password.length < 8) {
    return err('Password must be at least 8 characters', 422);
  }

  // Safe and clean: Query the public profiles table for duplication safety checks
  const supabase = await createClient();
  const { data: existingUser } = await supabase
    .from('profiles') 
    .select('id')
    .eq('email', body.email)
    .maybeSingle();
    // print email
    console.log('Checking for existing user with email:', body.email);
    
  if (existingUser) {
    return err('This email is already registered. Please log in instead.', 422);
  }

  const result = await signUpWithEmail(body.email, body.password, body.fullName);

  if (!result.ok) return err(result.error, result.status);

  return ok({ userId: result.userId, nextStep: 'email_confirmation' }, 201);
}