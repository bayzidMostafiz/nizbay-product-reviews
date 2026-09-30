import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Badge,
  AppProvider,
  InlineGrid,
  Box,
  Divider,
  List,
} from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
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

export default function PricingPage() {
  const { currentPlan } = useLoaderData<typeof loader>();

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
    <AppProvider i18n={enTranslations}>
      <Page
        title="Subscription Plans"
        subtitle="Choose the plan that fits your business needs."
        backAction={{ content: "Widgets", url: "/app/widgets" }}
      >
        <Box paddingBlockEnd="800">
          <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
            {plans.map((plan) => {
              const isCurrent = currentPlan.toLowerCase() === plan.id;

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
                          <Button
                            fullWidth
                            variant={plan.isPopular ? "primary" : "secondary"}
                            url={`/app/billing?plan=${plan.id}`}
                            target="_top"
                          >
                            Upgrade to {plan.name}
                          </Button>
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
    </AppProvider>
  );
}