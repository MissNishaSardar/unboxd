import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@unboxd.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "Admin@123";

// Root category rows only. Child rows render a tree marker before the name,
// which is the only reliable depth signal: the indent is 1.5rem per level, so
// reading computed padding rounds every level to the same value.
const treeMarker = "\u2514";

test("admin categories drag reorder works", async ({ page }) => {
  test.setTimeout(90_000);

  await page.goto("/auth/login", { waitUntil: "domcontentloaded" });
  const emailBox = page.locator("#email");
  const passBox = page.locator("#password");
  await emailBox.click();
  await emailBox.pressSequentially(ADMIN_EMAIL, { delay: 15 });
  await emailBox.press("Tab");
  await passBox.click();
  await passBox.pressSequentially(ADMIN_PASSWORD, { delay: 15 });
  await passBox.press("Tab");
  const submit = page.getByRole("button", { name: "Sign in" });
  await expect(submit).toBeEnabled({ timeout: 15000 });
  await submit.click();
  await page.waitForURL(/\/admin/, { timeout: 20000 });

  await page.goto("/admin/categories", { waitUntil: "domcontentloaded" });
  const rows = page.locator("tr[data-cat-row]");
  await expect(rows).toHaveCount(11, { timeout: 15000 });

  const rowName = async (i: number) =>
    ((await rows.nth(i).locator("td").nth(1).textContent()) ?? "").trim();

  const firstTwoRoots = async () => {
    const total = await rows.count();
    const idx: number[] = [];
    for (let i = 0; i < total && idx.length < 2; i++) {
      if (!(await rowName(i)).startsWith(treeMarker)) idx.push(i);
    }
    if (idx.length < 2) throw new Error("no two root category rows found");
    return idx;
  };

  const rootNames = async () => {
    const idx = await firstTwoRoots();
    return [await rowName(idx[0]), await rowName(idx[1])];
  };

  // Drop a row into the bottom third of another row, which is the below zone.
  // Target geometry is measured after the drag is active, because activating
  // the drag mounts the overlay and shifts the table under the pointer.
  const dragBelow = async (sourceRow: number, targetRow: number) => {
    const handle = page
      .getByRole("button", { name: "Drag to reorder" })
      .nth(sourceRow);
    const hb = await handle.boundingBox();
    if (!hb) throw new Error("drag handle has no box");
    await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
    await page.mouse.down();
    await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2 + 6, {
      steps: 2,
    });
    const tb = await rows.nth(targetRow).boundingBox();
    if (!tb) throw new Error("target row has no box");
    await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height * 0.82, {
      steps: 18,
    });
    await page.mouse.up();
  };

  const before = await rootNames();
  const idx = await firstTwoRoots();
  await dragBelow(idx[0], idx[1]);

  // Dropping the first root below the second always swaps the pair, so the
  // assertion is independent of the current position values.
  await expect
    .poll(rootNames, { timeout: 15000 })
    .toEqual([before[1], before[0]]);
});
