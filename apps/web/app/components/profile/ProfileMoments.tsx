'use client';

import { useState } from 'react';
import Link from 'next/link';

type Moment = {
  id: string;
  story: string;
  occasion_type: string | null;
  photo_url: string | null;
};

const OCCASION_LABELS: Record<string, string> = {
  birthday: 'Birthday', corporate: 'Corporate', wedding: 'Wedding',
  workshop: 'Workshop', festival: 'Festival', school: 'School',
  private: 'Private', other: 'Other',
};

function MomentCard({ moment }: { moment: Moment }) {
  const [expanded, setExpanded] = useState(false);
  const label = moment.occasion_type ? OCCASION_LABELS[moment.occasion_type] ?? moment.occasion_type : null;

  return (
    <div className="bg-[#F5F3EF] rounded-xl p-6 border border-outline-variant/30 shadow-sm flex flex-col justify-between h-full">
      <div>
        {label && (
          <span className="inline-block bg-[#E8F0E8] text-[#3D5A4D] px-3 py-1 rounded-full text-xs font-medium mb-4">
            {label}
          </span>
        )}
        <p className={`text-[13px] text-[#333333] leading-relaxed mb-3 ${expanded ? '' : 'line-clamp-3'}`}>
          {moment.story}
        </p>
        {moment.story.length > 160 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-primary text-xs font-medium hover:underline"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>
      {moment.photo_url && (
        <div className="flex justify-end mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={moment.photo_url}
            alt="Moment"
            className="w-12 h-12 rounded-lg object-cover border border-outline-variant/20"
          />
        </div>
      )}
    </div>
  );
}

export function ProfileMoments({
  moments,
  isOwner,
}: {
  moments: Moment[];
  isOwner: boolean;
}) {
  if (moments.length === 0) {
    if (!isOwner) return null;
    return (
      <div>
        <h2 className="font-playfair text-[28px] font-bold text-primary mb-6">Moments</h2>
        <div className="border-2 border-dashed border-outline-variant/40 rounded-xl p-8 text-center">
          <p className="text-sm text-on-surface-variant mb-3">
            Add a moment to show audiences the kind of experiences you create.
          </p>
          <Link href="/dashboard/profile" className="text-sm font-medium text-primary underline underline-offset-2">
            Add your first moment →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-playfair text-[28px] font-bold text-primary mb-6">Moments</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {moments.map((m) => (
          <MomentCard key={m.id} moment={m} />
        ))}
      </div>
    </div>
  );
}
