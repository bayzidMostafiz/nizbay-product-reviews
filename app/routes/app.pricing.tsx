import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, Form, useNavigation } from "react-router";
import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Badge,
  InlineGrid,
  Box,
  Divider,
  List,
} from "@shopify/polaris";
import { authenticate, PRO_PLAN, ENTERPRISE_PLAN } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing } = await authenticate.admin(request);

  let currentPlan = "Free";

  try {
    const billingCheck = await billing.check({
      plans: [PRO_PLAN, ENTERPRISE_PLAN],
      isTest: true,
    });

    if (billingCheck.hasActivePayment) {
      const activeSub = billingCheck.appSubscriptions?.[0]?.name;
      if (activeSub === PRO_PLAN) currentPlan = "Pro";
      if (activeSub === ENTERPRISE_PLAN) currentPlan = "Enterprise";
    }
  } catch (error) {
    console.error("Billing check error:", error);
  }

  return { currentPlan };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const selectedPlan = formData.get("plan") as string;

  const targetPlan = selectedPlan === "enterprise" ? ENTERPRISE_PLAN : PRO_PLAN;

  // returnUrl-এ শপিফাই অ্যাডমিনের ড্যাশবোর্ড উইজেট পেজের লিঙ্ক দেওয়া হলো
  return billing.request({
    plan: targetPlan,
    isTest: true,
    returnUrl: `https://${session.shop}/admin/apps/nizbay-product-reviews/app/widgets`,
  });
};

export default function PricingPage() {
  const { currentPlan } = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  const plans = [
    {
      id: "free",
      name: "Free Plan",
      price: "$0",
      description: "Essential review widgets for new stores.",
      features: [
        "Star Rating Badge",
        "Full Review Form & List",
        "Unlimited Store Reviews",
        "Standard Support",
      ],
      isPopular: false,
    },
    {
      id: "pro",
      name: "Pro Plan",
      price: "$9.99",
      description: "Best for growing stores seeking more conversions.",
      features: [
        "All Free Features",
        "Review Slider / Carousel",
        "Verified Buyer Badge",
        "Minimal Highlight Card",
        "Fast Priority Support",
      ],
      isPopular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "$29.99",
      description: "Complete control and custom branding for scale.",
      features: [
        "All Pro Features",
        "Custom CSS & Widget Styling",
        "White-label (Remove Branding)",
        "Dedicated Account Support",
      ],
      isPopular: false,
    },
  ];

  return (
    <Page
      title="Subscription Plans"
      subtitle="Choose the plan that fits your business needs."
      backAction={{ content: "Widgets", url: "/app/widgets" }}
    >
      <Box paddingBlockEnd="800">
        <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
          {plans.map((plan) => {
            const isCurrent = currentPlan.toLowerCase() === plan.id;
            const isSubmitting =
              navigation.state !== "idle" &&
              navigation.formData?.get("plan") === plan.id;

            return (
              <Card key={plan.id}>
                <Box padding="200">
                  <BlockStack gap="400">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text variant="headingMd" as="h3">
                        {plan.name}
                      </Text>
                      {plan.isPopular && (
                        <Badge tone="magic">MOST POPULAR</Badge>
                      )}
                      {isCurrent && (
                        <Badge tone="success">CURRENT PLAN</Badge>
                      )}
                    </InlineStack>

                    <InlineStack align="start" blockAlign="baseline" gap="100">
                      <Text variant="heading2xl" as="h2">
                        {plan.price}
                      </Text>
                      <Text variant="bodySm" tone="subdued">
                        / month
                      </Text>
                    </InlineStack>

                    <Text variant="bodySm" tone="subdued">
                      {plan.description}
                    </Text>

                    <Divider />

                    <BlockStack gap="200">
                      <Text variant="headingXs" as="h4">
                        What's included:
                      </Text>
                      <List type="bullet">
                        {plan.features.map((feature, idx) => (
                          <List.Item key={idx}>{feature}</List.Item>
                        ))}
                      </List>
                    </BlockStack>

                    <Box paddingBlockStart="200">
                      {isCurrent ? (
                        <Button fullWidth disabled>
                          Active Plan
                        </Button>
                      ) : plan.id === "free" ? (
                        <Button fullWidth disabled>
                          Default
                        </Button>
                      ) : (
                        <Form method="post" target="_top">
                          <input type="hidden" name="plan" value={plan.id} />
                          <Button
                            fullWidth
                            variant={plan.isPopular ? "primary" : "secondary"}
                            submit
                            loading={isSubmitting}
                          >
                            Upgrade to {plan.name}
                          </Button>
                        </Form>
                      )}
                    </Box>
                  </BlockStack>
                </Box>
              </Card>
            );
          })}
        </InlineGrid>
      </Box>
    </Page>
  );
}