"use server";

import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import prisma from "@/lib/dbClient/prisma";
import { auth } from "@/lib/auth";
import { reviewCreateSchema, reviewHelpfulSchema } from "@/lib/zodSchema";
import { getReviewsForProduct, type Review as MockReview } from "@/lib/reviews";

export type ReviewDTO = {
  id: string;
  productId: string;
  userId: string;
  author: string;
  authorImage: string | null;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
  helpful: number;
  hasVoted: boolean;
  isMock?: boolean;
};

function toDTO(row: {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  helpful: number;
  createdAt: Date;
  user: { name: string; image: string | null };
  hasVoted?: boolean;
}): ReviewDTO {
  return {
    id: row.id,
    productId: row.productId,
    userId: row.userId,
    author: row.user.name,
    authorImage: row.user.image,
    rating: row.rating,
    title: row.title,
    body: row.body,
    date: row.createdAt.toISOString(),
    verified: row.verified,
    helpful: row.helpful,
    hasVoted: row.hasVoted ?? false,
  };
}

function mockToDTO(m: MockReview): ReviewDTO {
  return {
    id: m.id,
    productId: "",
    userId: "",
    author: m.author,
    authorImage: null,
    rating: m.rating,
    title: m.title,
    body: m.body,
    date: m.date,
    verified: m.verified,
    helpful: m.helpful,
    hasVoted: false,
    isMock: true,
  };
}

export async function getReviewsBySlug(slug: string): Promise<ReviewDTO[]> {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!product) return [];

  let userId: string | null = null;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    userId = session?.user.id ?? null;
  } catch {
    userId = null;
  }

  const rows = await prisma.review.findMany({
    where: { productId: product.id },
    include: { user: { select: { name: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (rows.length === 0) {
    return getReviewsForProduct(slug).map(mockToDTO);
  }
  // keep social proof until real reviews reach threshold — avoid 9→1 drop
  if (rows.length < 6) {
    const mocks = getReviewsForProduct(slug).map(mockToDTO);
    const need = Math.min(mocks.length, 6 - rows.length);
    // avoid id collision with real (mocks use "rvw-..." prefix, real are cuid)
    return [
      ...rows.map((r) => toDTO({ ...r, hasVoted: votedSet.has(r.id) })),
      ...mocks.slice(0, need),
    ];
  }

  let votedSet = new Set<string>();
  if (userId) {
    const votes = await prisma.reviewHelpful.findMany({
      where: { userId, reviewId: { in: rows.map((r) => r.id) } },
      select: { reviewId: true },
    });
    votedSet = new Set(votes.map((v) => v.reviewId));
  }

  return rows.map((r) => toDTO({ ...r, hasVoted: votedSet.has(r.id) }));
}

export async function getCanReview(
  slug: string,
): Promise<{ canReview: boolean; productId: string | null }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { canReview: false, productId: null };
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!product) return { canReview: false, productId: null };

  const already = await prisma.review.findUnique({
    where: {
      productId_userId: { productId: product.id, userId: session.user.id },
    },
  });
  if (already) return { canReview: false, productId: product.id };

  const delivered = await prisma.order.findFirst({
    where: {
      userId: session.user.id,
      status: "DELIVERED",
      items: { some: { productId: product.id } },
    },
    select: { id: true },
  });
  return { canReview: !!delivered, productId: product.id };
}

export type CreateReviewResult =
  | { ok: true; review: ReviewDTO }
  | {
      ok: false;
      error:
        | "UNAUTHENTICATED"
        | "NOT_VERIFIED"
        | "ALREADY_REVIEWED"
        | "INVALID_INPUT"
        | "SERVER_ERROR"
        | "PRODUCT_NOT_FOUND";
    };

export async function createReview(
  input: unknown,
): Promise<CreateReviewResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, error: "UNAUTHENTICATED" };

  const parsed = reviewCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

  const { productId, rating, title, body } = parsed.data;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true },
  });
  if (!product) return { ok: false, error: "PRODUCT_NOT_FOUND" };

  const delivered = await prisma.order.findFirst({
    where: {
      userId: session.user.id,
      status: "DELIVERED",
      items: { some: { productId } },
    },
    select: { id: true },
  });
  if (!delivered) return { ok: false, error: "NOT_VERIFIED" };

  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId: session.user.id } },
  });
  if (existing) return { ok: false, error: "ALREADY_REVIEWED" };

  try {
    const row = await prisma.review.create({
      data: {
        productId,
        userId: session.user.id,
        rating,
        title,
        body,
        verified: true,
      },
      include: { user: { select: { name: true, image: true } } },
    });
    revalidateTag("reviews", "max");
    revalidateTag(`reviews-${product.slug}`, "max");
    return { ok: true, review: toDTO({ ...row, hasVoted: false }) };
  } catch (e) {
    console.error("createReview failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export type ToggleHelpfulResult =
  | { ok: true; helpful: number; hasVoted: boolean }
  | {
      ok: false;
      error: "UNAUTHENTICATED" | "NOT_FOUND" | "MOCK_REVIEW" | "SERVER_ERROR";
    };

export async function toggleHelpful(
  input: unknown,
): Promise<ToggleHelpfulResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, error: "UNAUTHENTICATED" };

  const parsed = reviewHelpfulSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "NOT_FOUND" };

  const review = await prisma.review.findUnique({
    where: { id: parsed.data.reviewId },
    include: { product: { select: { slug: true } } },
  });
  if (!review) return { ok: false, error: "MOCK_REVIEW" };

  try {
    const existing = await prisma.reviewHelpful.findUnique({
      where: {
        reviewId_userId: { reviewId: review.id, userId: session.user.id },
      },
    });

    let helpful: number;
    let hasVoted: boolean;
    if (existing) {
      const [, updated] = await prisma.$transaction([
        prisma.reviewHelpful.delete({ where: { id: existing.id } }),
        prisma.review.updateMany({
          where: { id: review.id, helpful: { gt: 0 } },
          data: { helpful: { decrement: 1 } },
        }),
      ]);
      const refreshed = await prisma.review.findUnique({
        where: { id: review.id },
        select: { helpful: true },
      });
      helpful = Math.max(
        0,
        refreshed?.helpful ??
          Math.max(0, updated.count ? review.helpful - 1 : review.helpful),
      );
      hasVoted = false;
    } else {
      const [, updated] = await prisma.$transaction([
        prisma.reviewHelpful.create({
          data: { reviewId: review.id, userId: session.user.id },
        }),
        prisma.review.update({
          where: { id: review.id },
          data: { helpful: { increment: 1 } },
          select: { helpful: true },
        }),
      ]);
      helpful = updated.helpful;
      hasVoted = true;
    }

    revalidateTag("reviews", "max");
    revalidateTag(`reviews-${review.product.slug}`, "max");
    return { ok: true, helpful, hasVoted };
  } catch (e) {
    console.error("toggleHelpful failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}
