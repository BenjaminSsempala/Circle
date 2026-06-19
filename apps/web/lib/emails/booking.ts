// Plain HTML email templates for the booking + contract flow.
// Each function returns { subject, html } — kept simple and portable.

function wrap(title: string, body: string, cta?: { label: string; url: string }) {
  return `<!DOCTYPE html>
<html>
  <body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#fcf9f8;padding:24px;margin:0;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid rgba(0,84,64,0.12);">
      <div style="color:#005440;font-weight:700;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:18px;">The Circle</div>
      <h1 style="font-size:18px;color:#1c1b1b;margin:0 0 12px;">${title}</h1>
      <p style="font-size:14px;color:#3a4540;line-height:1.6;margin:0;">${body}</p>
      ${cta ? `<a href="${cta.url}" style="display:inline-block;margin-top:20px;background:#005440;color:#ffffff;padding:11px 22px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">${cta.label}</a>` : ''}
      <p style="font-size:11px;color:#6f7a74;margin-top:28px;letter-spacing:1px;text-transform:uppercase;">Facilitated by The Circle — thecircle.co</p>
    </div>
  </body>
</html>`;
}

// ─── REQUESTED ───────────────────────────────────────────────────────────────

export function requestedArtistEmail(audienceName: string, packageName: string, bookingUrl: string) {
  return {
    subject: `New booking request from ${audienceName} for ${packageName}`,
    html: wrap(
      `New booking request from ${audienceName}`,
      `${audienceName} has requested to book your "${packageName}" package. You have 24 hours to accept or decline.`,
      { label: 'View request', url: bookingUrl },
    ),
  };
}

export function requestedAudienceEmail(artistName: string, bookingUrl: string) {
  return {
    subject: `Your request was sent to ${artistName}`,
    html: wrap(
      'Request sent',
      `Your booking request was sent to ${artistName} — they have 24 hours to respond.`,
      { label: 'View booking', url: bookingUrl },
    ),
  };
}

// ─── ACCEPTED ────────────────────────────────────────────────────────────────

export function acceptedArtistEmail(audienceName: string, bookingUrl: string) {
  return {
    subject: `You accepted ${audienceName}'s booking`,
    html: wrap(
      'Booking accepted',
      `You accepted ${audienceName}'s booking — a contract is being generated and will be ready for you to review shortly.`,
      { label: 'View contract', url: bookingUrl },
    ),
  };
}

export function acceptedAudienceEmail(artistName: string, bookingUrl: string) {
  return {
    subject: `${artistName} accepted your booking`,
    html: wrap(
      'Booking accepted',
      `${artistName} accepted your booking. A contract is being prepared — we'll let you know when it's ready.`,
      { label: 'View booking', url: bookingUrl },
    ),
  };
}

// ─── DECLINED ────────────────────────────────────────────────────────────────

export function declinedArtistEmail(audienceName: string) {
  return {
    subject: `You declined ${audienceName}'s booking`,
    html: wrap('Booking declined', `You declined ${audienceName}'s booking request.`),
  };
}

export function declinedAudienceEmail(artistName: string) {
  return {
    subject: `${artistName} is unavailable for that date`,
    html: wrap('Booking declined', `${artistName} is unavailable for that date. Feel free to try another date or browse other artists on The Circle.`),
  };
}

// ─── CONTRACT_SENT ───────────────────────────────────────────────────────────

export function contractSentAudienceEmail(artistName: string, contractUrl: string) {
  return {
    subject: `Your contract from ${artistName} is ready`,
    html: wrap(
      'Contract ready for signing',
      `Your contract from ${artistName} is ready. Download it, print it, sign it, and upload a scan of the signed copy.`,
      { label: 'View contract', url: contractUrl },
    ),
  };
}

// ─── AUDIENCE_UPLOADED ───────────────────────────────────────────────────────

