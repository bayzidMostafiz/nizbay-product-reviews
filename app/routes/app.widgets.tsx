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
} from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import { authenticate } from "../shopify.server";

// 1. Metafield read kora
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

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

  return { settings };
};

// 2. Toggle button click korle Metafield update kora
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const key = formData.get("key") as string;
  const enabled = formData.get("enabled") === "true";

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
    `
    #graphql
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
    }
  `,
    {
      variables: {
        metafields: [
          {
            namespace: "nizbay_widgets",
            key: key,
            type: "boolean",
            value: enabled ? "true" : "false",
            ownerId: ownerId,
          },
        ],
      },
    }
  );

  return { success: true };
};

// 3. Widget list sathe preview dummy image
const WIDGETS = [
  {
    id: "star_rating",
    name: "Star Rating Badge",
    description: "Display compact star ratings directly below your product titles.",
    image: "https://placehold.co/600x320/2563eb/ffffff?text=Star+Rating+Widget",
  },
  {
    id: "review_list",
    name: "Full Review Form & List",
    description: "Complete review submission form with ratings, text, and customer reviews.",
    image: "https://placehold.co/600x320/059669/ffffff?text=Review+List+%26+Form",
  },
  {
    id: "review_carousel",
    name: "Review Carousel",
    description: "Horizontal interactive review slider to showcase customer testimonials.",
    image: "https://placehold.co/600x320/7c3aed/ffffff?text=Review+Carousel",
  },
  {
    id: "verified_badge",
    name: "Verified Buyer Badge",
    description: "Highlight authentic buyer trust badges beside verified purchase reviews.",
    image: "https://placehold.co/600x320/ea580c/ffffff?text=Verified+Buyer+Badge",
  },
  {
    id: "minimal_card",
    name: "Minimal Review Card",
    description: "Modern compact highlight card ideal for sidebars, carts, or footer sections.",
    image: "https://placehold.co/600x320/0284c7/ffffff?text=Minimal+Review+Card",
  },
];

export default function WidgetsPage() {
  const { settings } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  return (
    <AppProvider i18n={enTranslations}>
      <Page
        title="Review Widgets"
        subtitle="Turn review components on or off to make them available in your store theme."
      >
        <Box paddingBlockEnd="800">
          <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
            {WIDGETS.map((widget) => {
              const isEnabled = settings[widget.id] ?? false;
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
                        <Badge tone={isEnabled ? "success" : "attention"}>
                          {isEnabled ? "Active" : "Disabled"}
                        </Badge>
                      </InlineStack>

                      <Text variant="bodySm" tone="subdued">
                        {widget.description}
                      </Text>

                      <Divider />

                      <fetcher.Form method="post">
                        <input type="hidden" name="key" value={widget.id} />
                        <input
                          type="hidden"
                          name="enabled"
                          value={isEnabled ? "false" : "true"}
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