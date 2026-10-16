import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";

// Seed owned defaults. Override with env when seed changes.
const PRODUCT_SLUG = process.env.E2E_PRODUCT_SLUG ?? "iphone-15-pro";
const CATEGORY_SLUG = process.env.E2E_CATEGORY_SLUG ?? "smartphones";
const SEARCH_QUERY = process.env.E2E_SEARCH_QUERY ?? "phone";
const CUSTOMER_EMAIL = process.env.E2E_CUSTOMER_EMAIL ?? "customer1@unboxd.com";
const CUSTOMER_PASSWORD = process.env.E2E_CUSTOMER_PASSWORD ?? "Customer@123";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@unboxd.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "Admin@123";
const ORDER_NAME = process.env.E2E_ORDER_NAME ?? "Priya Sharma";
const ORDER_PHONE = process.env.E2E_ORDER_PHONE ?? "9876543210";
const ORDER_ADDRESS = process.env.E2E_ORDER_ADDRESS ?? "221 MG Road";
const ORDER_CITY = process.env.E2E_ORDER_CITY ?? "Bengaluru";
const ORDER_STATE = process.env.E2E_ORDER_STATE ?? "Karnataka";
const ORDER_PINCODE = process.env.E2E_ORDER_PINCODE ?? "560001";

const shot = async (page: Page, name: string, url: string) => {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).toBeVisible();
  await page.screenshot({
    path: `screenshots/review/${name}.png`,
    fullPage: true,
  });
};

test.describe("review public", () => {
  const pages: Array<[string, string]> = [
    ["01-home", "/"],
    ["02-products", "/products"],
    ["03-product-detail", `/products/${PRODUCT_SLUG}`],
    ["04-category", `/categories/${CATEGORY_SLUG}`],
    ["05-search-query", `/search?q=${SEARCH_QUERY}`],
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
  await expect(submit).toBeEnabled({ timeout: 15000 });
};

test.describe("review customer", () => {
  test("login and shoot private", async ({ page }) => {
    await page.goto("/auth/login", {
      waitUntil: "domcontentloaded",
    });
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 20000 });
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
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/admin/, { timeout: 20000 });
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
      ["36-admin-deals", "/admin/deals"],
    ];
    for (const [name, url] of pages) {
      await shot(page, name, url);
    }
    expect(fs.existsSync("screenshots/review/30-admin.png")).toBe(true);
  });
});

test.describe("review order flow", () => {
  test("customer places an order", async ({ page }) => {
    test.slow();
    await page.goto("/auth/login", {
      waitUntil: "domcontentloaded",
    });
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 20000 });

    await page.goto("/products", { waitUntil: "domcontentloaded" });
    await page
      .getByRole("button", { name: "Add", exact: true })
      .first()
      .click();
    await expect(page.getByText("Added to cart")).toBeVisible({
      timeout: 15000,
    });
    await page.keyboard.press("Escape");

    await shot(page, "40-cart-full", "/cart");

    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    if ((await page.locator("#name").count()) > 0) {
      await page.locator("#name").fill(ORDER_NAME);
      await page.locator("#phone").fill(ORDER_PHONE);
      await page.locator("#addressLine").fill(ORDER_ADDRESS);
      await page.locator("#city").fill(ORDER_CITY);
      await page.locator("#state").click();
      await page.getByRole("option", { name: ORDER_STATE }).click();
      await page.locator("#pincode").fill(ORDER_PINCODE);
    }
    await expect(page.getByRole("button", { name: "Place order" })).toBeVisible(
      { timeout: 15000 },
    );
    await page.screenshot({
      path: "screenshots/review/41-checkout-full.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "Place order" }).click();
    await page.getByText("Order placed").waitFor({ timeout: 20000 });
    await page.screenshot({
      path: "screenshots/review/42-order-success.png",
      fullPage: true,
    });
    await page
      .locator("a[href^='/orders/']", { hasText: "View order" })
      .click();
    await page.waitForURL(/\/orders\/[^/]+$/, { timeout: 20000 });
    await expect(page.locator("body")).toBeVisible();
    await page.screenshot({
      path: "screenshots/review/43-order-detail.png",
      fullPage: true,
    });
    await shot(page, "44-dashboard-full", "/dashboard");
  });
});
