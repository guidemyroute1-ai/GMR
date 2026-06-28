import { supabaseAdmin } from './supabase-server';

export interface TripOrganizerApplication {
  id: string;
  user_id: string;
  payment_id: string | null;
  amount_paid: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user: {
    name: string;
    email: string;
    phone: string;
    photo_url: string;
  } | null;
}

// ─── Helper: fire push via the send-push edge function ──────────────────────
async function sendOrganizerPush(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  try {
    await fetch(`${supabaseUrl}/functions/v1/send-push`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, title, body, app: 'user', data }),
    });
  } catch (e) {
    // Push is non-critical — log but don't fail the approval
    console.error('[sendOrganizerPush] Failed:', e);
  }
}

export async function getTripOrganizerApplications(): Promise<TripOrganizerApplication[]> {
  const { data, error } = await supabaseAdmin
    .from('trip_organizer_applications')
    .select(`
      id,
      user_id,
      payment_id,
      amount_paid,
      status,
      created_at,
      user:users!trip_organizer_applications_user_id_fkey(
        name,
        email,
        phone,
        photo_url
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching trip organizer applications:', error);
    return [];
  }

  return (data || []) as unknown as TripOrganizerApplication[];
}

export async function approveOrganizer(applicationId: string, userId: string) {
  // 1. Update application status
  const { error: appError } = await supabaseAdmin
    .from('trip_organizer_applications')
    .update({ status: 'approved' })
    .eq('id', applicationId);

  if (appError) throw appError;

  // 2. Mark user as verified organizer
  const { error: userError } = await supabaseAdmin
    .from('users')
    .update({ is_trip_organizer_verified: true })
    .eq('id', userId);

  if (userError) throw userError;

  // 3. Push notification 🎉
  await sendOrganizerPush(
    userId,
    "🎉 You're now a Verified Organizer!",
    'Your application has been approved. You can now create and host trips on GMR!',
    { type: 'organizer_approved', screen: 'profile' }
  );

  return true;
}

export async function rejectOrganizer(applicationId: string) {
  // 1. Fetch userId before updating so we can push
  const { data: app } = await supabaseAdmin
    .from('trip_organizer_applications')
    .select('user_id')
    .eq('id', applicationId)
    .maybeSingle();

  // 2. Update status
  const { error } = await supabaseAdmin
    .from('trip_organizer_applications')
    .update({ status: 'rejected' })
    .eq('id', applicationId);

  if (error) throw error;

  // 3. Push notification
  if (app?.user_id) {
    await sendOrganizerPush(
      app.user_id,
      'Application Update',
      'Your trip organizer application was not approved this time. Contact support for details.',
      { type: 'organizer_rejected', screen: 'profile' }
    );
  }

  return true;
}
