import type { LoaderFunctionArgs } from "react-router";
import { authenticate, MONTHLY_PLAN } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
  const shop = session.shop;

  await billing.require({
    plans: [MONTHLY_PLAN],
    isTest: true,
    onFailure: async () =>
      billing.request({
        plan: MONTHLY_PLAN,
        isTest: true,
        returnUrl: `https://${shop}/admin/apps/nizbay-product-reviews/app/widgets`,
      }),
  });

  return null;
};

export default function UpgradePage() {
  return null;
}