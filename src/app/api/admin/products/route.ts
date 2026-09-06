import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guard";
import { adminProductListSearchParamsSchema } from "@/lib/zodSchema";
import { getAdminProducts } from "@/server/admin/queries";

export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const parsed = adminProductListSearchParamsSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );
  const data = await getAdminProducts(parsed);
  return NextResponse.json(data);
}
