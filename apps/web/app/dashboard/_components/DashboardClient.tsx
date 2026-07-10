'use client';

import { createContext, useState, useContext } from 'react';
import { ExportModal } from '@/app/[slug]/_components/ExportModal';
import type { ExportModalMode } from '@/app/[slug]/_components/ExportModal';

interface DashboardContextType {
  onOpenExport: (mode: ExportModalMode) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboardExport() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardExport must be used within DashboardClient');
  }
  return context;
}

interface DashboardClientProps {
  artist: any;
  children: React.ReactNode;
}

export function DashboardClient({ artist, children }: DashboardClientProps) {
  const [exportModal, setExportModal] = useState<ExportModalMode | null>(null);

  const onOpenExport = (mode: ExportModalMode) => {
    setExportModal(mode);
  };

  if (!artist) return <>{children}</>;

  return (
    <DashboardContext.Provider value={{ onOpenExport }}>
      <>
        {children}
        {exportModal && (
          <ExportModal
            mode={exportModal}
            slug={artist.slug}
            artistName={artist.name}
            hasPhoto={!!artist.profile_photo}
            hasBio={!!artist.bio}
            hasTagline={!!artist.tagline}
            artistPhoto={artist.profile_photo ?? null}
            artistTagline={(artist as Record<string, unknown>).tagline as string | null ?? null}
            artistBio={artist.bio ?? null}
            artistCity={(artist as Record<string, unknown>).city as string | null ?? null}
            artistCountry={(artist as Record<string, unknown>).country as string | null ?? null}
            artForms={Array.isArray(artist.art_forms) ? (artist.art_forms as string[]) : []}
            artistTags={Array.isArray(artist.tags) ? (artist.tags as string[]) : null}
            socialLinks={(artist.social_links as Record<string, string>) ?? {}}
            selectedWorks={(Array.isArray(artist.selected_works) ? artist.selected_works : []) as any[]}
            packages={[]}
            savedEPK={(artist as Record<string, unknown>).epk_data as any ?? null}
            savedRC={(artist as Record<string, unknown>).rate_card_data as any ?? null}
            onClose={() => setExportModal(null)}
          />
        )}
      </>
    </DashboardContext.Provider>
  );
}
