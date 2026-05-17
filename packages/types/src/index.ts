// Shared TypeScript types for The Circle

export type ArtForm =
  | 'poet'
  | 'spoken_word'
  | 'musician'
  | 'dancer'
  | 'visual_artist'
  | 'storyteller'
  | 'workshop_facilitator'
  | 'other';

export type MediaType = 'video' | 'audio' | 'image' | 'written';
export type MediaSource = 'youtube' | 'tiktok' | 'instagram' | 'spotify' | 'soundcloud' | 'uploaded';

export interface SocialLinks {
  instagram?: string;
  youtube?:   string;
  tiktok?:    string;
  spotify?:   string;
  soundcloud?: string;
  linkedin?:  string;
  website?:   string;
}

export interface MediaItem {
  id:          string;
  artistId:    string;
  type:        MediaType;
  source:      MediaSource;
  url:         string;
  title:       string;
  thumbnail?:  string;
  duration?:   number;
  excerpt?:    string;
  caption?:    string;
  credit?:     string;
  featured:    boolean;
  order:       number;
  createdAt:   string;
}

export interface PlatformConnection {
  platform:    MediaSource;
  connected:   boolean;
  accessToken?: string;
  lastSyncAt?:  string;
  channelId?:   string;
  channelName?: string;
}

export interface Artist {
  id:               string;
  slug:             string;
  name:             string;
  pronouns?:        string;
  tagline?:         string;
  bio?:             string;
  profilePhoto?:    string;
  featureMedia?:    string;
  artForms:         ArtForm[];
  languages?:       string[];
  city?:            string;
  country?:         string;
  activesSince?:    number;
  socialLinks:      SocialLinks;
  connections:      PlatformConnection[];
  mediaItems:       MediaItem[];
  completedBookings: number;
  memberSince:      string;
  isVerified:       boolean;
  createdAt:        string;
  updatedAt:        string;
}

export type PublicArtist = Omit<Artist, 'connections'> & {
  connections: Omit<PlatformConnection, 'accessToken'>[];
};

export type PackageTier = 'free' | 'standard' | 'premium';

export interface PackageIncludedItem { id: string; text: string }
export interface Package {
  id: string;
  artistId: string;
  name: string;
  description: string;
  duration: string;
  price: number;
  currency: string;
  tier: PackageTier;
  logisticsInclusive: boolean;
  includedItems: PackageIncludedItem[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfilePageData { artist: PublicArtist; packages: Package[] }
