import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateSlug, isValidSlug } from '@/lib/utils/slug';

// ─── generateSlug ─────────────────────────────────────────────────────────────

describe('generateSlug', () => {
  it('lowercases the name', () => {
    expect(generateSlug('NAIRA MARLEY')).toBe('naira-marley');
  });

  it('trims leading/trailing whitespace', () => {
    expect(generateSlug('  bob marley  ')).toBe('bob-marley');
  });

  it('replaces spaces with hyphens', () => {
    expect(generateSlug('John Doe')).toBe('john-doe');
  });

  it('removes non-alphanumeric characters (except spaces)', () => {
    expect(generateSlug("O'Neal & Friends")).toBe('oneal-friends');
  });

  it('collapses multiple spaces into single hyphen', () => {
    expect(generateSlug('A   B   C')).toBe('a-b-c');
  });

  it('removes leading and trailing hyphens', () => {
    // Name that starts/ends with special chars
    expect(generateSlug('!hello!')).toBe('hello');
  });

  it('returns artist-{timestamp} for empty/invalid names', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-19T12:00:00Z'));
    const result = generateSlug('!!!');
    expect(result).toMatch(/^artist-\d+$/);
    vi.useRealTimers();
  });

  it('returns artist-{timestamp} for whitespace-only names', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-19T12:00:00Z'));
    const result = generateSlug('   ');
    expect(result).toMatch(/^artist-\d+$/);
    vi.useRealTimers();
  });

  it('handles single-word names', () => {
    expect(generateSlug('Naira')).toBe('naira');
  });

  it('handles names with numbers', () => {
    expect(generateSlug('Artist 2026')).toBe('artist-2026');
  });
});

// ─── isValidSlug ──────────────────────────────────────────────────────────────

describe('isValidSlug', () => {
  it('returns false for empty string', () => {
    expect(isValidSlug('')).toBe(false);
  });

  it('returns false for slug shorter than 3 chars', () => {
    expect(isValidSlug('ab')).toBe(false);
  });

  it('returns false for slug longer than 50 chars', () => {
    expect(isValidSlug('a'.repeat(51))).toBe(false);
  });

  it('returns true for valid slug with hyphens', () => {
    expect(isValidSlug('naira-marley')).toBe(true);
  });

  it('returns true for slug with numbers', () => {
    expect(isValidSlug('artist-2026')).toBe(true);
  });

  it('returns false for slug starting with hyphen', () => {
    expect(isValidSlug('-invalid')).toBe(false);
  });

  it('returns false for slug ending with hyphen', () => {
    expect(isValidSlug('invalid-')).toBe(false);
  });

  it('returns false for slug with uppercase letters', () => {
    expect(isValidSlug('Invalid-Slug')).toBe(false);
  });

  it('returns false for slug with special characters', () => {
    expect(isValidSlug('my_slug!')).toBe(false);
  });

  it('returns true for exactly 3-character slug', () => {
    expect(isValidSlug('abc')).toBe(true);
  });

  it('returns true for exactly 50-character slug', () => {
    expect(isValidSlug('a'.repeat(50))).toBe(true);
  });

  it('returns true for all-lowercase alphabetic slug', () => {
    expect(isValidSlug('johnbandamusic')).toBe(true);
  });
});
