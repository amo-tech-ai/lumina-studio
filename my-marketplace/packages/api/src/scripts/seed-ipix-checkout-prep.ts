import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import { createSellerShippingOptionsWorkflow } from "@mercurjs/core/workflows";
import { MercurModules } from "@mercurjs/types";
import { ensureIpixSeller } from "./seed-demo-seller";

const STRIPE_PROVIDER_ID = "pp_stripe_stripe";

/** IPIX-COM-005 prep — seller stock/shipping links + Stripe on region. */
export default async function seedIpixCheckoutPrep({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const regionModule = container.resolve(Modules.REGION);
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT);
  const stockLocationModule = container.resolve(Modules.STOCK_LOCATION);

  const seller = await ensureIpixSeller({ container });

  const stockLocations = await stockLocationModule.listStockLocations({
    name: "European Warehouse",
  });
  if (!stockLocations.length) {
    throw new Error("European Warehouse missing — run `yarn seed` first");
  }
  const stockLocationId = stockLocations[0].id;

  const { data: existingStockLinks } = await query.graph({
    entity: "stock_location_seller",
    fields: ["seller_id", "stock_location_id"],
    filters: { seller_id: seller.id, stock_location_id: stockLocationId },
  });

  if (!existingStockLinks.length) {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocationId },
      [MercurModules.SELLER]: { seller_id: seller.id },
    });
    logger.info(`Linked stock location ${stockLocationId} to seller ${seller.id}`);
  }

  const { data: existingShippingLinks } = await query.graph({
    entity: "shipping_option_seller",
    fields: ["seller_id", "shipping_option_id"],
    filters: { seller_id: seller.id },
  });

  if (!existingShippingLinks.length) {
    const { data: fulfillmentSets } = await query.graph({
      entity: "fulfillment_set",
      fields: ["id", "name", "service_zones.id"],
      filters: { name: "European Warehouse delivery" },
    });
    if (!fulfillmentSets.length) {
      throw new Error("Fulfillment set missing — run `yarn seed` first");
    }
    const serviceZoneId = fulfillmentSets[0].service_zones?.[0]?.id;
    if (!serviceZoneId) {
      throw new Error("Fulfillment service zone missing");
    }

    const shippingProfiles = await fulfillmentModule.listShippingProfiles({
      type: "default",
    });
    if (!shippingProfiles.length) {
      throw new Error("Default shipping profile missing");
    }

    const regions = await regionModule.listRegions();
    const europeRegion = regions.find((r) => r.name === "Europe") ?? regions[0];

    await createSellerShippingOptionsWorkflow(container).run({
      input: {
        seller_id: seller.id,
        shipping_options: [
          {
            name: "ipix Standard Shipping",
            price_type: "flat",
            provider_id: "manual_manual",
            service_zone_id: serviceZoneId,
            shipping_profile_id: shippingProfiles[0].id,
            type: {
              label: "Standard",
              description: "Ship in 3-5 business days.",
              code: "ipix_standard",
            },
            prices: [
              { currency_code: "usd", amount: 5 },
              { currency_code: "eur", amount: 5 },
              { region_id: europeRegion.id, amount: 5 },
            ],
            rules: [
              {
                attribute: "enabled_in_store",
                value: "true",
                operator: "eq",
              },
              {
                attribute: "is_return",
                value: "false",
                operator: "eq",
              },
            ],
          },
        ],
      },
    });
    logger.info("Created ipix seller shipping option.");
  }

  const allRegions = await regionModule.listRegions();
  for (const region of allRegions) {
    const { data: regionPaymentLinks } = await query.graph({
      entity: "region_payment_provider",
      fields: ["region_id", "payment_provider_id"],
      filters: { region_id: region.id },
    });
    const providerIds = regionPaymentLinks.map((l) => l.payment_provider_id);
    if (providerIds.includes(STRIPE_PROVIDER_ID)) {
      continue;
    }

    await link.create({
      [Modules.REGION]: { region_id: region.id },
      [Modules.PAYMENT]: { payment_provider_id: STRIPE_PROVIDER_ID },
    });
    logger.info(`Linked ${STRIPE_PROVIDER_ID} to region ${region.name}`);
  }

  logger.info("IPIX-COM-005 checkout prep complete.");
}
