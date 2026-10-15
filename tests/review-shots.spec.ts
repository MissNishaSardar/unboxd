import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";

const shot = async (page: Page, name: string, url: string) => {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: `screenshots/review/${name}.png`,
    fullPage: true,
  });
};

test.describe("review public", () => {
  const pages: Array<[string, string]> = [
    ["01-home", "/"],
    ["02-products", "/products"],
    ["03-product-detail", "/products/iphone-15-pro"],
    ["04-category", "/categories/smartphones"],
    ["05-search-query", "/search?q=phone"],
    ["06-search-empty", "/search"],
    ["07-about", "/about"],
    ["08-contact", "/contact"],
    ["09-policy-shipping", "/policies/shipping"],
    ["10-policy-returns", "/policies/returns"],
    ["11-policy-warranty", "/policies/warranty"],
    ["12-forbidden", "/forbidden"],
    ["13-login", "/auth/login"],
    ["14-register", "/auth/register"],
    ["15-forgot", "/auth/forgot-password"],
    ["16-reset", "/auth/reset-password"],
    ["17-missing", "/no-such-page-xyz"],
  ];
  for (const [name, url] of pages) {
    test(name, async ({ page }) => {
      await shot(page, name, url);
      await expect(page.locator("body")).toBeVisible();
    });
  }
});

const loginAs = async (page: Page, email: string, password: string) => {
  const emailBox = page.locator("#email");
  const passBox = page.locator("#password");
  const submit = page.getByRole("button", { name: "Sign in" });
  await emailBox.click();
  await emailBox.fill("");
  await emailBox.pressSequentially(email, { delay: 15 });
  await emailBox.press("Tab");
  await passBox.click();
  await passBox.fill("");
  await passBox.pressSequentially(password, { delay: 15 });
  await passBox.press("Tab");
  await submit.waitFor({ state: "visible" });
  await page.waitForTimeout(800);
};

test.describe("review customer", () => {
  test("login and shoot private", async ({ page }) => {
    await page.goto("/auth/login", {
      waitUntil: "domcontentloaded",
    });
    await loginAs(
      page,
      process.env.E2E_CUSTOMER_EMAIL ?? "customer1@unboxd.com",
      process.env.E2E_CUSTOMER_PASSWORD ?? "Customer@123",
    );
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForTimeout(5000);
    await page.screenshot({
      path: "screenshots/review/19-after-customer-login.png",
      fullPage: true,
    });
    const pages: Array<[string, string]> = [
      ["20-dashboard", "/dashboard"],
      ["21-orders", "/orders"],
      ["22-cart", "/cart"],
      ["23-checkout", "/checkout"],
      ["24-settings", "/settings"],
      ["25-addresses", "/settings/addresses"],
      ["26-wishlist", "/wishlist"],
    ];
    for (const [name, url] of pages) {
      await shot(page, name, url);
    }
  });
});

test.describe("review admin", () => {
  test("login and shoot admin", async ({ page }) => {
    await page.goto("/auth/login", {
      waitUntil: "domcontentloaded",
    });
    await loginAs(
      page,
      process.env.E2E_ADMIN_EMAIL ?? "admin@unboxd.com",
      process.env.E2E_ADMIN_PASSWORD ?? "Admin@123",
    );
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForTimeout(5000);
    await page.screenshot({
      path: "screenshots/review/29-after-admin-login.png",
      fullPage: true,
    });
    const pages: Array<[string, string]> = [
      ["30-admin", "/admin"],
      ["31-admin-products", "/admin/products"],
      ["32-admin-orders", "/admin/orders"],
      ["33-admin-categories", "/admin/categories"],
      ["34-admin-users", "/admin/users"],
      ["35-admin-settings", "/admin/settings"],
    ];
    for (const [name, url] of pages) {
      await shot(page, name, url);
    }
    expect(fs.existsSync("screenshots/review/30-admin.png")).toBe(true);
  });
});
