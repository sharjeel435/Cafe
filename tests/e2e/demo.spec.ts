import { test, expect, type Page } from "@playwright/test";

async function login(page: Page, name: string) {
  await page.goto("/login");
  await page.locator("summary").click();
  await page.getByRole("button", { name: new RegExp(`^${name} `) }).click();
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(
    page.getByRole("heading", { name: `Welcome, ${name}` }),
  ).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/**", (route) => route.abort());
  page.on("pageerror", (error) => {
    throw error;
  });
});

for (const name of ["Admin", "Staff", "Bilal 1", "Bilal 2", "Bilal 3"]) {
  test(`${name} can sign in with authentication endpoints unavailable`, async ({
    page,
    context,
  }) => {
    await login(page, name);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: `Welcome, ${name}` }),
    ).toBeVisible();
    expect(
      (await context.cookies()).filter((c) => /session-token/.test(c.name)),
    ).toHaveLength(0);
    await page.getByRole("button", { name: "Switch account" }).click();
    await page.goto("/demo");
    await expect(
      page.getByRole("link", { name: "Choose a demo account" }),
    ).toBeVisible();
  });
}

test("student checkout, staff fulfillment, admin credit and reset share temporary state", async ({
  page,
}) => {
  await login(page, "Bilal 1");
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", { name: "Chicken Biryani", exact: true }),
    })
    .getByRole("button", { name: "Add to cart" })
    .click();
  await page.getByRole("button", { name: "Cart (1)" }).click();
  await page.getByRole("button", { name: "Place demo order" }).click();
  await expect(page.getByRole("heading", { name: "DEMO-1002" })).toBeVisible();
  await page.getByRole("button", { name: "Wallet", exact: true }).click();
  await expect(page.getByText("Rs. 2,250", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Switch account" }).click();
  await login(page, "Staff");
  await page.getByRole("button", { name: "Orders", exact: true }).click();
  const order = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "DEMO-1002" }) });
  await order.getByRole("button", { name: "Start preparing" }).click();
  await order.getByRole("button", { name: "Mark ready" }).click();
  await page.getByRole("button", { name: "Pickup", exact: true }).click();
  await page.getByRole("textbox", { name: "Pickup code" }).fill("1002");
  await page.getByRole("button", { name: "Complete pickup" }).click();
  await expect(page.getByText("No orders to show.")).toBeVisible();
  await page.getByRole("button", { name: "Switch account" }).click();
  await login(page, "Admin");
  await page.getByRole("button", { name: "Reports", exact: true }).click();
  await expect(page.getByText("Rs. 250", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Users", exact: true }).click();
  const user = page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", { name: "Bilal 1", exact: true }),
    });
  await user.getByRole("button", { name: "Add Rs. 500 demo credit" }).click();
  await expect(user.getByText("Rs. 2,750", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page.getByRole("button", { name: "Reset all sample data" }).click();
  await expect(user.getByText("Rs. 2,500", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/demo-mobile.png",
    fullPage: true,
  });
});

test("wrong demo password is rejected without server access", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("admin@campusbite.pk");
  await page.getByLabel(/^Password/).fill("wrong-password");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(
    page.getByText(
      "Incorrect demo password. Choose an account above to fill its credentials.",
    ),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
