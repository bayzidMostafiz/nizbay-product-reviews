import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import prisma from "../db.server";

// CORS হেডার ফাংশন (স্টোরফ্রন্ট থেকে রিকোয়েস্ট এক্সেপ্ট করার জন্য)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ১. GET: স্টোরফ্রন্টে শুধুমাত্র Approved রিভিউ পাঠানোর জন্য
export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

  const reviews = await prisma.review.findMany({
    where: {
      shop,
      productId,
      status: "approved", // শুধু এপ্রুভ হওয়া রিভিউ দেখাবে
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
};

// ২. POST: কাস্টমার যখন স্টোরফ্রন্ট থেকে নতুন রিভিউ সাবমিট করবে
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
        productId,
        customerName,
        customerEmail,
        rating: Number(rating),
        title: title || "",
        body,
        status: "pending", // কাস্টমার দিলে ডিফল্ট 'pending' থাকবে
      },
    });

    return Response.json(
      { success: true, message: "Review submitted successfully!", review: newReview },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    return Response.json(
      { error: "Failed to create review" },
      { status: 500, headers: corsHeaders }
    );
  }
};