import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { Page, Layout, Card, BlockStack, InlineStack, Text, Button, Badge } from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "../shopify.server";

// ১. মেটাফিল্ড বা ডাটাবেজ থেকে সেভ থাকা উইজেট স্টেট রিড করা
export const loader = async ({ request }) => {
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
  
  const settings = {};
  edges.forEach(({ node }) => {
    settings[node.key] = node.value === "true";
  });

  return json({ settings });
};

// ২. টগল বাটন ক্লিক করলে শপিফাই মেটাফিল্ড আপডেট করা
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const key = formData.get("key");
  const enabled = formData.get("enabled") === "true";

  // App Installation-এর নিজস্ব মেটাফিল্ডে সেভ করা
  const response = await admin.graphql(`
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
  `, {
    variables: {
      metafields: [
        {
          namespace: "nizbay_widgets",
          key: key,
          type: "boolean",
          value: enabled ? "true" : "false",
          ownerId: (await admin.graphql(`query { currentAppInstallation { id } }`).then(r => r.json())).data.currentAppInstallation.id
        }
      ]
    }
  });

  return json({ success: true });
};

// ৩. উইজেট লিস্টের UI
const WIDGETS = [
  { id: "star_rating", name: "Star Rating Badge", description: "Display star rating summary under product title." },
  { id: "review_list", name: "Full Review List & Form", description: "The full review submission box and customer reviews list." },
  { id: "review_carousel", name: "Review Carousel", description: "A horizontal sliding carousel of top customer reviews." },
  { id: "verified_badge", name: "Verified Buyer Badge", description: "Highlight trust badge on approved purchaser reviews." },
  { id: "minimal_card", name: "Minimal Review Card", description: "Clean modern minimal cards for sidebars or footers." }
];

export default function WidgetsPage() {
  const { settings } = useLoaderData();
  const fetcher = useFetcher();

  return (
    <Page title="Review Widgets" subtitle="Enable or disable review components for your storefront.">
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {WIDGETS.map((widget) => {
              const isEnabled = settings[widget.id] ?? false;
              const isSubmitting = fetcher.state !== "idle" && fetcher.formData?.get("key") === widget.id;

              return (
                <Card key={widget.id}>
                  <InlineStack align="space-between" blockAlign="center">
                    <BlockStack gap="100">
                      <InlineStack gap="200" blockAlign="center">
                        <Text variant="headingMd" as="h5">{widget.name}</Text>
                        <Badge tone={isEnabled ? "success" : "attention"}>
                          {isEnabled ? "Active" : "Disabled"}
                        </Badge>
                      </InlineStack>
                      <Text variant="bodySm" tone="subdued">{widget.description}</Text>
                    </BlockStack>

                    <fetcher.Form method="post">
                      <input type="hidden" name="key" value={widget.id} />
                      <input type="hidden" name="enabled" value={isEnabled ? "false" : "true"} />
                      <Button
                        variant={isEnabled ? "secondary" : "primary"}
                        tone={isEnabled ? "critical" : undefined}
                        submit
                        loading={isSubmitting}
                      >
                        {isEnabled ? "Disable Widget" : "Enable Widget"}
                      </Button>
                    </fetcher.Form>
                  </InlineStack>
                </Card>
              );
            })}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}