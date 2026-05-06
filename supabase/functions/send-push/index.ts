import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.1';

type PushPayload = {
  userId?: string;
  userIds?: string[];
  title?: string;
  body?: string;
  data?: Record<string, string>;
  record?: Record<string, unknown>;
  old_record?: Record<string, unknown> | null;
  type?: 'INSERT' | 'UPDATE' | string;
  table?: string;
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } }
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    const payload = (await req.json()) as PushPayload;
    const notification = await normalizePayload(payload);

    if (!notification.userIds.length || !notification.title || !notification.body) {
      return json({ success: true, sent: 0, skipped: true });
    }

    const { data: tokenRows, error } = await supabase
      .from('push_tokens')
      .select('token')
      .in('user_id', notification.userIds);

    if (error) throw error;

    const tokens = [...new Set((tokenRows ?? []).map((row) => row.token).filter(Boolean))];
    if (!tokens.length) return json({ success: true, sent: 0 });

    const messages = tokens.map((to) => ({
      to,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data ?? {},
    }));

    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await expoResponse.json();
    await cleanupInvalidTokens(tokens, result?.data ?? []);

    return json({ success: expoResponse.ok, sent: tokens.length, result });
  } catch (error) {
    return json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

async function normalizePayload(payload: PushPayload) {
  if (payload.userId || payload.userIds) {
    return {
      userIds: payload.userIds ?? (payload.userId ? [payload.userId] : []),
      title: payload.title,
      body: payload.body,
      data: payload.data,
    };
  }

  if (payload.table === 'bookings' && payload.type === 'INSERT' && payload.record) {
    const record = payload.record;
    return {
      userIds: record.partner_id ? [String(record.partner_id)] : [],
      title: 'New booking',
      body: `${record.guest_name ?? record.user_name ?? 'A traveller'} booked ${record.item_name ?? 'a listing'}.`,
      data: { type: 'new_booking', bookingId: String(record.id ?? ''), screen: 'bookings' },
    };
  }

  if (payload.table === 'bookings' && payload.type === 'UPDATE' && payload.record) {
    const record = payload.record;
    const oldRecord = payload.old_record ?? {};
    if (record.status === oldRecord.status) return { userIds: [], title: '', body: '' };
    const status = String(record.status ?? 'updated');
    return {
      userIds: record.user_id ? [String(record.user_id)] : [],
      title: `Booking ${status}`,
      body: `Your booking for ${record.item_name ?? 'your trip'} is now ${status}.`,
      data: { type: `booking_${status}`, bookingId: String(record.id ?? ''), screen: 'bookings' },
    };
  }

  if (payload.table === 'users' && payload.type === 'UPDATE' && payload.record) {
    const record = payload.record;
    const oldRecord = payload.old_record ?? {};
    if (record.is_approved !== true || oldRecord.is_approved === true) {
      return { userIds: [], title: '', body: '' };
    }
    return {
      userIds: record.id ? [String(record.id)] : [],
      title: 'Account approved',
      body: 'Your partner account has been approved. You can now receive bookings.',
      data: { type: 'account_approved', screen: 'home' },
    };
  }

  return { userIds: [], title: '', body: '' };
}

async function cleanupInvalidTokens(tokens: string[], tickets: Array<Record<string, any>>) {
  const invalid = tickets
    .map((ticket, index) => ticket?.details?.error === 'DeviceNotRegistered' ? tokens[index] : null)
    .filter(Boolean);

  if (invalid.length) {
    await supabase.from('push_tokens').delete().in('token', invalid);
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

