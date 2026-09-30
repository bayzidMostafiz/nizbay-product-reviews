import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher } from "react-router";
import { useEffect } from "react";
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
  Banner,
} from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import { authenticate, PRO_PLAN, ENTERPRISE_PLAN } from "../shopify.server";

declare const shopify: any;

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
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const selectedPlan = formData.get("plan") as string;

  const isEnterprise = selectedPlan === "enterprise";
  const planName = isEnterprise ? ENTERPRISE_PLAN : PRO_PLAN;
  const planPrice = isEnterprise ? "29.99" : "9.99";

  const url = new URL(request.url);
  const returnUrl = `${url.origin}/app/widgets`;

  const response = await admin.graphql(
    `#graphql
    mutation CreateSubscription($name: String!, $returnUrl: URL!, $price: Decimal!) {
      appSubscriptionCreate(
        name: $name
        returnUrl: $returnUrl
        test: true
        lineItems: [
          {
            plan: {
              appRecurringPricingDetails: {
                price: { amount: $price, currencyCode: USD }
                interval: EVERY_30_DAYS
              }
            }
          }
        ]
      ) {
        userErrors {
          field
          message
        }
        confirmationUrl
      }
    }`,
    {
      variables: {
        name: planName,
        returnUrl: returnUrl,
        price: planPrice,
      },
    }
  );

  const resData = await response.json();
  const confirmationUrl = resData.data?.appSubscriptionCreate?.confirmationUrl;
  const userErrors = resData.data?.appSubscriptionCreate?.userErrors;

  if (confirmationUrl) {
    return { confirmationUrl };
  }

  return { error: userErrors?.[0]?.message || "Could not generate confirmation URL" };
};

export default function PricingPage() {
  const { currentPlan } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<any>();

  // App Bridge native redirect for billing checkout
  useEffect(() => {
    if (fetcher.data?.confirmationUrl) {
      if (typeof shopify !== "undefined" && shopify.billing?.request) {
        shopify.billing.request({ confirmationUrl: fetcher.data.confirmationUrl });
      } else {
        open(fetcher.data.confirmationUrl, "_top");
      }
    }
  }, [fetcher.data]);

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
          <BlockStack gap="400">
            {fetcher.data?.error && (
              <Banner tone="critical" title="Billing Error">
                <p>{fetcher.data.error}</p>
              </Banner>
            )}

            <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
              {plans.map((plan) => {
                const isCurrent = currentPlan.toLowerCase() === plan.id;
                const isSubmitting =
                  fetcher.state !== "idle" &&
                  fetcher.formData?.get("plan") === plan.id;

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
                            <fetcher.Form method="post">
                              <input type="hidden" name="plan" value={plan.id} />
                              <Button
                                fullWidth
                                variant={plan.isPopular ? "primary" : "secondary"}
                                submit
                                loading={isSubmitting}
                              >
                                Upgrade to {plan.name}
                              </Button>
                            </fetcher.Form>
                          )}
                        </Box>
                      </BlockStack>
                    </Box>
                  </Card>
                );
              })}
            </InlineGrid>
          </BlockStack>
        </Box>
      </Page>
    </AppProvider>
  );
}