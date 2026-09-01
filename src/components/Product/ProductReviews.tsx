"use client";

import { useEffect, useMemo, useState } from "react";
import { useAtom } from "jotai";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2Icon,
  Loader2Icon,
  StarIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { Card, CardContent } from "@/components/shadcnui/card";
import { Field, FieldError, FieldLabel } from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { Separator } from "@/components/shadcnui/separator";
import { Textarea } from "@/components/shadcnui/textarea";
import { toast } from "@/components/shadcnui/toast";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getReviewsAtom } from "@/lib/reviews/atoms";
import { reviewCreateSchema, type reviewCreateType } from "@/lib/zodSchema";
import {
  createReview,
  getCanReview,
  getReviewsBySlug,
  toggleHelpful,
  type ReviewDTO,
} from "@/server/reviews";
import { authClient } from "@/lib/auth-client";

function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const starSize = size === "md" ? "size-5" : "size-4";
  return (
    <span
      className="flex items-center gap-0.5"
      aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i + 1 <= Math.round(value);
        return (
          <StarIcon
            key={i}
            aria-hidden="true"
            className={cn(
              starSize,
              filled ?
                "fill-amber-400 text-amber-400"
              : "fill-muted text-muted-foreground/30",
            )}
          />
        );
      })}
    </span>
  );
}

function getSummary(reviews: ReviewDTO[]) {
  if (reviews.length === 0) {
    return {
      average: 0,
      count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<
        1 | 2 | 3 | 4 | 5,
        number
      >,
    };
  }
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  let sum = 0;
  for (const r of reviews) {
    sum += r.rating;
    distribution[r.rating as 1 | 2 | 3 | 4 | 5] += 1;
  }
  return {
    average: Math.round((sum / reviews.length) * 10) / 10,
    count: reviews.length,
    distribution,
  };
}

