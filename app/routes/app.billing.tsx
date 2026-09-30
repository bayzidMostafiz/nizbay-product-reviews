import type { LoaderFunctionArgs } from "react-router";
import { authenticate, PRO_PLAN, ENTERPRISE_PLAN } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing } = await authenticate.admin(request);
  const url = new URL(request.url);
  const planType = url.searchParams.get("plan");

  const targetPlan = planType === "enterprise" ? ENTERPRISE_PLAN : PRO_PLAN;
  const returnUrl = `${url.origin}/app/widgets`;

  // billing.request direct top-level redirect response pathabe
  return await billing.request({
    plan: targetPlan,
    isTest: true,
    returnUrl,
  });
};