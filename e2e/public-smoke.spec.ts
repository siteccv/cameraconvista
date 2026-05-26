import { expect, test } from "@playwright/test";

async function skipColliIntro(page: { addInitScript: (script: () => void) => Promise<void> }) {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("ccv_colli_intro_seen", "1");
  });
}

const publicRoutes = [
  { path: "/", title: /Camera con Vista/i },
  { path: "/menu", title: /Menu|Camera con Vista/i },
  { path: "/carta-vini", title: /Vini|Wine|Camera con Vista/i },
  { path: "/cocktail-bar", title: /Cocktail|Camera con Vista/i },
  { path: "/eventi", title: /Eventi|Events|Camera con Vista/i },
  { path: "/eventi-privati", title: /Eventi Privati|Private Events|Camera con Vista/i },
  { path: "/colli", title: /Colli|Camera con Vista/i },
  { path: "/colli/menu", title: /Menu Colli|Colli Menu|Camera con Vista/i },
];

for (const route of publicRoutes) {
  test(`public route ${route.path} renders`, async ({ page }) => {
    if (route.path === "/colli/menu") {
      await skipColliIntro(page);
    }
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

test("colli menu API exposes the digital menu snapshot", async ({ request }) => {
  const response = await request.get("/api/colli/menu");
  expect(response.status()).toBe(200);

  const menu = await response.json();
  expect(menu.metadata.sections.map((section: { nameIt: string }) => section.nameIt)).toEqual([
    "Food",
    "Drinks",
    "Vini",
  ]);
  expect(menu.sections.length).toBeGreaterThanOrEqual(3);
  expect(menu.categories.length).toBeGreaterThan(0);
  expect(menu.dishes.length).toBeGreaterThan(0);
  expect(menu.wineCategories.length).toBeGreaterThan(0);
  expect(menu.wines.length).toBeGreaterThan(0);
});

test("colli menu exposes dedicated install icon metadata", async ({ page, request }) => {
  await skipColliIntro(page);
  await page.goto("/colli/menu", { waitUntil: "domcontentloaded" });

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest-colli.json",
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    "/colli-home-180.png",
  );
  await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute(
    "content",
    "CCV Colli",
  );

  const manifestResponse = await request.get("/manifest-colli.json");
  expect(manifestResponse.status()).toBe(200);
  const manifest = await manifestResponse.json();
  expect(manifest.start_url).toBe("/colli/menu");
  expect(manifest.icons.map((icon: { src: string }) => icon.src)).toEqual([
    "/colli-home-192.png",
    "/colli-home-512.png",
  ]);
});

test("colli booking settings API exposes the WhatsApp phone", async ({ request }) => {
  const response = await request.get("/api/colli-booking-settings");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ phoneNumber: "+393335345751" });
});

