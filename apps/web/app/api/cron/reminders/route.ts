export const dynamic = 'force-dynamic';

import { createServiceClient } from '@/lib/supabase/service';
import { err, ok } from '@/lib/api';
import { notifyReminder } from '@/lib/services/notifications';
import type { Booking } from '@/lib/services/bookings';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return err('Unauthorized', 401);

  const { data: reminders, error } = await createServiceClient()
    .from('booking_reminders')
    .select('*, bookings(*)')
    .eq('sent', false)
    .lte('send_at', new Date().toISOString());

  if (error) return err(error.message, 500);

  let sent = 0;
  for (const reminder of reminders ?? []) {
    const booking = (reminder as unknown as { bookings: Booking | null }).bookings;
    if (!booking) continue;

    await notifyReminder(reminder.type as 'rehearsal_1_week' | 'logistics_1_day' | 'audience_1_day', booking);
    await createServiceClient().from('booking_reminders').update({ sent: true }).eq('id', reminder.id);
    sent += 1;
  }

  return ok({ sent });
}
