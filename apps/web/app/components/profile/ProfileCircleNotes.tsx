const MOOD_EMOJI: Record<string, string> = {
  magical: '✨', meaningful: '❤️', energetic: '🎉', professional: '🤝', inspiring: '🌱',
};

type Review = {
  mood: string | null;
  comment: string | null;
  stars?: number | null;
  rater_id: string;
};

export function ProfileCircleNotes({
  reviews,
  raterNames = {},
}: {
  reviews: Review[];
  raterNames?: Record<string, string>;
}) {
  const qualifying = reviews.filter((r) => r.mood && r.comment && r.comment.trim().length > 0).slice(0, 6);
  if (qualifying.length === 0) return null;

  return (
    <div>
      <h2 className="font-playfair text-[28px] font-bold text-primary mb-6">Notes from Audience</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {qualifying.map((r, i) => {
          const firstName = raterNames[r.rater_id] ?? 'Audience';
          return (
            <div key={i} className="bg-white rounded-xl p-6 border border-outline-variant/20 shadow-sm flex flex-col gap-4">
              <span className="font-playfair text-[32px] text-primary leading-none">&ldquo;</span>
              <p className="font-playfair italic text-sm text-[#1A1A1A] line-clamp-3 leading-relaxed -mt-4">
                {r.comment}
              </p>
              <div className="flex items-center gap-2 mt-auto">
                <span className="text-sm">{MOOD_EMOJI[r.mood!] ?? '✨'}</span>
                <span className="text-[13px] text-on-surface-variant font-medium">{firstName}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
