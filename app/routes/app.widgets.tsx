import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher } from "react-router";
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
  Image,
  Divider,
  Banner,
} from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import { authenticate, MONTHLY_PLAN } from "../shopify.server";

// ১. মেটাফিল্ড ও বিলিং স্ট্যাটাস চেক করা
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, billing } = await authenticate.admin(request);

  // Billing check: স্টোরে সক্রিয় প্রিমিয়াম সাবস্ক্রিপশন আছে কি না
  const billingCheck = await billing.check({
    plans: [MONTHLY_PLAN],
    isTest: true,
  });

  const hasPremium = billingCheck.hasActivePayment;

  const response = await admin.graphql(`
    #graphql
    query getWidgetSettings {
      currentAppInstallation {
        metafields(first: 10, namespace: "nizbay_widgets") {
          edges {
            node {
              key
              value
            }
          }
        }
      }
    }
  `);

  const data = await response.json();
  const edges = data.data?.currentAppInstallation?.metafields?.edges || [];

  const settings: Record<string, boolean> = {};
  edges.forEach(({ node }: any) => {
    settings[node.key] = node.value === "true";
  });

  return { settings, hasPremium };
};

// ২. মেটাফিল্ড আপডেট অ্যাকশন
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, billing } = await authenticate.admin(request);
  const formData = await request.formData();
  const key = formData.get("key") as string;
  const enabled = formData.get("enabled") === "true";
  const isPremiumWidget = formData.get("isPremium") === "true";

  // প্রিমিয়াম উইজেটের জন্য সাবস্ক্রিপশন ভ্যালিডেশন
  const billingCheck = await billing.check({
    plans: [MONTHLY_PLAN],
    isTest: true,
  });

  if (isPremiumWidget && !billingCheck.hasActivePayment && enabled) {
    return { error: "Requires Premium Subscription" };
  }

  const appInstallationRes = await admin.graphql(`
    query { 
      currentAppInstallation { 
        id 
      } 
    }
  `);
  const appData = await appInstallationRes.json();
  const ownerId = appData.data.currentAppInstallation.id;

  await admin.graphql(
    `#graphql
    mutation setWidgetMetafield($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { 
          key 
          value 
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      variables: {
        metafields: [
          {
            namespace: "nizbay_widgets",
            key,
            type: "boolean",
            value: enabled ? "true" : "false",
            ownerId,
          },
        ],
      },
    }
  );

  return { success: true };
};

// ৩. ফ্রি এবং প্রিমিয়াম উইজেটের তালিকা
const WIDGETS = [
  {
    id: "star_rating",
    name: "Star Rating Badge",
    description: "Display compact star ratings directly below your product titles.",
    image: "https://placehold.co/600x320/2563eb/ffffff?text=Star+Rating+Widget",
    isPremium: false,
  },
  {
    id: "review_list",
    name: "Full Review Form & List",
    description: "Complete review submission form with ratings, text, and customer reviews.",
    image: "https://placehold.co/600x320/059669/ffffff?text=Review+List+%26+Form",
    isPremium: false,
  },
  {
    id: "review_carousel",
    name: "Review Carousel",
    description: "Horizontal interactive review slider to showcase customer testimonials.",
    image: "https://placehold.co/600x320/7c3aed/ffffff?text=Review+Carousel",
    isPremium: true,
  },
  {
    id: "verified_badge",
    name: "Verified Buyer Badge",
    description: "Highlight authentic buyer trust badges beside verified purchase reviews.",
    image: "https://placehold.co/600x320/ea580c/ffffff?text=Verified+Buyer+Badge",
    isPremium: true,
  },
  {
    id: "minimal_card",
    name: "Minimal Review Card",
    description: "Modern compact highlight card ideal for sidebars, carts, or footer sections.",
    image: "https://placehold.co/600x320/0284c7/ffffff?text=Minimal+Review+Card",
    isPremium: true,
  },
];

export default function WidgetsPage() {
  const { settings, hasPremium } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  return (
    <AppProvider i18n={enTranslations}>
      <Page
        title="Review Widgets"
        subtitle="Manage free and premium storefront review components."
        primaryAction={
          !hasPremium
            ? {
                content: "Upgrade to Premium ($9.99/mo)",
                url: "/app/pricing",
                target: "_top",
              }
            : undefined
        }
      >
        <Box paddingBlockEnd="800">
          <BlockStack gap="400">
            {!hasPremium && (
              <Banner title="You are currently on the Free Plan" tone="info">
                <p>
                  Advanced widgets such as Review Carousel, Verified Buyer Badge, and Minimal Card require a Premium Subscription. Upgrade anytime to unlock all widgets!
                </p>
              </Banner>
            )}

            <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
              {WIDGETS.map((widget) => {
                const isEnabled = settings[widget.id] ?? false;
                const isLocked = widget.isPremium && !hasPremium;
                const isSubmitting =
                  fetcher.state !== "idle" &&
                  fetcher.formData?.get("key") === widget.id;

                return (
                  <Card key={widget.id} padding="0">
                    <Box
                      background="bg-surface-secondary"
                      borderStartStartRadius="300"
                      borderStartEndRadius="300"
                      overflowX="hidden"
                      overflowY="hidden"
                    >
                      <Image
                        source={widget.image}
                        alt={widget.name}
                        style={{
                          width: "100%",
                          height: "170px",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </Box>

                    <Box padding="400">
                      <BlockStack gap="300">
                        <InlineStack align="space-between" blockAlign="center">
                          <Text variant="headingSm" as="h3">
                            {widget.name}
                          </Text>
                          <InlineStack gap="100">
                            {widget.isPremium && (
                              <Badge tone="warning">PRO</Badge>
                            )}
                            <Badge tone={isEnabled ? "success" : "attention"}>
                              {isEnabled ? "Active" : "Disabled"}
                            </Badge>
                          </InlineStack>
                        </InlineStack>

                        <Text variant="bodySm" tone="subdued">
                          {widget.description}
                        </Text>

                        <Divider />

                        {isLocked ? (
                          <Button
                            fullWidth
                            tone="critical"
                            variant="primary"
                            url="/app/pricing"
                            target="_top"
                          >
                            Unlock with Premium
                          </Button>
                        ) : (
                          <fetcher.Form method="post">
                            <input type="hidden" name="key" value={widget.id} />
                            <input
                              type="hidden"
                              name="enabled"
                              value={isEnabled ? "false" : "true"}
                            />
                            <input
                              type="hidden"
                              name="isPremium"
                              value={widget.isPremium ? "true" : "false"}
                            />
                            <Button
                              fullWidth
                              variant={isEnabled ? "secondary" : "primary"}
                              tone={isEnabled ? "critical" : undefined}
                              submit
                              loading={isSubmitting}
                            >
                              {isEnabled ? "Disable Widget" : "Enable Widget"}
                            </Button>
                          </fetcher.Form>
                        )}
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