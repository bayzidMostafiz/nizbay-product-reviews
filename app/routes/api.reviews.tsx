import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import prisma from "../db.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Loader: GET ebong OPTIONS handle korbe
export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const productId = url.searchParams.get("productId");

  if (!shop || !productId) {
    return Response.json(
      { error: "shop and productId are required" },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const reviews = await prisma.review.findMany({
      where: {
        shop,
        productId: String(productId),
        status: "approved",
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        customerName: true,
        rating: true,
        title: true,
        body: true,
        createdAt: true,
        isVerifiedBuyer: true,
      },
    });

    return Response.json({ reviews }, { headers: corsHeaders });
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch reviews" },
      { status: 500, headers: corsHeaders }
    );
  }
};

// Action: POST ebong OPTIONS handle korbe
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const data = await request.json();
    const { shop, productId, customerName, customerEmail, rating, title, body } = data;

    if (!shop || !productId || !customerName || !customerEmail || !rating || !body) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400, headers: corsHeaders }
      );
    }

    const newReview = await prisma.review.create({
      data: {
        shop,
        productId: String(productId),
        customerName,
        customerEmail,
        rating: Number(rating),
        title: title || "",
        body,
        status: "pending",
      },
    });

    return Response.json(
      { success: true, message: "Review submitted successfully!", review: newReview },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Review creation error:", error);
    return Response.json(
      { error: "Failed to create review" },
      { status: 500, headers: corsHeaders }
    );
  }
};