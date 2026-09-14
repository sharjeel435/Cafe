import { test, expect, type Page } from "@playwright/test";
async function login(
  page: Page,
  email: string,
  password: string,
  path: string,
) {
  await page.goto("/login");
  await page.getByLabel(/Email address/).fill(email);
  await page.getByLabel(/^Password/).fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${path}$`));
}
test.beforeEach(async ({ page, baseURL }) => {
  const hostname = new URL(baseURL!).hostname;
  if (!["localhost", "127.0.0.1"].includes(hostname))
    throw new Error(
      "Run these mutating browser tests only against an isolated local app/database.",
    );
  page.on("pageerror", (error) => {
    throw error;
  });
});
test("public homepage, searchable menu and mobile layout", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Good food.",
  );
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Explore the menu", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Chicken Biryani", exact: true }),
  ).toBeVisible();
  await page.getByRole("searchbox").fill("no-such-dish-xyz");
  await page.getByRole("searchbox").press("Enter");
  await expect(page.getByText("No food matched your search")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Chicken Biryani", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: "test-results/menu-mobile.png",
    fullPage: true,
  });
});
for (const account of [
  {
    email: "admin@campusbite.pk",
    password: "Admin@123",
    path: "/admin",
    routes: [
      "/admin/users",
      "/admin/menu",
      "/admin/orders",
      "/admin/settings",
      "/admin/reports",
    ],
  },
  {
    email: "staff@campusbite.pk",
    password: "Staff@123",
    path: "/staff",
    routes: ["/staff/menu", "/staff/orders", "/staff/pickup"],
  },
  {
    email: "ahmed@student.ku.edu.pk",
    password: "Student@123",
    path: "/student",
    routes: [
      "/student/menu",
      "/student/cart",
      "/student/wallet",
      "/student/orders",
      "/student/profile",
      "/student/notifications",
    ],
  },
  {
    email: "fatima@student.ku.edu.pk",
    password: "Student@123",
    path: "/student",
    routes: ["/student/wallet"],
  },
  {
    email: "bilal@student.ku.edu.pk",
    password: "Student@123",
    path: "/student",
    routes: ["/student/wallet"],
  },
])
  test(`${account.email}: signs in and renders role pages`, async ({
    page,
  }) => {
    await login(page, account.email, account.password, account.path);
    for (const route of account.routes) {
      await page.goto(route);
      await expect(page.getByText("We couldn’t load this page")).toHaveCount(0);
      await expect(page.locator("main")).toBeVisible();
    }
    if (account.path === "/student") {
      await page.goto("/admin");
      await expect(page).toHaveURL(/\/student$/);
    }
  });
test("student customizes, checks out with wallet and cancels for a refund", async ({
  page,
}) => {
  await login(page, "ahmed@student.ku.edu.pk", "Student@123", "/student");
  await page.goto("/student/menu");
  await page
    .getByRole("heading", { name: "Zinger Burger", exact: true })
    .click();
  await page.getByRole("button", { name: /Large/ }).click();
  await expect(page.getByRole("button", { name: /Add to Cart/ })).toContainText(
    "460",
  );
  await page.getByRole("button", { name: /Add to Cart/ }).click();
  await page.goto("/student/cart");
  await expect(page.locator("main")).toContainText("460");
  await page.getByRole("link", { name: /checkout/i }).click();
  await page
    .getByRole("button", { name: /spots left/ })
    .first()
    .click();
  await page.getByRole("button", { name: /Campus Wallet/ }).click();
  await page.getByRole("button", { name: /Place Order/ }).click();
  await expect(page).toHaveURL(/\/student\/orders\/[^/]+$/);
  await expect(page.locator("main")).toContainText("460");
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /Cancel Order/i }).click();
  await expect(page.locator("main")).toContainText("Cancelled");
  await page.goto("/student/wallet");
  await expect(page.locator("main")).toContainText("2,500");
  await page.goto("/student/profile");
  await page.getByRole("button", { name: "Sign Out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
});
