'use client';

import { useState } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function toISODate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function todayISO() {
  const t = new Date();
  return toISODate(t.getFullYear(), t.getMonth(), t.getDate());
}

interface Props {
  artistSlug: string;
  initialBlackouts: string[];
  bookedDates: string[];
}

export function AvailabilityClient({ artistSlug, initialBlackouts, bookedDates }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [blackouts, setBlackouts] = useState<Set<string>>(new Set(initialBlackouts));
  const [tooltip, setTooltip] = useState<{ date: string; x: number; y: number } | null>(null);

  const today = todayISO();
  const bookedSet = new Set(bookedDates);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  function goToday() {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }

  // Build grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function handleDayClick(day: number, e: React.MouseEvent) {
    const iso = toISODate(year, month, day);
    if (iso <= today) return; // today and past are read-only
    if (bookedSet.has(iso)) {
      setTooltip({ date: iso, x: e.clientX, y: e.clientY });
      return;
    }

    const isBlackout = blackouts.has(iso);

    // Optimistic update: UI responds instantly
    if (isBlackout) {
      setBlackouts((prev) => { const next = new Set(prev); next.delete(iso); return next; });
      fetch(`/api/artists/${artistSlug}/availability/blackout`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: iso }),
      }).catch(() => {
        // revert on failure
        setBlackouts((prev) => new Set([...prev, iso]));
      });
    } else {
      setBlackouts((prev) => new Set([...prev, iso]));
      fetch(`/api/artists/${artistSlug}/availability/blackout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: iso }),
      }).catch(() => {
        // revert on failure
        setBlackouts((prev) => { const next = new Set(prev); next.delete(iso); return next; });
      });
    }
  }

  function removeBlackout(iso: string) {
    setBlackouts((prev) => { const next = new Set(prev); next.delete(iso); return next; });
    fetch(`/api/artists/${artistSlug}/availability/blackout`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: iso }),
    }).catch(() => {
      setBlackouts((prev) => new Set([...prev, iso]));
    });
  }

  // Next availability: start from tomorrow (i=1)
  const nextAvail = (() => {
    for (let i = 1; i <= 90; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const iso = toISODate(d.getFullYear(), d.getMonth(), d.getDate());
      if (!blackouts.has(iso) && !bookedSet.has(iso)) return iso;
    }
    return null;
  })();

  const upcomingBlackouts = [...blackouts]
    .filter((d) => d > today)
    .sort()
    .slice(0, 10);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2 bg-surface border border-outline-variant/30 rounded-2xl p-6">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToday}
            className="border border-outline-variant/40 text-on-surface text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-surface-container transition-colors"
          >
            Today
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
            >
              ‹
            </button>
            <span className="text-label-mono font-label-mono text-on-surface font-semibold min-w-[140px] text-center">
              {MONTHS[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
            >
              ›
            </button>
          </div>
          <div className="w-20" />
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-caption font-caption text-on-surface-variant py-2 text-xs uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="aspect-square" />;

            const iso = toISODate(year, month, day);
            const isPast = iso <= today;
            const isToday = iso === today;
            const isBlackout = blackouts.has(iso);
            const isBooked = bookedSet.has(iso);

            let cellClass = 'aspect-square flex flex-col items-center justify-start pt-2 rounded-lg text-sm font-medium transition-colors select-none';

            if (isPast) {
              cellClass += ' text-on-surface-variant/30 cursor-default';
            } else if (isBooked) {
              cellClass += ' bg-primary text-on-primary cursor-pointer';
            } else if (isBlackout) {
              cellClass += ' bg-error/10 text-error hover:bg-error/20 cursor-pointer';
            } else if (isToday) {
              cellClass += ' ring-2 ring-primary text-primary cursor-default';
            } else {
              cellClass += ' hover:bg-surface-container text-on-surface cursor-pointer';
            }

            return (
              <div
                key={iso}
                className={cellClass}
                onClick={(e) => !isPast && handleDayClick(day, e)}
              >
                <span className={`leading-none ${isToday ? 'font-bold' : ''}`}>{day}</span>
                {isBooked && (
                  <span className="text-[8px] text-on-primary/80 mt-0.5 leading-none">Booked</span>
                )}
                {isBlackout && !isBooked && (
                  <span className="text-error mt-1 text-xs leading-none">✕</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-outline-variant/20">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-outline-variant/40" />
            <span className="text-caption font-caption text-on-surface-variant">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-error/10 flex items-center justify-center">
              <span className="text-error text-[8px]">✕</span>
            </div>
            <span className="text-caption font-caption text-on-surface-variant">Unavailable (Blackout)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary" />
            <span className="text-caption font-caption text-on-surface-variant">Booked</span>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="flex flex-col gap-4">
        {/* Next availability */}
        {nextAvail && (
          <div className="bg-primary text-on-primary rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-3">Next Availability</p>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 opacity-80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-label-mono font-label-mono font-bold">
                {new Date(nextAvail + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        )}

        {/* Upcoming blackouts */}
        <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5">
          <h3 className="text-label-mono font-label-mono text-primary font-semibold text-sm mb-1">
            Upcoming Blackouts
          </h3>
          <p className="text-caption font-caption text-on-surface-variant mb-4">
            Click any future date on the calendar to block or unblock it.
          </p>

          {upcomingBlackouts.length === 0 ? (
            <p className="text-caption font-caption text-on-surface-variant">No blackout dates set.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingBlackouts.map((iso) => (
                <div key={iso} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-label-mono font-label-mono text-on-surface text-xs font-semibold">Unavailable</p>
                    <p className="text-caption font-caption text-on-surface-variant">
                      {new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <button
                    onClick={() => removeBlackout(iso)}
                    className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-error transition-colors"
                    title="Remove blackout"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booked date tooltip */}
      {tooltip && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setTooltip(null)} />
          <div
            className="fixed z-50 bg-on-surface text-surface text-xs px-3 py-2 rounded-lg shadow-lg"
            style={{ left: tooltip.x + 8, top: tooltip.y - 40 }}
          >
            Booked on {new Date(tooltip.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </div>
        </>
      )}
    </div>
  );
}
