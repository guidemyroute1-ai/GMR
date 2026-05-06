import {
  buildBookingRow,
  corsHeaders,
  errorResponse,
  fetchRazorpayOrder,
  getAuthContext,
  HttpError,
  json,
  readBookingInput,
  resolveBooking,
  sendBookingPush,
  verifyRazorpaySignature,
} from '../_shared/razorpay.ts';

type VerifyRequest = {
  booking?: unknown;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  if (req.method !== 'POST') {
    return json({ success: false, error: 'Method not allowed.' }, 405);
  }

  try {
    const auth = await getAuthContext(req);
    const body = await readVerifyRequest(req);
    const paymentId = body.razorpay_payment_id;
    const orderId = body.razorpay_order_id;
    const signature = body.razorpay_signature;

    const isAuthentic = await verifyRazorpaySignature(orderId, paymentId, signature);
    if (!isAuthentic) {
      throw new HttpError(400, 'Payment signature verification failed.');
    }

    const order = await fetchRazorpayOrder(orderId);
    const bookingReq = new Request(req.url, {
      method: 'POST',
      headers: req.headers,
      body: JSON.stringify(body.booking),
    });
    const input = await readBookingInput(bookingReq);
    const resolved = await resolveBooking(auth.serviceClient, input);

    if (Number(order.amount) !== resolved.amountPaise || String(order.currency || 'INR') !== 'INR') {
      throw new HttpError(400, 'Verified Razorpay order does not match booking amount.');
    }

    const notes = order.notes || {};
    if (notes.user_id && notes.user_id !== auth.user.id) {
      throw new HttpError(403, 'Razorpay order belongs to another user.');
    }
    if (notes.item_id && notes.item_id !== resolved.itemId) {
      throw new HttpError(400, 'Razorpay order does not match booking item.');
    }

    const { data: existing, error: existingError } = await auth.serviceClient
      .from('bookings')
      .select('id, payment_id')
      .eq('payment_id', paymentId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing?.id) {
      return json({
        success: true,
        bookingId: existing.id,
        paymentId,
        duplicate: true,
      });
    }

    const bookingRow = buildBookingRow(auth.user, resolved, {
      paymentId,
      orderId,
      signature,
    });

    const { data: inserted, error: insertError } = await auth.serviceClient
      .from('bookings')
      .insert(bookingRow)
      .select('id, guest_name')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        const { data: duplicate } = await auth.serviceClient
          .from('bookings')
          .select('id')
          .eq('payment_id', paymentId)
          .maybeSingle();

        if (duplicate?.id) {
          return json({
            success: true,
            bookingId: duplicate.id,
            paymentId,
            duplicate: true,
          });
        }
      }

      throw insertError;
    }

    await sendBookingPush(resolved, inserted.guest_name || bookingRow.guest_name, inserted.id);

    return json({
      success: true,
      bookingId: inserted.id,
      paymentId,
    });
  } catch (error) {
    return errorResponse(error);
  }
});

async function readVerifyRequest(req: Request) {
  let body: VerifyRequest;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, 'Invalid JSON request body.');
  }

  if (!body.booking) throw new HttpError(400, 'Missing booking details.');

  const paymentId = String(body.razorpay_payment_id || '').trim();
  const orderId = String(body.razorpay_order_id || '').trim();
  const signature = String(body.razorpay_signature || '').trim();

  if (!paymentId || !orderId || !signature) {
    throw new HttpError(400, 'Missing Razorpay payment verification fields.');
  }

  return {
    booking: body.booking,
    razorpay_payment_id: paymentId,
    razorpay_order_id: orderId,
    razorpay_signature: signature,
  };
}
