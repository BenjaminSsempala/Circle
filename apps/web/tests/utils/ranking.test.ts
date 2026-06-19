import { describe, it, expect } from 'vitest';
import { calculateRankingScore } from '@/lib/utils/ranking';

// ─── calculateRankingScore ────────────────────────────────────────────────────

describe('calculateRankingScore', () => {
  it('returns 0 for artist with nothing set', () => {
    const artist = { profile_photo: null, bio: null, completed_bookings: 0 };
    expect(calculateRankingScore(artist, false)).toBe(0);
  });

  it('adds 20 points for having a profile photo', () => {
    const artist = { profile_photo: 'https://cdn.example.com/photo.jpg', bio: null };
    expect(calculateRankingScore(artist, false)).toBe(20);
  });

  it('adds 15 points for bio longer than 50 chars', () => {
    const artist = { profile_photo: null, bio: 'a'.repeat(51) };
    expect(calculateRankingScore(artist, false)).toBe(15);
  });

  it('does NOT add 15 points for bio of exactly 50 chars (boundary)', () => {
    const artist = { profile_photo: null, bio: 'a'.repeat(50) };
    expect(calculateRankingScore(artist, false)).toBe(0);
  });

  it('does NOT add points for bio shorter than 50 chars', () => {
    const artist = { profile_photo: null, bio: 'Short bio.' };
    expect(calculateRankingScore(artist, false)).toBe(0);
  });

  it('adds 25 points when artist has active packages', () => {
    const artist = { profile_photo: null, bio: null };
    expect(calculateRankingScore(artist, true)).toBe(25);
  });

  it('adds 2 points per completed booking', () => {
    const artist = { profile_photo: null, bio: null, completed_bookings: 5 };
    expect(calculateRankingScore(artist, false)).toBe(10); // 5 * 2
  });

  it('treats undefined completed_bookings as 0', () => {
    const artist = { profile_photo: null, bio: null };
    expect(calculateRankingScore(artist, false)).toBe(0);
  });

  it('combines all factors correctly for a complete artist', () => {
    const artist = {
      profile_photo: 'https://cdn.example.com/p.jpg',
      bio: 'a'.repeat(60),    // 15 pts
      completed_bookings: 10, // 20 pts
    };
    // 20 (photo) + 15 (bio) + 25 (packages) + 20 (10 bookings * 2)
    expect(calculateRankingScore(artist, true)).toBe(80);
  });

  it('does not add package points when hasPackages is false', () => {
    const artist = { profile_photo: 'https://photo.jpg', bio: 'a'.repeat(51), completed_bookings: 0 };
    expect(calculateRankingScore(artist, false)).toBe(35); // 20 + 15
  });

  it('handles null bio correctly (not just empty string)', () => {
    const artist = { profile_photo: null, bio: null, completed_bookings: 0 };
    expect(calculateRankingScore(artist, false)).toBe(0);
  });
});
