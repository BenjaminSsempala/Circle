import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AccountMenu } from '@/app/components/nav/AccountMenu';
import { MemoryCardStack } from './MemoryCardStack';
import type { MemoryCardData } from './MemoryCardStack';
import NavbarCircleClient from './NavBarCircleClient';

const MOOD_EMOJI: Record<string, string> = {
  magical: '✨', meaningful: '❤️', energetic: '🎉', professional: '🤝', inspiring: '🌱',
};

function fmtShortDate(date: string | null | undefined) {
  if (!date) return { day: '-', month: '' };
  const d = date.includes('T') ? new Date(date) : new Date(`${date}T00:00:00Z`);
  return {
    day: d.getDate().toString(),
    month: d.toLocaleDateString('en-GB', { month: 'short' }),
  };
}

function groupByMonth(bookings: { gig_date?: string | null; delivery_date?: string | null }[]) {
  const groups: Record<string, number[]> = {};
  bookings.forEach((b, i) => {
    const date = b.gig_date ?? b.delivery_date;
    if (!date) { (groups['Undated'] ??= []).push(i); return; }
    const key = new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }).toUpperCase();
    (groups[key] ??= []).push(i);
  });
  return groups;
}

type BookingRow = {
  id: string;
  artist_id: string;
  booking_type: string | null;
  gig_date: string | null;
  delivery_date: string | null;
  created_at: string;
  state: string;
  artists: { id: string; display_name: string; profile_photo: string | null; slug: string } | null;
  packages: { name: string } | null;
  reviews: { mood: string | null; comment: string | null }[];
};

