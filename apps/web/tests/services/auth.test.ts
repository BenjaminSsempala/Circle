import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeChain, makeMockClient } from '@/lib/test-utils/supabase';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn() }));
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn() }));

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { sendEmail } from '@/lib/email';
import {
  signUpWithEmail,
  signInWithEmail,
  setUserRole,
  sendPasswordReset,
  resolveRedirect,
} from '@/lib/services/auth';

const mockCreateClient = createClient as unknown as ReturnType<typeof vi.fn>;
const mockCreateServiceClient = createServiceClient as unknown as ReturnType<typeof vi.fn>;
const mockSendEmail = sendEmail as unknown as ReturnType<typeof vi.fn>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeAuthClient(overrides: Partial<{
  signUpResult: unknown;
  signInResult: unknown;
  signOutResult: unknown;
  resetResult: unknown;
  profileRow: unknown;
  generateLinkResult: unknown;
}> = {}) {
  const profileChain = makeChain({ data: overrides.profileRow ?? null, error: null });
  const client = {
    auth: {
      signUp: vi.fn().mockResolvedValue(overrides.signUpResult ?? { data: {}, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue(
        overrides.signInResult ?? { data: { user: null }, error: null },
      ),
      signOut: vi.fn().mockResolvedValue(overrides.signOutResult ?? { error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue(overrides.resetResult ?? { error: null }),
      admin: {
        generateLink: vi.fn().mockResolvedValue(overrides.generateLinkResult ?? { data: { properties: null, user: null }, error: null }),
      },
    },
    from: vi.fn((table: string) => {
      if (table === 'profiles') return profileChain;
      return makeChain({ data: null, error: null });
    }),
  };
  return client;
}

// ─── signUpWithEmail ──────────────────────────────────────────────────────────

describe('signUpWithEmail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns ok:true with userId on success', async () => {
    const client = makeAuthClient({
      generateLinkResult: {
        data: {
          properties: { action_link: 'https://example.com/confirm?token=abc' },
          user: { id: 'user-abc' },
        },
        error: null,
      },
    });
    mockCreateServiceClient.mockReturnValue(client);
    mockSendEmail.mockResolvedValue({ ok: true });

    const result = await signUpWithEmail('test@example.com', 'password123', 'Test User');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.userId).toBe('user-abc');
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'test@example.com', html: expect.any(String) }));
  });

  it('returns ok:false with error message on auth failure', async () => {
    const client = makeAuthClient({
      generateLinkResult: { data: { properties: null, user: null }, error: { message: 'Email already in use' } },
    });
    mockCreateServiceClient.mockReturnValue(client);
    const result = await signUpWithEmail('existing@example.com', 'password', 'Name');
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/Email already in use/);
  });
});

// ─── signInWithEmail ──────────────────────────────────────────────────────────

