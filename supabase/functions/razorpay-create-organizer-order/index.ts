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

    // Check if the user already applied
    const { data: existing } = await auth.serviceClient
      .from('trip_organizer_applications')
      .select('id')
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (existing) {
      throw new HttpError(400, 'You have already submitted an application.');
    }

    const amountPaise = 49900; // ₹499.00
    const receipt = `org_${Date.now().toString(36)}_${auth.user.id.slice(0, 8)}`;

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
          purpose: 'trip_organizer_verification',
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
    });
  } catch (error) {
    return errorResponse(error);
  }
});