export default async function MyCirclePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?redirect=/my-circle');

  const { data: artistProfile } = await (await createClient())
    .from('artists').select('id').eq('user_id', user.id).maybeSingle();
  if (artistProfile) redirect('/dashboard');

  const [completedRes, savedRes] = await Promise.all([
    (await createClient())
      .from('bookings')
      .select('id, artist_id, booking_type, gig_date, delivery_date, created_at, state, artists(id, display_name, profile_photo, slug), packages(name), reviews(mood, comment)')
      .eq('audience_id', user.id)
      .in('state', ['COMPLETED', 'AUTO_RELEASED'])
      .order('gig_date', { ascending: false, nullsFirst: false }),
    (await createClient())
      .from('saved_artists')
      .select('artist_id, artists(id, display_name, profile_photo, slug)')
      .eq('audience_id', user.id)
      .limit(5),
  ]);

  const bookings = (completedRes.data ?? []) as unknown as BookingRow[];
  const savedData = savedRes.data ?? [];

  const memories: MemoryCardData[] = bookings
    .filter((b) => {
      const review = Array.isArray(b.reviews) ? b.reviews[0] : null;
      return !!review?.mood;
    })
    .map((b) => ({
      id: b.id,
      artistName: b.artists?.display_name ?? 'Artist',
      packageName: b.packages?.name ?? 'Booking',
      date: b.gig_date ?? b.delivery_date ?? b.created_at,
      mood: (Array.isArray(b.reviews) ? b.reviews[0]?.mood : null) ?? '',
    }));

  const artistCount = new Set(bookings.map((b) => b.artist_id)).size;
  const workshopCount = bookings.filter((b) => b.booking_type === 'workshop').length;
  const commissionedCount = bookings.filter((b) => b.booking_type === 'commissioned_piece').length;

  const stats = [
    { label: 'Artists', value: artistCount },
    { label: 'Experiences', value: bookings.length },
    { label: 'Workshops', value: workshopCount },
    { label: 'Commissioned', value: commissionedCount },
  ].filter((s) => s.value > 0);

  const monthGroups = groupByMonth(bookings);
  const isEmpty = bookings.length === 0 && savedData.length === 0;

  return (
    <div className="bg-[#F5F3EF] min-h-screen flex flex-col font-sans text-on-surface">
      {/* Responsive Header Component */}
      <NavbarCircleClient accountMenu={<AccountMenu />} />

      {/* Main Content Area - Expands vertically to keep footer at the bottom */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-8 md:py-12 flex flex-col justify-center">
        <div className="w-full flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
          
          {/* Left Block */}
          <div className="flex-1 min-w-0 w-full flex flex-col gap-8 md:gap-10">
            {isEmpty ? (
              <div className="flex flex-col items-center text-center gap-6 py-12 px-4 my-auto">
                <div className="w-20 h-20 rounded-full bg-[#E1F5EE] flex items-center justify-center text-4xl">✦</div>
                <div>
                  <h1 className="font-playfair text-3xl md:text-4xl font-bold text-on-surface mb-3">Your Circle starts here.</h1>
                  <p className="text-on-surface-variant text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                    Every artist you book, every experience you have: they all live here. Your personal record of meaningful moments.
                  </p>
                </div>
                <Link href="/discover" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto bg-primary text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
                    Find your first artist →
                  </button>
                </Link>
                <p className="text-xs text-on-surface-variant">Already have bookings? They&apos;ll appear once completed.</p>
              </div>
            ) : (
              <h1 className="font-playfair text-3xl md:text-4xl font-bold text-on-surface">My Circle</h1>
            )}

            {/* Stats Breakdown Grid */}
            {stats.length > 0 && (
              <div className={`grid gap-4 w-full ${stats.length === 1 ? 'grid-cols-1 max-w-xs' : stats.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
                {stats.map((stat) => (
                  <div key={stat.label} className="bg-white border border-outline-variant/30 rounded-xl p-4 sm:p-5">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant mb-1">{stat.label}</p>
                    <p className="text-3xl sm:text-4xl font-bold text-primary">{stat.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Mobile Cards Interleaved Position */}
            {!isEmpty && memories.length > 0 && (
              <div className="lg:hidden flex justify-center py-2 w-full overflow-hidden">
                <MemoryCardStack memories={memories} />
              </div>
            )}

            {/* Saved Block */}
            {savedData.length > 0 && (
              <div className="w-full">
                <div className="flex justify-between items-end mb-4">
                  <h2 className="text-xs sm:text-sm font-mono uppercase tracking-widest text-on-surface-variant">Saved artists</h2>
                  <Link href="/saved" className="text-xs font-mono uppercase tracking-widest text-primary hover:opacity-70">See all →</Link>
                </div>
                <div className="flex gap-5 overflow-x-auto pb-2 no-scrollbar">
                  {savedData.map((s) => {
                    const a = (s as unknown as { artists: { id: string; display_name: string; profile_photo: string | null; slug: string } | null }).artists;
                    if (!a) return null;
                    return (
                      <Link key={s.artist_id} href={`/${a.slug}`} className="flex-shrink-0 flex flex-col items-center gap-1.5 group">
                        {a.profile_photo ? (
                          <img src={a.profile_photo} alt={a.display_name} className="w-14 h-14 rounded-full object-cover border-2 border-transparent group-hover:border-primary transition-all" />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-transparent group-hover:border-primary transition-all" />
                        )}
                        <span className="text-xs text-on-surface-variant text-center max-w-[56px] truncate">{a.display_name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Timeline Segment */}
            {bookings.length > 0 && (
              <div className="flex flex-col gap-6 md:gap-8 w-full">
                <h2 className="text-xs sm:text-sm font-mono uppercase tracking-widest text-on-surface-variant">Experiences</h2>
                {Object.entries(monthGroups).map(([month, indices]) => (
                  <div key={month} className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-grow bg-outline-variant/50" />
                      <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant px-1">{month}</span>
                      <div className="h-px flex-grow bg-outline-variant/50" />
                    </div>
                    {indices.map((i) => {
                      const b = bookings[i];
                      const a = b.artists;
                      const { day, month: mon } = fmtShortDate(b.gig_date ?? b.delivery_date);
                      const review = Array.isArray(b.reviews) ? b.reviews[0] : null;
                      const moodEmoji = review?.mood ? MOOD_EMOJI[review.mood] : null;
                      const hasMemory = !!review?.mood;
                      return (
                        <Link
                          key={b.id}
                          href={hasMemory ? `/booking/${b.id}/memory` : `/booking/${b.id}`}
                          className="bg-white border border-outline-variant/30 rounded-xl p-4 flex gap-4 hover:shadow-sm hover:border-primary/20 transition-all group w-full"
                        >
                          <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-xl flex flex-col items-center justify-center text-white">
                            <span className="text-[9px] font-mono opacity-60 leading-none uppercase">{mon}</span>
                            <span className="text-xl font-bold leading-tight">{day}</span>
                          </div>
                          <div className="flex-grow min-w-0 self-center">
                            <div className="flex items-center gap-2 mb-0.5">
                              {a?.profile_photo ? (
                                <img src={a.profile_photo} alt={a.display_name} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-primary/10 flex-shrink-0" />
                              )}
                              <span className="font-semibold text-sm text-on-surface truncate">{a?.display_name ?? 'Artist'}</span>
                              {moodEmoji && <span className="text-sm ml-auto flex-shrink-0">{moodEmoji}</span>}
                            </div>
                            <p className="text-xs text-on-surface-variant truncate">{b.packages?.name ?? 'Booking'}</p>
                          </div>
                          <div className="flex-shrink-0 self-center">
                            <span className="text-xs font-mono text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                              {hasMemory ? 'Memory →' : 'View →'}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* Footer Discover Widget Promotion Box */}
            {!isEmpty && (
              <div className="bg-[#E1F5EE] rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                <div>
                  <p className="font-semibold text-sm text-primary mb-0.5">Ready for another experience?</p>
                  <p className="text-xs text-on-surface-variant">Browse artists and book something new.</p>
                </div>
                <Link href="/discover" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity text-center">
                    Explore →
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Right Desktop Sticky Frame */}
          {!isEmpty && memories.length > 0 && (
            <div className="hidden lg:block w-[260px] flex-shrink-0">
              <div className="sticky top-24 pt-2">
                <MemoryCardStack memories={memories} />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Sealed Viewport Footer Bottom Component */}
      <footer className="bg-white border-t border-outline-variant/30 py-6 md:py-8 px-4 sm:px-6 md:px-10 w-full shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <span className="text-base sm:text-lg font-bold text-primary">Engero</span>
          <div className="flex gap-6 text-sm">
            {['Privacy', 'Terms', 'Support'].map((item) => (
              <a key={item} href="#" className="text-on-surface-variant hover:text-primary transition-colors">{item}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}