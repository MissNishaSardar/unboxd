import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guard";
import { adminUserListSearchParamsSchema } from "@/lib/zodSchema";
import { getAdminUsers } from "@/server/admin/queries";

export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const parsed = adminUserListSearchParamsSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );
  const data = await getAdminUsers(parsed);
  return NextResponse.json(data);
}
