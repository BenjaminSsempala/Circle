import { createServiceClient } from '@/lib/supabase/service';
import { sendEmail } from '@/lib/email';
import type { Booking, BookingEvent } from '@/lib/services/bookings';
import type { Contract } from '@/lib/services/contracts';
import * as templates from '@/lib/emails/booking';

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://engero.art';
}

async function getParties(booking: Booking) {
  const { data: artist } = await createServiceClient()
    .from('artists')
    .select('display_name, user_id')
    .eq('id', booking.artist_id)
    .maybeSingle();

  const { data: pkg } = await createServiceClient()
    .from('packages')
    .select('name')
    .eq('id', booking.package_id)
    .maybeSingle();

  let artistEmail: string | null = null;
  if (artist?.user_id) {
    const { data: profile } = await createServiceClient()
      .from('profiles')
      .select('email')
      .eq('id', artist.user_id)
      .maybeSingle();
    artistEmail = profile?.email ?? null;
  }

  return {
    artistName: artist?.display_name ?? 'Artist',
    artistEmail,
    packageName: pkg?.name ?? 'package',
  };
}

// ─── Booking event notifications ──────────────────────────────────────────────

export async function notifyBookingEvent(
  event: BookingEvent,
  booking: Booking,
  contract?: Contract,
): Promise<void> {
  const { artistName, artistEmail, packageName } = await getParties(booking);
  const audienceName = booking.audience_name ?? 'there';
  const audienceEmail = booking.audience_email;

  const bookingUrl = `${siteUrl()}/booking/${booking.id}`;
  const contractUrl = `${siteUrl()}/booking/${booking.id}/contract`;

  switch (event.to_state) {
    case 'REQUESTED':
      if (artistEmail) await sendEmail({ to: artistEmail, ...templates.requestedArtistEmail(audienceName, packageName, bookingUrl) });
      if (audienceEmail) await sendEmail({ to: audienceEmail, ...templates.requestedAudienceEmail(artistName, bookingUrl) });
      break;

    case 'ACCEPTED':
      if (artistEmail) await sendEmail({ to: artistEmail, ...templates.acceptedArtistEmail(audienceName, bookingUrl) });
      if (audienceEmail) await sendEmail({ to: audienceEmail, ...templates.acceptedAudienceEmail(artistName, bookingUrl) });
      break;

    case 'DECLINED':
      if (artistEmail) await sendEmail({ to: artistEmail, ...templates.declinedArtistEmail(audienceName) });
      if (audienceEmail) await sendEmail({ to: audienceEmail, ...templates.declinedAudienceEmail(artistName) });
      break;

    case 'CONTRACT_SENT':
      if (audienceEmail) await sendEmail({ to: audienceEmail, ...templates.contractSentAudienceEmail(artistName, contractUrl) });
      break;

    case 'AUDIENCE_UPLOADED':
      if (artistEmail) await sendEmail({ to: artistEmail, ...templates.audienceUploadedArtistEmail(audienceName, contractUrl) });
      if (audienceEmail) await sendEmail({ to: audienceEmail, ...templates.audienceUploadedAudienceEmail(artistName, contractUrl) });
      break;

    case 'CONTRACT_SIGNED':
      if (artistEmail) await sendEmail({ to: artistEmail, ...templates.contractSignedEmail(bookingUrl) });
      if (audienceEmail) await sendEmail({ to: audienceEmail, ...templates.contractSignedEmail(bookingUrl) });
      break;

    case 'CONFIRMING':
      if (artistEmail) await sendEmail({ to: artistEmail, ...templates.confirmingArtistEmail(bookingUrl) });
      if (audienceEmail) await sendEmail({ to: audienceEmail, ...templates.confirmingAudienceEmail(bookingUrl) });
      break;

    case 'COMPLETED':
    case 'AUTO_RELEASED':
      if (artistEmail) await sendEmail({ to: artistEmail, ...templates.completedArtistEmail(booking.price, booking.currency, bookingUrl) });
      if (audienceEmail) await sendEmail({ to: audienceEmail, ...templates.completedAudienceEmail(artistName, bookingUrl) });
      break;

    case 'CANCELLED':
      if (artistEmail) await sendEmail({ to: artistEmail, ...templates.cancelledArtistEmail() });
      if (audienceEmail) await sendEmail({ to: audienceEmail, ...templates.cancelledAudienceEmail() });
      break;

    default:
      break;
  }
}

// ─── Reminder notifications (cron-driven) ──────────────────────────────────────

export async function notifyReminder(
  type: 'rehearsal_1_week' | 'logistics_1_day' | 'audience_1_day',
  booking: Booking,
): Promise<void> {
  const { artistName, artistEmail } = await getParties(booking);
  const audienceName = booking.audience_name ?? 'there';
  const audienceEmail = booking.audience_email;
  const bookingUrl = `${siteUrl()}/booking/${booking.id}`;

  switch (type) {
    case 'rehearsal_1_week':
      if (artistEmail) await sendEmail({ to: artistEmail, ...templates.gigReminder1WeekArtistEmail(audienceName, bookingUrl) });
      break;

    case 'logistics_1_day':
      if (artistEmail) await sendEmail({ to: artistEmail, ...templates.gigReminder1DayArtistEmail(audienceName, booking.venue, bookingUrl) });
      break;

    case 'audience_1_day':
      if (audienceEmail) await sendEmail({ to: audienceEmail, ...templates.gigReminder1DayAudienceEmail(artistName, booking.venue, bookingUrl) });
      break;
  }
}
