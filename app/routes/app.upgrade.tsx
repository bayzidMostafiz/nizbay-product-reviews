import type { LoaderFunctionArgs } from "react-router";
import { authenticate, MONTHLY_PLAN } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing } = await authenticate.admin(request);

  // প্ল্যান একটিভ না থাকলে মার্চেন্টকে শপিফাই পেমেন্ট স্ক্রিনে রিডাইরেক্ট করবে
  await billing.require({
    plans: [MONTHLY_PLAN],
    isTest: true, // ডেভেলপমেন্ট বা টেস্ট চলাকালীন true থাকবে
    onFailure: async () =>
      billing.request({
        plan: MONTHLY_PLAN,
        isTest: true,
        returnUrl: `https://${new URL(request.url).host}/app/widgets`,
      }),
  });

  return null;
};