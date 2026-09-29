import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSubmit } from "react-router";
import {
  AppProvider,
  Page,
  Layout,
  Card,
  IndexTable,
  Badge,
  Text,
  Button,
  InlineStack,
  BlockStack,
  EmptyState,
} from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// ১. ডাটাবেজ থেকে রিভিউ লোড করা
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const reviews = await prisma.review.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
  });

  return { reviews };
};

// ২. স্ট্যাটাস পরিবর্তন একশন
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const reviewId = formData.get("reviewId") as string;
  const status = formData.get("status") as string;

  if (reviewId && status) {
    await prisma.review.updateMany({
      where: {
        id: reviewId,
        shop: session.shop,
      },
      data: { status },
    });
  }

  return { success: true };
};

export default function Index() {
  const { reviews } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const handleStatusChange = (reviewId: string, status: string) => {
    submit({ reviewId, status }, { method: "post" });
  };

  const resourceName = {
    singular: "review",
    plural: "reviews",
  };

  const rowMarkup = reviews.map(
    (
      { id, customerName, customerEmail, rating, title, body, status },
      index
    ) => (
      <IndexTable.Row id={id} key={id} position={index}>
        <IndexTable.Cell>
          <BlockStack gap="100">
            <Text variant="bodyMd" fontWeight="bold" as="span">
              {customerName}
            </Text>
            <Text variant="bodySm" tone="subdued" as="span">
              {customerEmail}
            </Text>
          </BlockStack>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {"★".repeat(rating)}{"☆".repeat(5 - rating)} ({rating}/5)
          </Text>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <BlockStack gap="100">
            {title && (
              <Text variant="bodyMd" fontWeight="semibold" as="span">
                {title}
              </Text>
            )}
            <Text variant="bodySm" as="span">
              {body}
            </Text>
          </BlockStack>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <Badge
            tone={
              status === "approved"
                ? "success"
                : status === "spam"
                ? "critical"
                : "attention"
            }
          >
            {status.toUpperCase()}
          </Badge>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <InlineStack gap="200">
            {status !== "approved" && (
              <Button
                size="slim"
                variant="primary"
                onClick={() => handleStatusChange(id, "approved")}
              >
                Approve
              </Button>
            )}
            {status !== "spam" && (
              <Button
                size="slim"
                tone="critical"
                onClick={() => handleStatusChange(id, "spam")}
              >
                Spam
              </Button>
            )}
          </InlineStack>
        </IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  return (
    <AppProvider i18n={enTranslations}>
      <Page title="Product Reviews">
        <Layout>
          <Layout.Section>
            <Card padding="0">
              {reviews.length === 0 ? (
                <EmptyState
                  heading="No reviews yet"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>When customers leave reviews on your products, they will appear here.</p>
                </EmptyState>
              ) : (
                <IndexTable
                  resourceName={resourceName}
                  itemCount={reviews.length}
                  headings={[
                    { title: "Customer" },
                    { title: "Rating" },
                    { title: "Review" },
                    { title: "Status" },
                    { title: "Actions" },
                  ]}
                  selectable={false}
                >
                  {rowMarkup}
                </IndexTable>
              )}
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </AppProvider>
  );
}