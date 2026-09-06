import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/dbClient/prisma";
import { auth } from "@/lib/auth";
import { orderListSearchParamsSchema } from "@/lib/zodSchema";

const ORDERS_PER_PAGE = 10;

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const { page = 1 } = orderListSearchParamsSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );
  const where = { userId: session.user.id };
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ORDERS_PER_PAGE,
      take: ORDERS_PER_PAGE,
      include: { items: true },
    }),
    prisma.order.count({ where }),
  ]);
  return NextResponse.json({
    orders,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / ORDERS_PER_PAGE)),
  });
}
