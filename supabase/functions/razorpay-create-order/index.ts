import {
  corsHeaders,
  createRazorpayOrder,
  errorResponse,
  getAuthContext,
  json,
  readBookingInput,
  resolveBooking,
} from '../_shared/razorpay.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  if (req.method !== 'POST') {
    return json({ success: false, error: 'Method not allowed.' }, 405);
  }

  try {
    const auth = await getAuthContext(req);
    const input = await readBookingInput(req);
    const resolved = await resolveBooking(auth.serviceClient, input);
    const order = await createRazorpayOrder(auth.user, resolved);

    return json({
      success: true,
      keyId: Deno.env.get('RAZORPAY_KEY_ID'),
      orderId: order.id,
      amount: order.amount,
      currency: order.currency || 'INR',
    });
  } catch (error) {
    return errorResponse(error);
  }
});
