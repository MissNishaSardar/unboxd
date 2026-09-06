import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guard";
import { adminOrderListSearchParamsSchema } from "@/lib/zodSchema";
import { getAdminOrders } from "@/server/admin/orders";

export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const parsed = adminOrderListSearchParamsSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );
  const data = await getAdminOrders(parsed);
  return NextResponse.json(data);
}
