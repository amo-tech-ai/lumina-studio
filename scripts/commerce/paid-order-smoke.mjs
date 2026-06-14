#!/usr/bin/env node
/**
 * IPIX checkout smoke — Store API cart → Stripe test → complete order.
 * Requires: Mercur on :9000, NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY, STRIPE_API_KEY
 */
const BASE = process.env.MEDUSA_BASE_URL ?? 'http://127.0.0.1:9000';
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? process.env.MEDUSA_PUBLISHABLE_KEY;
const SK = process.env.STRIPE_API_KEY;

if (!PK) {
  console.error('Missing NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY');
  process.exit(1);
}
if (!SK) {
  console.error('Missing STRIPE_API_KEY');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'x-publishable-api-key': PK,
};

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 500)}`);
  }
  return json;
}

async function main() {
  const { products } = await api('/store/products?limit=1&fields=id,title,*variants.id');
  const variantId = products[0]?.variants?.[0]?.id;
  const productTitle = products[0]?.title;
  if (!variantId) throw new Error('No variant found');

  const { cart: created } = await api('/store/carts', { method: 'POST', body: {} });
  const cartId = created.id;

  await api(`/store/carts/${cartId}/line-items`, {
    method: 'POST',
    body: { variant_id: variantId, quantity: 1 },
  });

  await api(`/store/carts/${cartId}`, {
    method: 'POST',
    body: {
      email: 'checkout-e2e@ipix.test',
      shipping_address: {
        first_name: 'Test',
        last_name: 'Buyer',
        address_1: '123 Fashion St',
        city: 'Berlin',
        postal_code: '10115',
        country_code: 'de',
        phone: '+49123456789',
      },
      billing_address: {
        first_name: 'Test',
        last_name: 'Buyer',
        address_1: '123 Fashion St',
        city: 'Berlin',
        postal_code: '10115',
        country_code: 'de',
      },
    },
  });

  const { shipping_options: shippingPayload } = await api(
    `/store/shipping-options?cart_id=${cartId}`,
  );
  let options = [];
  if (Array.isArray(shippingPayload)) {
    options = shippingPayload;
  } else if (shippingPayload && typeof shippingPayload === 'object') {
    options = Object.values(shippingPayload).flat();
  }
  const shippingOptionId = options[0]?.id;
  if (!shippingOptionId) throw new Error('No shipping options for cart');

  await api(`/store/carts/${cartId}/shipping-methods`, {
    method: 'POST',
    body: { option_id: shippingOptionId },
  });

  const { payment_collection: pcCreated } = await api('/store/payment-collections', {
    method: 'POST',
    body: { cart_id: cartId },
  });

  const { payment_collection: pcWithSession } = await api(
    `/store/payment-collections/${pcCreated.id}/payment-sessions`,
    { method: 'POST', body: { provider_id: 'pp_stripe_stripe' } },
  );

  const session = pcWithSession.payment_sessions?.find(
    (s) => s.provider_id === 'pp_stripe_stripe',
  );
  const clientSecret = session?.data?.client_secret;
  if (!clientSecret) throw new Error('No Stripe client_secret');

  const piId = clientSecret.split('_secret')[0];
  const confirmBody = new URLSearchParams({
    'payment_method_data[type]': 'card',
    'payment_method_data[card][token]': 'tok_visa',
    return_url: 'http://127.0.0.1:3000/de/order/confirmed',
  });

  const stripeRes = await fetch(`https://api.stripe.com/v1/payment_intents/${piId}/confirm`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SK}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: confirmBody,
  });
  const stripeJson = await stripeRes.json();
  if (!stripeRes.ok) {
    throw new Error(`Stripe confirm failed: ${JSON.stringify(stripeJson)}`);
  }

  const complete = await api(`/store/carts/${cartId}/complete`, { method: 'POST', body: {} });
  const order =
    complete.order ??
    complete.data?.order ??
    complete.order_set?.orders?.[0] ??
    null;
  const orderGroup = complete.order_group ?? complete.data?.order_group;

  if (!order?.id && !orderGroup?.id) {
    console.error('Complete cart response:', JSON.stringify(complete, null, 2));
    throw new Error('Cart complete did not return order or order_group');
  }

  const result = {
    timestamp: new Date().toISOString(),
    productTitle,
    cartId,
    shippingOptionId,
    paymentIntentId: stripeJson.id,
    paymentIntentStatus: stripeJson.status,
    orderId: order?.id ?? orderGroup?.id,
    orderGroupId: orderGroup?.id,
    orderStatus: order?.status,
    paymentStatus: order?.payment_status,
    total: order?.total ?? orderGroup?.total,
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
