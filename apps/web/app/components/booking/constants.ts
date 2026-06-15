// Shared visual language for the booking + contract flow.
// Teal matches tailwind `primary` (#005440); amber (#d98620) has no token so we use arbitrary values.

export const AMBER = '#d98620';

export const STATE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  REQUESTED:         { label: 'Waiting for the artist to respond', color: AMBER, bg: 'rgba(217,134,32,0.1)' },
  ACCEPTED:          { label: 'Accepted — contract incoming', color: '#005440', bg: 'rgba(0,84,64,0.07)' },
  DECLINED:          { label: 'Declined', color: '#6f7a74', bg: 'rgba(0,0,0,0.04)' },
  CONTRACT_DRAFT:    { label: 'Contract being prepared', color: '#005440', bg: 'rgba(0,84,64,0.07)' },
  CONTRACT_SENT:     { label: 'Contract ready to review', color: '#005440', bg: 'rgba(0,84,64,0.07)' },
  AUDIENCE_UPLOADED: { label: 'Signed copy received — awaiting countersignature', color: '#005440', bg: 'rgba(0,84,64,0.07)' },
  CONTRACT_SIGNED:   { label: 'Contract complete — payment step is next', color: '#198551', bg: 'rgba(25,133,81,0.08)' },
  PAYMENT_PENDING:   { label: 'Payment pending', color: AMBER, bg: 'rgba(217,134,32,0.1)' },
  PAYMENT_HELD:      { label: 'Payment held in escrow', color: '#198551', bg: 'rgba(25,133,81,0.08)' },
  GIG_ACTIVE:        { label: 'Booking confirmed', color: '#198551', bg: 'rgba(25,133,81,0.08)' },
  CHECKED_IN:        { label: 'Artist checked in', color: '#198551', bg: 'rgba(25,133,81,0.08)' },
  CONFIRMING:        { label: 'Confirm to release payment', color: AMBER, bg: 'rgba(217,134,32,0.1)' },
  COMPLETED:         { label: 'Complete', color: '#198551', bg: 'rgba(25,133,81,0.08)' },
  AUTO_RELEASED:     { label: 'Complete — auto-released', color: '#198551', bg: 'rgba(25,133,81,0.08)' },
  DISPUTED:          { label: 'Disputed', color: '#c0392b', bg: 'rgba(192,57,43,0.08)' },
  CANCELLED:         { label: 'Cancelled', color: '#6f7a74', bg: 'rgba(0,0,0,0.04)' },
  REFUNDED:          { label: 'Refunded', color: '#6f7a74', bg: 'rgba(0,0,0,0.04)' },
};
