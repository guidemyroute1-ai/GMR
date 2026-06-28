import { corsHeaders, errorResponse, getAuthContext, HttpError, json } from '../_shared/razorpay.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  if (req.method !== 'POST') {
    return json({ success: false, error: 'Method not allowed.' }, 405);
  }

  try {
    const auth = await getAuthContext(req);

    let bodyText: string;
    try {
      bodyText = await req.text();
    } catch {
      throw new HttpError(400, 'Invalid request body.');
    }

    let parsedBody: Record<string, unknown>;
    try {
      parsedBody = JSON.parse(bodyText);
    } catch {
      throw new HttpError(400, 'Invalid JSON.');
    }

    if (!parsedBody.tripId) {
      throw new HttpError(400, 'Missing tripId.');
    }

    const tripId = String(parsedBody.tripId).trim();

    // Fetch the trip details to get the price
    const { data: trip, error: fetchErr } = await auth.serviceClient
      .from('trips')
      .select('id, price, title')
      .eq('id', tripId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!trip) throw new HttpError(404, 'Trip not found.');
    
    // Check if user already joined
    const { data: existing } = await auth.serviceClient
      .from('trip_participants')
      .select('id')
      .eq('trip_id', tripId)
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (existing) {
      throw new HttpError(400, 'You have already joined this trip.');
    }

    // Razorpay amount is in paise
    const amountPaise = Math.round(Number(trip.price) * 100);
    const receipt = `trip_${Date.now().toString(36)}_${auth.user.id.slice(0, 8)}`;

    const keyId = Deno.env.get('RAZORPAY_KEY_ID')!;
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    const resp = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt,
        notes: {
          user_id: auth.user.id,
          purpose: 'trip_booking',
          trip_id: tripId
        },
      }),
    });

    const order = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const msg = order?.error?.description || 'Unable to create Razorpay order.';
      throw new HttpError(502, msg);
    }

    return json({
      success: true,
      keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency || 'INR',
      tripId,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