export function audienceUploadedArtistEmail(audienceName: string, contractUrl: string) {
  return {
    subject: `${audienceName} uploaded their signed contract`,
    html: wrap(
      'Signed contract received',
      `${audienceName} uploaded their signed contract. It's your turn to sign and upload your copy.`,
      { label: 'Upload your copy', url: contractUrl },
    ),
  };
}

export function audienceUploadedAudienceEmail(artistName: string, contractUrl: string) {
  return {
    subject: 'Your signed contract was received',
    html: wrap(
      'Signed contract received',
      `Your signed contract was received — we're now waiting for ${artistName} to sign and upload their copy.`,
      { label: 'View contract', url: contractUrl },
    ),
  };
}

// ─── CONTRACT_SIGNED ─────────────────────────────────────────────────────────

export function contractSignedEmail(bookingUrl: string) {
  return {
    subject: 'Contract complete — payment step is next',
    html: wrap(
      'Contract complete',
      `Both signed copies have been received. Your contract is now complete — the payment step is next.`,
      { label: 'View booking', url: bookingUrl },
    ),
  };
}

// ─── Reminders ───────────────────────────────────────────────────────────────

export function gigReminder1WeekArtistEmail(audienceName: string, bookingUrl: string) {
  return {
    subject: `Your gig with ${audienceName} is in 1 week`,
    html: wrap(
      'Gig coming up',
      `Your gig with ${audienceName} is in 1 week — time to start preparing.`,
      { label: 'View booking', url: bookingUrl },
    ),
  };
}

export function gigReminder1DayArtistEmail(audienceName: string, venue: string | null, bookingUrl: string) {
  return {
    subject: `Your gig with ${audienceName} is tomorrow`,
    html: wrap(
      'Gig tomorrow',
      `Your gig with ${audienceName} is tomorrow${venue ? ` at ${venue}` : ''}.`,
      { label: 'View booking', url: bookingUrl },
    ),
  };
}

export function gigReminder1DayAudienceEmail(artistName: string, venue: string | null, bookingUrl: string) {
  return {
    subject: `Your booking with ${artistName} is tomorrow`,
    html: wrap(
      'Booking tomorrow',
      `Your booking with ${artistName} is tomorrow${venue ? ` at ${venue}` : ''}.`,
      { label: 'View booking', url: bookingUrl },
    ),
  };
}

// ─── CONFIRMING ──────────────────────────────────────────────────────────────

export function confirmingArtistEmail(bookingUrl: string) {
  return {
    subject: 'Please confirm your gig is complete',
    html: wrap(
      'Confirm completion',
      `Please confirm your gig is complete to release payment.`,
      { label: 'Confirm', url: bookingUrl },
    ),
  };
}

export function confirmingAudienceEmail(bookingUrl: string) {
  return {
    subject: 'Please confirm your session is complete',
    html: wrap(
      'Confirm completion',
      `Please confirm your session is complete.`,
      { label: 'Confirm', url: bookingUrl },
    ),
  };
}

// ─── COMPLETED ───────────────────────────────────────────────────────────────

export function completedArtistEmail(amount: number, currency: string, bookingUrl: string) {
  return {
    subject: 'Payment released',
    html: wrap(
      'Payment released',
      `Your payment of ${currency} ${Number(amount).toLocaleString()} has been released.`,
      { label: 'View booking', url: bookingUrl },
    ),
  };
}

export function completedAudienceEmail(artistName: string, bookingUrl: string) {
  return {
    subject: 'Session confirmed',
    html: wrap(
      'Session confirmed',
      `Session confirmed — please leave a review for ${artistName}.`,
      { label: 'Leave a review', url: bookingUrl },
    ),
  };
}

// ─── CANCELLED ───────────────────────────────────────────────────────────────

export function cancelledArtistEmail() {
  return {
    subject: 'Booking cancelled',
    html: wrap('Booking cancelled', 'This booking has been cancelled. Cancellation terms have been applied.'),
  };
}

export function cancelledAudienceEmail() {
  return {
    subject: 'Booking cancelled',
    html: wrap('Booking cancelled', 'This booking has been cancelled. Your refund will be processed per the cancellation terms.'),
  };
}
