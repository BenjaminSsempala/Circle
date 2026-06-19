import { Banner } from './ui';
import type { BookingState } from '@/lib/services/bookings';

export function ContractStatusBanner({ state, role }: { state: BookingState; role: 'artist' | 'audience' }) {
  switch (state) {
    case 'CONTRACT_DRAFT':
      return role === 'artist'
        ? <Banner variant="teal" text="Review the contract below, add any extra clauses, then send it to your client." />
        : <Banner variant="teal" text="The artist is preparing your contract. You'll be notified once it's ready to review." />;

    case 'CONTRACT_SENT':
      return role === 'audience'
        ? <Banner variant="amber" text="Please review the contract below, download it, sign it, and upload your signed copy." step="Step 1 of 2" />
        : <Banner variant="teal" text="Your contract has been sent. Waiting for your client to sign and upload their copy." />;

    case 'AUDIENCE_UPLOADED':
      return role === 'artist'
        ? <Banner variant="amber" text="Your client has uploaded their signed copy. Download it, countersign, and upload your copy." step="Step 2 of 2" />
        : <Banner variant="teal" text="Your signed copy has been received. Waiting for the artist to countersign." />;

    case 'CONTRACT_SIGNED':
      return <Banner variant="green" text="Both copies are signed. This contract is complete. Payment processing is coming soon." />;

    default:
      return null;
  }
}
