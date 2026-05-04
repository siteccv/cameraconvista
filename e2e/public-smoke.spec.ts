import { expect, test } from "@playwright/test";

const publicRoutes = [
  { path: "/", title: /Camera con Vista/i },
  { path: "/menu", title: /Menu|Camera con Vista/i },
  { path: "/carta-vini", title: /Vini|Wine|Camera con Vista/i },
  { path: "/cocktail-bar", title: /Cocktail|Camera con Vista/i },
  { path: "/eventi", title: /Eventi|Events|Camera con Vista/i },
  { path: "/eventi-privati", title: /Eventi Privati|Private Events|Camera con Vista/i },
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

test("private events shows aperitivo and exclusive event without dinner card", async ({ page }) => {
  await page.goto("/eventi-privati", { waitUntil: "networkidle" });

  await expect(page.getByText("Aperitivo", { exact: true })).toBeVisible();
  await expect(page.getByText("Evento Privato Esclusivo.")).toBeVisible();
  await expect(page.getByText("Cena", { exact: true })).toHaveCount(0);
  await expect(page.locator('[data-testid^="card-package-"]')).toHaveCount(2);
});

test("private dinner direct route redirects to private events", async ({ page }) => {
  await page.goto("/eventi-privati/cena", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/eventi-privati$/);
});

test("email health endpoint is reachable", async ({ request }) => {
  const response = await request.get("/api/health/email");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual(
    expect.objectContaining({
      resendConfigured: expect.any(Boolean),
      recipientEmail: expect.any(String),
    }),
  );
});

test("admin login page is reachable without performing login", async ({ page }) => {
  const response = await page.goto("/admina/login", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(400);
  await expect(page.getByTestId("input-admin-password")).toBeVisible();
  await expect(page.getByTestId("button-admin-login")).toBeVisible();
});
