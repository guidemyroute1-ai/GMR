import {
  corsHeaders,
  errorResponse,
  fetchRazorpayOrder,
  getAuthContext,
  HttpError,
  json,
  verifyRazorpaySignature,
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
    
    let body: any;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, 'Invalid JSON request body.');
    }

    const paymentId = String(body.razorpay_payment_id || '').trim();
    const orderId = String(body.razorpay_order_id || '').trim();
    const signature = String(body.razorpay_signature || '').trim();

    if (!paymentId || !orderId || !signature) {
      throw new HttpError(400, 'Missing Razorpay payment verification fields.');
    }

    const isAuthentic = await verifyRazorpaySignature(orderId, paymentId, signature);
    if (!isAuthentic) {
      throw new HttpError(400, 'Payment signature verification failed.');
    }

    const order = await fetchRazorpayOrder(orderId);
    
    if (order.notes?.user_id && order.notes.user_id !== auth.user.id) {
      throw new HttpError(403, 'Razorpay order belongs to another user.');
    }
    
    if (Number(order.amount) !== 49900) {
      throw new HttpError(400, 'Invalid payment amount.');
    }

    const { error } = await auth.serviceClient.from('trip_organizer_applications').insert({
      user_id: auth.user.id,
      payment_id: paymentId,
      amount_paid: 499,
      status: 'pending',
    });

    if (error && error.code !== '23505') { // Ignore duplicate key errors if already submitted
      throw error;
    }

    return json({ success: true, paymentId });
  } catch (error) {
    return errorResponse(error);
  }
});
