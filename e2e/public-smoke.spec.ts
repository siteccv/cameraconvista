import { expect, test } from "@playwright/test";

const publicRoutes = [
  { path: "/", title: /Camera con Vista/i },
  { path: "/menu", title: /Menu|Camera con Vista/i },
  { path: "/carta-vini", title: /Vini|Wine|Camera con Vista/i },
  { path: "/cocktail-bar", title: /Cocktail|Camera con Vista/i },
  { path: "/eventi", title: /Eventi|Events|Camera con Vista/i },
];

for (const route of publicRoutes) {
  test(`public route ${route.path} renders`, async ({ page }) => {
    const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(route.title);
  });
}

test("menu, wines and cocktails APIs respond with arrays", async ({ request }) => {
  for (const endpoint of ["/api/menu-items", "/api/wines", "/api/cocktails"]) {
    const response = await request.get(endpoint);
    expect(response.status(), endpoint).toBe(200);
    expect(await response.json(), endpoint).toEqual(expect.any(Array));
  }
});

test("admin login page is reachable without performing login", async ({ page }) => {
  const response = await page.goto("/admina/login", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(400);
  await expect(page.getByTestId("input-admin-password")).toBeVisible();
  await expect(page.getByTestId("button-admin-login")).toBeVisible();
});