describe('signInWithEmail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns ok:false when credentials are wrong', async () => {
    const client = makeAuthClient({
      signInResult: { data: { user: null }, error: { message: 'Invalid credentials' } },
    });
    mockCreateClient.mockResolvedValue(client);
    const result = await signInWithEmail('bad@test.com', 'wrong');
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/Invalid credentials/);
  });

  it('blocks login when email is not confirmed', async () => {
    const client = makeAuthClient({
      signInResult: {
        data: {
          user: { id: 'u1', email_confirmed_at: null },
          session: {},
        },
        error: null,
      },
    });
    mockCreateClient.mockResolvedValue(client);
    const result = await signInWithEmail('unconfirmed@test.com', 'password');
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/confirm your email/i);
  });

  it('returns ok:true and redirectTo /dashboard for confirmed artist', async () => {
    const profileRow = { role: 'artist', onboarding_complete: true };
    const client = makeAuthClient({
      signInResult: {
        data: {
          user: { id: 'u2', email_confirmed_at: '2026-01-01T00:00:00Z' },
          session: {},
        },
        error: null,
      },
      profileRow,
    });
    mockCreateClient.mockResolvedValue(client);
    const result = await signInWithEmail('artist@test.com', 'password');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.redirectTo).toBe('/dashboard');
      expect(result.role).toBe('artist');
    }
  });

  it('returns ok:true and redirectTo /discover for confirmed audience', async () => {
    const profileRow = { role: 'audience', onboarding_complete: true };
    const client = makeAuthClient({
      signInResult: {
        data: {
          user: { id: 'u3', email_confirmed_at: '2026-01-01T00:00:00Z' },
          session: {},
        },
        error: null,
      },
      profileRow,
    });
    mockCreateClient.mockResolvedValue(client);
    const result = await signInWithEmail('audience@test.com', 'password');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.redirectTo).toBe('/discover');
  });

  it('redirects artist to /onboarding/artist when onboarding not complete', async () => {
    const profileRow = { role: 'artist', onboarding_complete: false };
    const client = makeAuthClient({
      signInResult: {
        data: {
          user: { id: 'u4', email_confirmed_at: '2026-01-01T00:00:00Z' },
          session: {},
        },
        error: null,
      },
      profileRow,
    });
    mockCreateClient.mockResolvedValue(client);
    const result = await signInWithEmail('new-artist@test.com', 'password');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.redirectTo).toBe('/onboarding/artist');
  });

  it('redirects to role selection when no role set yet', async () => {
    const profileRow = { role: null, onboarding_complete: false };
    const client = makeAuthClient({
      signInResult: {
        data: {
          user: { id: 'u5', email_confirmed_at: '2026-01-01T00:00:00Z' },
          session: {},
        },
        error: null,
      },
      profileRow,
    });
    mockCreateClient.mockResolvedValue(client);
    const result = await signInWithEmail('norole@test.com', 'password');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.redirectTo).toBe('/auth/signup?step=role');
  });
});

// ─── setUserRole ──────────────────────────────────────────────────────────────

describe('setUserRole', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns ok:true on success', async () => {
    const profileChain = makeChain({ data: {}, error: null });
    const client = {
      auth: {},
      from: vi.fn(() => profileChain),
    };
    mockCreateClient.mockResolvedValue(client);
    const result = await setUserRole('user-1', 'artist', 'My Name');
    expect(result.ok).toBe(true);
  });

  it('returns ok:false when upsert fails', async () => {
    const profileChain = makeChain({ data: null, error: { message: 'DB error' } });
    const client = {
      auth: {},
      from: vi.fn(() => profileChain),
    };
    mockCreateClient.mockResolvedValue(client);
    const result = await setUserRole('user-1', 'audience', 'My Name');
    expect(result.ok).toBe(false);
  });
});

// ─── sendPasswordReset ────────────────────────────────────────────────────────

describe('sendPasswordReset', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns ok:true when reset email sent successfully', async () => {
    const client = makeAuthClient({ resetResult: { error: null } });
    mockCreateClient.mockResolvedValue(client);
    const result = await sendPasswordReset('user@test.com', 'http://localhost:3000');
    expect(result.ok).toBe(true);
  });

  it('returns ok:false when reset fails', async () => {
    const client = makeAuthClient({ resetResult: { error: { message: 'Rate limited' } } });
    mockCreateClient.mockResolvedValue(client);
    const result = await sendPasswordReset('user@test.com', 'http://localhost:3000');
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/Rate limited/);
  });
});

// ─── resolveRedirect ──────────────────────────────────────────────────────────

describe('resolveRedirect', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns /dashboard for artist with completed onboarding', async () => {
    const profileRow = { role: 'artist', onboarding_complete: true };
    const client = makeAuthClient({ profileRow });
    mockCreateClient.mockResolvedValue(client);
    const result = await resolveRedirect('user-1');
    expect(result.redirectTo).toBe('/dashboard');
  });

  it('returns /discover for audience with completed onboarding', async () => {
    const profileRow = { role: 'audience', onboarding_complete: true };
    const client = makeAuthClient({ profileRow });
    mockCreateClient.mockResolvedValue(client);
    const result = await resolveRedirect('user-2');
    expect(result.redirectTo).toBe('/discover');
  });

  it('returns /auth/signup?step=role when no profile exists', async () => {
    const client = makeAuthClient({ profileRow: null });
    mockCreateClient.mockResolvedValue(client);
    const result = await resolveRedirect('user-3');
    expect(result.redirectTo).toBe('/auth/signup?step=role');
  });
});
