import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  approveSellerWorkflow,
  createSellersWorkflow,
} from "@mercurjs/core/workflows";
import { SellerStatus } from "@mercurjs/types";
import {
  IPIX_SELLER_EMAIL,
  IPIX_SELLER_HANDLE,
  IPIX_SELLER_NAME,
} from "./ipix-catalog-data";

export type IpixSellerResult = {
  id: string;
  name: string;
  handle: string;
  status: string;
  created: boolean;
  approved: boolean;
};

export async function ensureIpixSeller({
  container,
}: Pick<ExecArgs, "container">): Promise<IpixSellerResult> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: existing } = await query.graph({
    entity: "seller",
    fields: ["id", "name", "handle", "status", "email"],
    filters: { name: IPIX_SELLER_NAME },
  });

  let seller = existing[0];
  let created = false;
  let approved = false;

  if (!seller) {
    logger.info(`Creating demo seller "${IPIX_SELLER_NAME}"...`);
    const { result } = await createSellersWorkflow(container).run({
      input: {
        sellers: [
          {
            name: IPIX_SELLER_NAME,
            handle: IPIX_SELLER_HANDLE,
            email: IPIX_SELLER_EMAIL,
            currency_code: "eur",
            description: "iPix demo seller — fashion catalog (Phase 1).",
            member: { email: IPIX_SELLER_EMAIL },
          },
        ],
      },
    });
    seller = (result as typeof existing)[0];
    created = true;
    logger.info(`Created seller ${seller.id} (${seller.name})`);
  } else {
    logger.info(`Seller "${IPIX_SELLER_NAME}" already exists: ${seller.id}`);
  }

  if (seller.status !== SellerStatus.OPEN) {
    logger.info(`Approving seller ${seller.id} (was ${seller.status})...`);
    await approveSellerWorkflow(container).run({
      input: { seller_id: seller.id },
    });
    approved = true;
    seller = { ...seller, status: SellerStatus.OPEN };
    logger.info(`Seller ${seller.id} is now ${SellerStatus.OPEN}`);
  }

  return {
    id: seller.id,
    name: seller.name,
    handle: seller.handle,
    status: seller.status,
    created,
    approved,
  };
}

export default async function seedDemoSeller(execArgs: ExecArgs) {
  const seller = await ensureIpixSeller(execArgs);
  execArgs.container
    .resolve(ContainerRegistrationKeys.LOGGER)
    .info(
      `IPIX-COM-003 complete — seller_id=${seller.id} status=${seller.status}`
    );
}