test("colli showcase links to the digital menu", async ({ page }) => {
  await page.goto("/colli", { waitUntil: "networkidle" });

  await expect(page.locator('img[alt="Camera con Vista Colli"]:visible').first()).toBeVisible();
  await expect(page.getByTestId("colli-hero-image")).toBeVisible();
  await expect(page.getByTestId("colli-gallery-image-1")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Colli", exact: true })).toHaveCount(0);
  await expect(page.getByTestId("colli-address")).toContainText("Via Cavaioni 1, 40136, Bologna");
  await expect(page.getByTestId("colli-address")).toContainText("presso Ca' Shin");
  await expect(page.getByTestId("colli-instagram-link")).toHaveAttribute(
    "href",
    "https://www.instagram.com/cameraconvistacolli/",
  );
  await expect(page.locator("footer").getByText("Via Cavaioni 1")).toHaveCount(0);

  const bottomAlignment = await page.evaluate(() => {
    const hero = document.querySelector('[data-testid="colli-hero-image"]');
    const location = document.querySelector('[data-testid="colli-location-group"]');
    if (!hero || !location) return null;
    return Math.abs(hero.getBoundingClientRect().bottom - location.getBoundingClientRect().bottom);
  });
  expect(bottomAlignment).not.toBeNull();
  expect(bottomAlignment ?? 999).toBeLessThanOrEqual(2);

  await page.getByTestId("colli-address").click();
  await expect(page.getByTestId("button-colli-apple-maps")).toBeVisible();
  await expect(page.getByTestId("button-colli-google-maps")).toBeVisible();
  await page.getByRole("button", { name: /Chiudi|Close/i }).click();

  const menuLink = page.getByTestId("colli-menu-cta");
  await expect(menuLink).toHaveText(/Scopri il menu|Discover the menu/i);
  await expect(page.getByTestId("colli-booking-cta")).toHaveAttribute(
    "href",
    /https:\/\/wa\.me\/393335345751/,
  );
  await menuLink.click();
  await expect(page).toHaveURL(/\/colli\/menu$/);
});

test("colli showcase keeps the primary content in the first mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/colli", { waitUntil: "networkidle" });

  await expect(page.getByTestId("colli-hero-image")).toBeVisible();
  await expect(page.locator('img[alt="Camera con Vista Colli"]:visible').first()).toBeVisible();
  await expect(page.getByTestId("colli-menu-cta")).toBeVisible();
  await expect(page.getByTestId("colli-booking-cta")).toBeVisible();
  await expect(page.getByTestId("colli-address")).toBeVisible();
  await expect(page.getByTestId("colli-instagram-link")).toBeVisible();

  const layout = await page.evaluate(() => {
    const hero = document.querySelector('[data-testid="colli-hero-image"]');
    const logo = document.querySelector('[data-testid="colli-mobile-logo"]');
    const cta = document.querySelector('[data-testid="colli-menu-cta"]');
    const booking = document.querySelector('[data-testid="colli-booking-cta"]');
    const address = document.querySelector('[data-testid="colli-address"]');
    const instagram = document.querySelector('[data-testid="colli-instagram-link"]');
    const rect = (el: Element | null) => {
      if (!el) return null;
      const box = el.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom, left: box.left, right: box.right };
    };

    return {
      viewportHeight: window.innerHeight,
      viewportCenter: window.innerWidth / 2,
      scrollWidth: document.documentElement.scrollWidth,
      hero: rect(hero),
      logo: rect(logo),
      cta: rect(cta),
      booking: rect(booking),
      address: rect(address),
      instagram: rect(instagram),
    };
  });

  expect(layout.scrollWidth).toBeLessThanOrEqual(390);
  expect(layout.hero?.top).toBeGreaterThanOrEqual(0);
  expect(layout.logo?.bottom).toBeLessThanOrEqual(layout.hero?.top ?? 0);
  expect(layout.cta?.bottom).toBeLessThan(layout.viewportHeight);
  expect(layout.booking?.bottom).toBeLessThan(layout.viewportHeight);
  expect(layout.address?.bottom).toBeLessThan(layout.viewportHeight);
  expect(layout.instagram?.bottom).toBeLessThan(layout.viewportHeight);
  expect(layout.instagram?.top).toBeGreaterThanOrEqual(layout.address?.bottom ?? 0);
  const centerOf = (box: { left: number; right: number } | null | undefined) =>
    box ? (box.left + box.right) / 2 : 0;
  const buttonsCenter =
    layout.cta && layout.booking ? (layout.cta.left + layout.booking.right) / 2 : 0;
  expect(Math.abs(centerOf(layout.logo) - layout.viewportCenter)).toBeLessThan(16);
  expect(Math.abs(buttonsCenter - layout.viewportCenter)).toBeLessThan(16);
  expect(Math.abs(centerOf(layout.instagram) - layout.viewportCenter)).toBeLessThan(16);
  expect(Math.abs(centerOf(layout.address) - layout.viewportCenter)).toBeLessThan(16);
});

test("colli menu route opens the digital menu on mobile", async ({ page }) => {
  await skipColliIntro(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/colli/menu", { waitUntil: "networkidle" });

  await expect(page.getByAltText("Camera con Vista Colli")).toBeVisible();
  await expect(page.getByRole("button", { name: "Food" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Drinks" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Vini" })).toBeVisible();

  await page.getByRole("button", { name: "Food" }).click();
  await expect(page.getByRole("heading", { name: /Focacce/i })).toBeVisible();
});

test("colli menu uses filled vegetarian markers before dish names and bold prices", async ({
  page,
}) => {
  await skipColliIntro(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/colli/menu", { waitUntil: "networkidle" });

  await page.getByRole("button", { name: "Food" }).click();
  const dishName = page.getByText("Margherita", { exact: true }).first();
  await expect(dishName).toBeVisible();

  const dishLabel = dishName.locator("xpath=parent::*");
  const childTags = await dishLabel.evaluate((element) =>
    Array.from(element.children).map((child) => child.tagName.toLowerCase()),
  );

  expect(childTags[0]).toBe("svg");
  expect(childTags[childTags.length - 1]).toBe("span");
  await expect(dishLabel.locator("svg").first()).toHaveAttribute("viewBox", "0 0 512 512");
  await expect(dishLabel.locator("svg path").first()).toHaveAttribute("d", /^m150\.38 253\.68/);
  await expect(page.getByText("€ 5", { exact: true }).first()).toHaveCSS("font-weight", "700");
});

test("colli menu shows vegetarian before gluten-free markers when both are enabled", async ({
  page,
}) => {
  await skipColliIntro(page);
  await page.route("**/api/colli/menu", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sections: [{ id: "1", name_it: "Food", name_en: "Food", order: 0, type: "food" }],
        categories: [
          { id: "10", section_id: "1", name_it: "Focacce", name_en: "Focacce", order: 0 },
        ],
        dishes: [
          {
            id: "100",
            category_id: "10",
            name_it: "Piatto test",
            name_en: "Test dish",
            price: 9,
            vegetarian: true,
            gluten_free: true,
            allergens: [],
            order: 0,
          },
        ],
        wineCategories: [],
        wines: [],
        allergens: [{ id: "1", name_it: "Glutine", name_en: "Gluten" }],
        metadata: { englishEnabled: true },
      }),
    });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/colli/menu", { waitUntil: "networkidle" });

  await page.getByRole("button", { name: "Food" }).click();
  const dishName = page.getByText("Piatto test", { exact: true });
  await expect(dishName).toBeVisible();

  const dishLabel = dishName.locator("xpath=parent::*");
  const childTags = await dishLabel.evaluate((element) =>
    Array.from(element.children).map((child) => child.tagName.toLowerCase()),
  );

  expect(childTags.slice(0, 3)).toEqual(["svg", "svg", "span"]);
  await expect(dishLabel.locator("svg").first()).toHaveAttribute("viewBox", "0 0 512 512");
  await expect(dishLabel.locator("svg").nth(1)).toHaveAttribute("viewBox", "0 0 24 24");
});

