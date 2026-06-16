'use server';

import { HttpTypes } from '@medusajs/types';

import { StoreCardShippingMethod } from '@/components/sections/CartShippingMethodsSection/CartShippingMethodsSection';
import { sdk } from '@/lib/config';

import { getAuthHeaders, getCacheOptions } from './cookies';

type ShippingOptionsResponse =
  | StoreCardShippingMethod[]
  | Record<string, StoreCardShippingMethod[]>
  | null
  | undefined;

const enrichShippingOption = (
  option: StoreCardShippingMethod,
  groupSellerId?: string
): StoreCardShippingMethod => {
  const seller = option.seller as { id?: string; name?: string } | undefined;
  const sellerId = option.seller_id ?? seller?.id ?? groupSellerId;
  const sellerName = option.seller_name ?? seller?.name;

  return {
    ...option,
    seller_id: sellerId,
    ...(sellerName ? { seller_name: sellerName } : {})
  };
};

const normalizeShippingOptions = (
  shipping_options: ShippingOptionsResponse
): StoreCardShippingMethod[] | null => {
  if (shipping_options == null) {
    return null;
  }

  if (Array.isArray(shipping_options)) {
    return shipping_options.map(option => enrichShippingOption(option));
  }

  if (typeof shipping_options === 'object') {
    return Object.entries(shipping_options).flatMap(([sellerId, options]) =>
      (options ?? []).map(option => enrichShippingOption(option, sellerId))
    );
  }

  return null;
};

export const listCartShippingMethods = async (cartId: string, is_return: boolean = false) => {
  const headers = {
    ...(await getAuthHeaders())
  };

  const next = {
    ...(await getCacheOptions('fulfillment'))
  };

  return sdk.client
    .fetch<{ shipping_options: ShippingOptionsResponse }>(`/store/shipping-options`, {
      method: 'GET',
      query: {
        cart_id: cartId,
        fields:
          '+service_zone.fulfillment_set.type,*service_zone.fulfillment_set.location.address,*seller'
      },
      headers,
      next,
      cache: 'no-cache'
    })
    .then(({ shipping_options }) => normalizeShippingOptions(shipping_options))
    .catch(() => {
      return null;
    });
};

export const calculatePriceForShippingOption = async (
  optionId: string,
  cartId: string,
  data?: Record<string, unknown>
) => {
  const headers = {
    ...(await getAuthHeaders())
  };

  const next = {
    ...(await getCacheOptions('fulfillment'))
  };

  const body = { cart_id: cartId, data };

  if (data) {
    body.data = data;
  }

  return sdk.client
    .fetch<{ shipping_option: HttpTypes.StoreCartShippingOption }>(
      `/store/shipping-options/${optionId}/calculate`,
      {
        method: 'POST',
        body,
        headers,
        next
      }
    )
    .then(({ shipping_option }) => shipping_option)
    .catch(e => {
      return null;
    });
};
