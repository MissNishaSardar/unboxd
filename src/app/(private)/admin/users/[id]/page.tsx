import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, StarIcon } from "lucide-react";
import prisma from "@/lib/dbClient/prisma";
import { requireAdminPage } from "@/lib/guard";
import { formatDate, formatPrice } from "@/lib/format";
import { getAdminUserDetail } from "@/server/admin/queries";
import ProfileSummary from "@/components/Profile/ProfileSummary";
import UserDetailActions from "@/components/Admin/UserDetailActions";
import OrderStatusBadge from "@/components/Orders/OrderStatusBadge";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true, email: true },
  });
  return {
    title: user ? user.name : "User",
    description:
      user ?
        `Profile, orders, reviews, and management actions for ${user.name}.`
      : "Manage an Unboxd user.",
  };
}

const DETAIL_STATS = [
  { key: "orders", label: "Orders" },
  { key: "lifetime", label: "Lifetime value" },
  { key: "open", label: "Open orders" },
  { key: "reviews", label: "Reviews" },
  { key: "wishlist", label: "Wishlist items" },
] as const;

const AdminUserDetailPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const session = await requireAdminPage();

  const { id } = await params;
  const detail = await getAdminUserDetail(id);
  if (!detail) notFound();

  const { profile, stats, orders, reviews, sessions, addresses } = detail;

  const statValues: Record<(typeof DETAIL_STATS)[number]["key"], string> = {
    orders: String(stats.orderCount),
    lifetime: formatPrice(stats.lifetimeValue),
    open: String(stats.openOrderCount),
    reviews: String(stats.reviewCount),
    wishlist: String(stats.wishlistCount),
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/admin/users" />}
          nativeButton={false}
          className="w-fit">
          <ArrowLeftIcon aria-hidden="true" />
          Back to users
        </Button>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {profile.name}
        </h1>
        <p className="text-muted-foreground text-sm">
          User detail and management
        </p>
      </div>

      {/* Merged card, read-only identity left, management controls right */}
      <UserDetailActions
        user={{
          id: profile.id,
          name: profile.name,
          role: profile.role,
          banned: profile.banned,
          deletedAt: profile.deletedAt,
        }}
        currentUserId={session.user.id}>
        <ProfileSummary
          view={profile}
          variant="admin"
          bare
        />
      </UserDetailActions>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {DETAIL_STATS.map((stat) => (
          <Card
            key={stat.key}
            className="border-border bg-card">
            <CardContent className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-muted-foreground text-sm">{stat.label}</p>
                <p className="text-xl font-semibold tabular-nums">
                  {statValues[stat.key]}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>Latest 10 orders, newest first</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ?
            <p className="text-muted-foreground text-sm">No orders yet.</p>
          : <ul className="flex flex-col divide-y">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="py-2 first:pt-0 last:pb-0">
                  <Link
                    href={`/admin/orders/${order.id}` as Route}
                    className="hover:bg-muted -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-1.5 transition-colors">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        Order #{order.orderNumber}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </span>
                    <span className="text-muted-foreground flex shrink-0 items-center gap-3 text-sm tabular-nums">
                      <span>
                        {order.itemCount} item
                        {order.itemCount === 1 ? "" : "s"}
                      </span>
                      <span>{formatDate(order.createdAt)}</span>
                      <span className="font-semibold">
                        {formatPrice(order.total)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          }
        </CardContent>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
            <CardDescription>Latest 5 reviews</CardDescription>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ?
              <p className="text-muted-foreground text-sm">No reviews yet.</p>
            : <ul className="flex flex-col gap-3">
                {reviews.map((review) => (
                  <li
                    key={review.id}
                    className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-primary flex items-center gap-0.5 text-sm font-medium tabular-nums"
                        aria-label={`Rated ${review.rating} of 5`}>
                        <StarIcon
                          aria-hidden="true"
                          className="size-3.5 fill-current"
                        />
                        {review.rating}
                      </span>
                      <span className="truncate text-sm font-medium">
                        {review.title}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {review.productName} · helpful {review.helpful}
                    </p>
                  </li>
                ))}
              </ul>
            }
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Sessions</CardTitle>
            <CardDescription>Active, unexpired sessions only</CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ?
              <p className="text-muted-foreground text-sm">
                No active sessions.
              </p>
            : <ul className="flex flex-col gap-3">
                {sessions.map((sessionRow) => (
                  <li
                    key={sessionRow.id}
                    className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium tabular-nums">
                        {sessionRow.ipAddress ?? "Unknown IP"}
                      </span>
                      {sessionRow.impersonatedBy && (
                        <Badge variant="secondary">Impersonated</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground truncate text-xs">
                      {sessionRow.userAgent ?? "Unknown device"}
                    </p>
                    <p className="text-muted-foreground text-xs tabular-nums">
                      Created {formatDate(sessionRow.createdAt)} · expires{" "}
                      {formatDate(sessionRow.expiresAt)}
                    </p>
                  </li>
                ))}
              </ul>
            }
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Saved addresses</CardTitle>
          <CardDescription>
            {addresses.length} address{addresses.length === 1 ? "" : "es"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ?
            <p className="text-muted-foreground text-sm">No saved addresses.</p>
          : <ul className="flex flex-col gap-3">
              {addresses.map((address) => (
                <li
                  key={address.id}
                  className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{address.name}</span>
                    {address.label && (
                      <Badge variant="secondary">{address.label}</Badge>
                    )}
                    {address.isDefault && <Badge>Default</Badge>}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {address.addressLine}, {address.city} {address.pincode} ·{" "}
                    {address.phone}
                  </p>
                </li>
              ))}
            </ul>
          }
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserDetailPage;