test("colli menu exposes the dedicated admin gear", async ({ page }) => {
  await skipColliIntro(page);
  await page.goto("/colli/menu", { waitUntil: "networkidle" });

  await page.getByRole("button", { name: /Apri navigazione Colli/i }).click();
  const gear = page.getByTestId("button-colli-admin-gear");
  await expect(gear).toBeVisible();

  await gear.click();
  await expect(page).toHaveURL(/\/colli\/admina$/);
  await expect(page.getByTestId("input-colli-admin-password")).toBeVisible();
});

test("colli menu hides language buttons when English is disabled", async ({ page }) => {
  await skipColliIntro(page);
  await page.route("**/api/colli/menu", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sections: [
          { id: "1", name_it: "Food", name_en: "Food", order: 0, type: "food" },
          { id: "2", name_it: "Drinks", name_en: "Drinks", order: 1, type: "drinks" },
          { id: "3", name_it: "Vini", name_en: "Wines", order: 2, type: "wine" },
        ],
        categories: [],
        dishes: [],
        wineCategories: [],
        wines: [],
        allergens: [],
        metadata: { englishEnabled: false },
      }),
    });
  });

  await page.goto("/colli/menu", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Apri navigazione Colli/i }).click();

  await expect(page.getByRole("button", { name: "Italiano" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "English" })).toHaveCount(0);
  await expect(page.getByTestId("button-colli-admin-gear")).toBeVisible();
});

test("legacy colli admin route redirects to canonical admina path", async ({ page }) => {
  await page.goto("/colli/admin", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/colli\/admina$/);

  await page.goto("/colli/admin/login", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/colli\/admina$/);

  await page.goto("/colli/admina/login", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/colli\/admina$/);
});

test("colli admin panel loads the dedicated Supabase records", async ({ page }) => {
  await page.goto("/colli/admina", { waitUntil: "domcontentloaded" });
  await page.getByTestId("input-colli-admin-password").fill("1909");
  await page.getByTestId("button-colli-admin-login").click();

  await expect(page).toHaveURL(/\/colli\/admina\/panel$/);
  await expect(page.getByRole("button", { name: "Food" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Drinks" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Vini" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Food" })).toBeVisible();
  await expect(page.getByText("Le nostre Focacce")).toBeVisible();

  await page.getByRole("button", { name: "Gestisci allergeni" }).click();
  await expect(page.getByText("14 allergeni EU precaricati")).toBeVisible();
});

test("colli admin login uses a browser-session cookie", async ({ request }) => {
  const response = await request.post("/api/colli/admin/login", {
    data: { password: "1909" },
  });
  expect(response.status()).toBe(200);

  const sessionCookie = response
    .headersArray()
    .find((header) => header.name.toLowerCase() === "set-cookie")?.value;

  expect(sessionCookie).toContain("ccv_colli_admin_session=");
  expect(sessionCookie).not.toMatch(/max-age=/i);
  expect(sessionCookie).not.toMatch(/expires=/i);
});

test("main navigation exposes the optimized Colli icon", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const colliNav = page.getByTestId("nav-colli");
  await expect(colliNav).toBeVisible();
  const colliIcon = colliNav.getByRole("img", { name: "Colli" });
  await expect(colliIcon).toBeVisible();
  const naturalWidth = await colliIcon.evaluate((img) => (img as HTMLImageElement).naturalWidth);
  expect(naturalWidth).toBeLessThanOrEqual(240);

  await colliNav.click();
  await expect(page).toHaveURL(/\/colli$/);
});

test("private events shows aperitivo and exclusive event without dinner card", async ({ page }) => {
  await page.goto("/eventi-privati", { waitUntil: "domcontentloaded" });

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
