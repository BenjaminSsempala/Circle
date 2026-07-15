import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getArtistByUserIdCached } from '@/lib/services/artists';
import { getPackageInspiration, resolveInspirationDisplay } from '@/lib/services/inspiration';

function formatPrice(price: number, currency: string) {
  return `${currency} ${Number(price).toLocaleString()}`;
}

export default async function PackageInspirationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const artistResult = await getArtistByUserIdCached(user.id);
  const artist = artistResult.ok ? artistResult.artist : null;
  if (!artist) redirect('/dashboard');

  const primaryArtForm = Array.isArray(artist.art_forms) ? artist.art_forms[0] ?? null : null;

  const cards = await getPackageInspiration({
    excludeArtistId: artist.id,
    artForm: primaryArtForm,
    limit: 24,
  });

  // Below the threshold (including zero live examples), fall back to templates.
  const display = resolveInspirationDisplay(cards, primaryArtForm, 3);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      {/* Back navigation */}
      <Link
        href="/dashboard/packages"
        className="inline-flex items-center gap-1.5 min-h-[44px] text-on-surface-variant hover:text-primary text-label-mono font-label-mono text-sm transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to packages
      </Link>

      <h1 className="text-headline-lg font-headline-lg text-on-surface mt-4 mb-2">How artists price their work</h1>
      <p className="text-body-md font-body-md text-on-surface-variant mb-8">
        See how working artists on Engero structure their offerings. Use any as a starting point for your own.
      </p>

      {display.kind === 'templates' ? (
        <>
          <p className="text-label-mono font-label-mono text-on-surface-variant text-xs uppercase tracking-wider mb-3">
            Template ideas
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {display.templates.map((t) => (
              <div key={t.id} className="bg-surface border border-outline-variant/30 rounded-xl p-5 flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-secondary bg-secondary-container/40 px-2 py-0.5 rounded-full">
                    Template
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-on-surface-variant">{t.duration}</span>
                </div>
                <h3 className="text-headline-md font-headline-md text-on-surface">{t.name}</h3>
                <p className="text-body-md font-body-md text-on-surface-variant mt-1 mb-4 line-clamp-3">{t.description}</p>
                <Link
                  href={`/dashboard/packages?template=${encodeURIComponent(t.id)}`}
                  className="mt-auto min-h-[44px] inline-flex items-center justify-center rounded-lg border border-primary/40 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors"
                >
                  Use as template
                </Link>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {display.cards.map((card) => (
            <div key={card.packageId} className="bg-surface border border-outline-variant/30 rounded-xl p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {card.artForm}
                </span>
                {card.artistSlug && (
                  <Link
                    href={`/${card.artistSlug}`}
                    className="text-caption font-caption text-on-surface-variant hover:text-primary hover:underline"
                  >
                    {card.artistName}
                  </Link>
                )}
              </div>
              <h3 className="text-headline-md font-headline-md text-on-surface">{card.packageName}</h3>
              <div className="flex items-center gap-2 mt-1 mb-2">
                {card.duration && (
                  <span className="bg-surface-container border border-outline-variant/30 text-on-surface-variant text-xs px-2.5 py-1 rounded-full">
                    {card.duration}
                  </span>
                )}
                <span className="text-label-mono font-label-mono text-on-surface font-bold text-sm">
                  {formatPrice(card.price, card.currency)}
                </span>
              </div>
              {card.description && (
                <p className="text-body-md font-body-md text-on-surface-variant mb-4 line-clamp-3">{card.description}</p>
              )}
              <Link
                href={`/dashboard/packages?example=${encodeURIComponent(card.packageId)}`}
                className="mt-auto min-h-[44px] inline-flex items-center justify-center rounded-lg border border-primary/40 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors"
              >
                Use as template
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
