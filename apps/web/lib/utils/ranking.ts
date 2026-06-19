export type ScoringArtist = {
  profile_photo: string | null;
  bio: string | null;
  completed_bookings?: number;
};

export function calculateRankingScore(artist: ScoringArtist, hasPackages: boolean): number {
  return (artist.profile_photo ? 20 : 0)
    + (artist.bio && artist.bio.length > 50 ? 15 : 0)
    + (hasPackages ? 25 : 0)
    + ((artist.completed_bookings ?? 0) * 2);
}