function Distribution({ summary }: { summary: ReturnType<typeof getSummary> }) {
  return (
    <div className="flex flex-col gap-1.5">
      {([5, 4, 3, 2, 1] as const).map((star) => {
        const count = summary.distribution[star];
        const pct = summary.count > 0 ? (count / summary.count) * 100 : 0;
        return (
          <div
            key={star}
            className="flex items-center gap-2 text-xs">
            <span className="w-6 tabular-nums">{star}★</span>
            <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-muted-foreground w-7 text-right tabular-nums">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const REVIEWS_PER_PAGE = 4;

const ProductReviews = ({
  slug,
  productId,
  initialReviews,
}: {
  slug: string;
  productId: string;
  initialReviews: ReviewDTO[];
}) => {
  const reviewsAtom = getReviewsAtom(slug);
  const [reviews, setReviews] = useAtom(reviewsAtom);
  const [visible, setVisible] = useState(REVIEWS_PER_PAGE);
  const [filter, setFilter] = useState<number | null>(null);
  const [sort, setSort] = useState<"newest" | "helpful">("newest");
  const [showForm, setShowForm] = useState(false);
  const [canReview, setCanReview] = useState<boolean | null>(null);
  const { data: session } = authClient.useSession();

  // hydrate once from server
  useEffect(() => {
    if (reviews.length === 0 && initialReviews.length > 0) {
      setReviews(initialReviews);
    }
  }, [initialReviews, reviews.length, setReviews]);

  // check canReview + polling realtime
  useEffect(() => {
    void getCanReview(slug).then((r) => setCanReview(r.canReview));

    const id = setInterval(async () => {
      if (document.hidden) return;
      try {
        const fresh = await getReviewsBySlug(slug);
        setReviews((prev) => {
          const hasTemp = prev.some((r) => r.id.startsWith("temp-"));
          if (hasTemp) {
            const temps = prev.filter((p) => p.id.startsWith("temp-"));
            const merged = [...temps, ...fresh].sort(
              (a, b) => +new Date(b.date) - +new Date(a.date),
            );
            return merged;
          }
          // preserve local helpful increments for mock reviews (no DB row)
          const isMockFresh = fresh.length > 0 && fresh.every((r) => r.isMock);
          if (isMockFresh) {
            if (prev.length === 0) return fresh;
            if (prev.every((p) => p.isMock)) {
              const prevById = new Map(prev.map((p) => [p.id, p]));
              return fresh.map((f) => {
                const p = prevById.get(f.id);
                return p ?
                    { ...f, helpful: p.helpful, hasVoted: p.hasVoted }
                  : f;
              });
            }
            return prev;
          }
          return fresh;
        });
      } catch {
        // ignore polling errors
      }
    }, 5000);
    return () => clearInterval(id);
  }, [slug, setReviews]);

  const summary = useMemo(() => getSummary(reviews), [reviews]);
  const hasOwnReview = useMemo(
    () => (session ? reviews.some((r) => r.userId === session.user.id) : false),
    [reviews, session],
  );

  const filtered = useMemo(
    () =>
      filter !== null ? reviews.filter((r) => r.rating === filter) : reviews,
    [reviews, filter],
  );
  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sort === "helpful") {
      arr.sort(
        (a, b) =>
          b.helpful - a.helpful || +new Date(b.date) - +new Date(a.date),
      );
    } else {
      arr.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    }
    return arr;
  }, [filtered, sort]);
  const show = sorted.slice(0, visible);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<reviewCreateType>({
    resolver: zodResolver(reviewCreateSchema),
    defaultValues: { productId, rating: 5, title: "", body: "" },
    mode: "all",
  });

  const onSubmit = async (values: reviewCreateType) => {
    if (!session) {
      toast.add({ title: "Sign in to write a review", type: "error" });
      return;
    }
    if (hasOwnReview) {
      toast.add({
        title: "You have already reviewed this product",
        type: "error",
      });
      return;
    }
    const temp: ReviewDTO = {
      // eslint-disable-next-line react-hooks/purity -- handler, not render
      id: `temp-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`,
      productId,
      userId: session.user.id,
      author: session.user.name ?? "You",
      authorImage: session.user.image ?? null,
      rating: values.rating,
      title: values.title,
      body: values.body,
      date: new Date().toISOString(),
      verified: true,
      helpful: 0,
      hasVoted: false,
    };
    setReviews((prev) => [temp, ...prev]);
    setShowForm(false);
    reset({ productId, rating: 5, title: "", body: "" });

    const res = await createReview(values);
    if (!res.ok) {
      setReviews((prev) => prev.filter((r) => r.id !== temp.id));
      setShowForm(true);
      if (res.error === "NOT_VERIFIED") {
        toast.add({
          title: "Only delivered purchases can review",
          description: "Your order must be marked DELIVERED for this product.",
          type: "error",
        });
      } else if (res.error === "ALREADY_REVIEWED") {
        toast.add({
          title: "You have already reviewed this product",
          type: "error",
        });
      } else if (res.error === "UNAUTHENTICATED") {
        toast.add({ title: "Sign in to write a review", type: "error" });
      } else {
        toast.add({ title: "Could not submit review", type: "error" });
      }
      return;
    }
    setReviews((prev) => [res.review, ...prev.filter((r) => r.id !== temp.id)]);
    toast.add({ title: "Review published", type: "success" });
    setCanReview(false);
    try {
      const fresh = await getReviewsBySlug(slug);
      setReviews(fresh);
    } catch {}
  };

  const handleHelpful = async (review: ReviewDTO) => {
    if (review.isMock) {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id ?
            {
              ...r,
              helpful: r.hasVoted ? r.helpful - 1 : r.helpful + 1,
              hasVoted: !r.hasVoted,
            }
          : r,
        ),
      );
      toast.add({ title: "Thanks for your feedback", type: "success" });
      return;
    }
    if (!session) {
      toast.add({ title: "Sign in to vote", type: "error" });
      return;
    }
    const prevHelpful = review.helpful;
    const prevVoted = review.hasVoted;
    setReviews((prev) =>
      prev.map((r) =>
        r.id === review.id ?
          {
            ...r,
            helpful: r.hasVoted ? r.helpful - 1 : r.helpful + 1,
            hasVoted: !r.hasVoted,
          }
        : r,
      ),
    );
    const res = await toggleHelpful({ reviewId: review.id });
    if (!res.ok) {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id ?
            { ...r, helpful: prevHelpful, hasVoted: prevVoted }
          : r,
        ),
      );
      if (res.error === "MOCK_REVIEW")
        toast.add({ title: "Thanks for your feedback", type: "success" });
      else if (res.error === "UNAUTHENTICATED")
        toast.add({ title: "Sign in to vote", type: "error" });
      else toast.add({ title: "Something went wrong", type: "error" });
      return;
    }
    setReviews((prev) =>
      prev.map((r) =>
        r.id === review.id ?
          { ...r, helpful: res.helpful, hasVoted: res.hasVoted }
        : r,
      ),
    );
  };

  const handleWriteClick = async () => {
    if (!session) {
      toast.add({ title: "Sign in to write a review", type: "error" });
      return;
    }
    if (canReview === false) {
      const res = await getCanReview(slug);
      if (!res.canReview) {
        const already = reviews.some((r) => r.userId === session.user.id);
        if (already)
          toast.add({
            title: "You have already reviewed this product",
            type: "error",
          });
        else
          toast.add({
            title: "Only delivered purchases can review",
            description: "Order must be DELIVERED.",
            type: "error",
          });
        return;
      }
      setCanReview(true);
    }
    if (canReview === null) {
      const res = await getCanReview(slug);
      setCanReview(res.canReview);
      if (!res.canReview) {
        toast.add({
          title: "Only delivered purchases can review",
          description: "Order must be DELIVERED.",
          type: "error",
        });
        return;
      }
    }
    setShowForm((v) => !v);
  };

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="flex flex-col gap-6 border-t pt-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            id="reviews-heading"
            className="font-heading text-xl font-medium">
            Customer reviews
          </h2>
          <p className="text-muted-foreground text-sm">
            Verified purchases only, ratings 1 to 5.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleWriteClick}>
          {showForm ? "Cancel" : "Write a review"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="flex flex-col gap-4">
              <Controller
                name="rating"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Rating</FieldLabel>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => field.onChange(n)}
                          aria-label={`${n} star`}
                          className={cn(
                            "rounded-md border p-2",
                            field.value === n ?
                              "border-amber-400 bg-amber-400 text-white"
                            : "bg-background",
                          )}>
                          <StarIcon
                            className={cn(
                              "size-4",
                              field.value >= n ? "fill-current" : "",
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="title"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="Amazing quality"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="body"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Review</FieldLabel>
                    <Textarea
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="Share your delivery and product experience..."
                      rows={4}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-fit">
                {isSubmitting && (
                  <Loader2Icon
                    className="animate-spin"
                    data-icon="inline-start"
                  />
                )}
                Publish review
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {reviews.length === 0 ?
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm font-medium">No reviews yet</p>
            <p className="text-muted-foreground text-sm">
              Be the first to review this product after your order is delivered.
            </p>
          </CardContent>
        </Card>
      : <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card className="h-fit">
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-semibold tabular-nums">
                  {summary.average.toFixed(1)}
                </span>
                <span className="text-muted-foreground text-sm">/ 5</span>
              </div>
              <Stars
                value={summary.average}
                size="md"
              />
              <p className="text-muted-foreground text-xs">
                Based on {summary.count} verified ratings
              </p>
              <Separator />
              <Distribution summary={summary} />
              <div className="flex flex-wrap gap-1.5 pt-2">
                <Button
                  variant={filter === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setFilter(null);
                    setVisible(REVIEWS_PER_PAGE);
                  }}>
                  All
                </Button>
                {([5, 4, 3, 2, 1] as const).map((star) => (
                  <Button
                    key={star}
                    variant={filter === star ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setFilter(star);
                      setVisible(REVIEWS_PER_PAGE);
                    }}>
                    {star}★
                  </Button>
                ))}
              </div>
              <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <CheckCircle2Icon
                  className="size-3.5"
                  aria-hidden="true"
                />
                Only verified Unboxd purchases count
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-sm tabular-nums">
                {sorted.length} review{sorted.length === 1 ? "" : "s"}
                {filter !== null ? ` · ${filter}★` : ""}
              </span>
              <div className="flex gap-1">
                <Button
                  variant={sort === "newest" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSort("newest");
                    setVisible(REVIEWS_PER_PAGE);
                  }}>
                  Newest
                </Button>
                <Button
                  variant={sort === "helpful" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSort("helpful");
                    setVisible(REVIEWS_PER_PAGE);
                  }}>
                  Most helpful
                </Button>
              </div>
            </div>
            {show.map((review) => (
              <Card key={review.id}>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Stars value={review.rating} />
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {formatDate(review.date)}
                    </span>
                  </div>
                  <h3 className="text-sm leading-snug font-medium">
                    {review.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {review.body}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-medium">{review.author}</span>
                    {review.verified && (
                      <Badge
                        variant="secondary"
                        className="gap-1">
                        <CheckCircle2Icon
                          className="size-3"
                          aria-hidden="true"
                        />{" "}
                        Verified Purchase
                      </Badge>
                    )}
                    {review.id.startsWith("temp-") && (
                      <Badge variant="outline">Publishing…</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleHelpful(review)}
                      data-icon="inline-start"
                      className="h-7 px-2 text-xs"
                      disabled={review.id.startsWith("temp-")}>
                      <ThumbsUpIcon
                        aria-hidden="true"
                        className={cn(review.hasVoted && "fill-current")}
                      />
                      Helpful ({review.helpful})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filtered.length === 0 && (
              <Card>
                <CardContent className="py-6 text-center">
                  <p className="text-muted-foreground text-sm">
                    No {filter} star reviews for this filter.
                  </p>
                </CardContent>
              </Card>
            )}

            {visible < filtered.length && (
              <Button
                variant="outline"
                onClick={() => setVisible((v) => v + REVIEWS_PER_PAGE)}
                className="w-fit self-center">
                Show more ({filtered.length - visible} remaining)
              </Button>
            )}

            {filter !== null &&
              filtered.length > 0 &&
              visible >= filtered.length && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilter(null);
                    setVisible(REVIEWS_PER_PAGE);
                  }}
                  className="w-fit self-center">
                  Clear filter
                </Button>
              )}
          </div>
        </div>
      }
    </section>
  );
};

export default ProductReviews;
