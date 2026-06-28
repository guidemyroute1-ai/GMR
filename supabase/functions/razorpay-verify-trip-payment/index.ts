import { corsHeaders, errorResponse, getAuthContext, HttpError, json, verifyRazorpaySignature } from '../_shared/razorpay.ts';

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

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, tripId } = parsedBody;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !tripId) {
      throw new HttpError(400, 'Missing payment verification details.');
    }

    // Verify the Razorpay signature
    const isValid = await verifyRazorpaySignature(
      String(razorpay_order_id),
      String(razorpay_payment_id),
      String(razorpay_signature)
    );

    if (!isValid) {
      throw new HttpError(400, 'Invalid payment signature.');
    }

    // Ensure the user hasn't already been added
    const { data: existing } = await auth.serviceClient
      .from('trip_participants')
      .select('id')
      .eq('user_id', auth.user.id)
      .eq('trip_id', String(tripId))
      .maybeSingle();

    if (existing) {
      throw new HttpError(400, 'You have already joined this trip.');
    }

    // Insert user into trip participants
    const { error: insertErr } = await auth.serviceClient
      .from('trip_participants')
      .insert({
        trip_id: String(tripId),
        user_id: auth.user.id
      });

    if (insertErr) {
      console.error('Error inserting trip participant:', insertErr);
      throw new HttpError(500, 'Failed to add you to the trip.');
    }

    return json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
