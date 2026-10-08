import { test, expect } from "@playwright/test";

const PLAY_URL = "https://play.google.com/store/apps/details?id=com.zikirmatik_asistan.app";

test("EN legal pages return 200 with lang=en and a populated h1 (WEB-06)", async ({ page }) => {
  for (const path of ["/en/terms", "/en/refund-policy"]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator("html"), path).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 }), path).not.toBeEmpty();
  }
});

test("TR footer links to delete-account, privacy and terms (WEB-09)", async ({ page }) => {
  await page.goto("/");
  for (const href of ["/delete-account", "/privacy", "/terms"]) {
    await expect(page.locator(`footer a[href='${href}']`), href).toHaveCount(1);
  }
});

test("halka codes with forbidden chars or wrong length 404 (WEB-12, WEB-13)", async ({ request }) => {
  for (const code of ["ABCDEFG0", "ABCDEFGI", "ABCDEFGO", "ABCDEFG1", "ABCDEFG", "ABCDEFGHJ"]) {
    const response = await request.get(`/halka/${code}`);
    expect(response.status(), code).toBe(404);
  }
});

test("halka invite links: open-app deep link and Play store (WEB-15, WEB-16)", async ({ page }) => {
  await page.goto("/halka/abcdefgh");
  await expect(page.locator("a[href='zikirmatik://circle/join?code=ABCDEFGH']")).toHaveCount(1);
  await expect(page.locator("main").locator(`a[href='${PLAY_URL}']`)).toHaveCount(1);
});

test("halka page has a self-canonical, not the inherited home one (B-58, WEB-17)", async ({ page, request }) => {
  const cases: [string, string][] = [
    ["/halka/abcdefgh", "/halka/ABCDEFGH"],
    ["/en/halka/abcdefgh", "/en/halka/ABCDEFGH"]
  ];
  for (const [path, canonical] of cases) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]'), path).toHaveAttribute("content", /noindex/);
    const hrefs = await page.locator('link[rel="canonical"]').evaluateAll((els) =>
      els.map((el) => new URL((el as HTMLLinkElement).href).pathname)
    );
    expect(hrefs, path).toEqual([canonical]);
  }
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("halka");
});

test("language switcher goes to the other locale of the same path (WEB-21)", async ({ page }) => {
  await page.goto("/privacy");
  await page.locator("footer").getByRole("button", { name: "EN" }).click();
  await expect(page).toHaveURL(/\/en\/privacy$/);
  await page.locator("footer").getByRole("button", { name: "TR" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page).not.toHaveURL(/\/en\//);
});

test("Accept-Language: en does not switch the root to English (WEB-22)", async ({ browser }) => {
  const context = await browser.newContext({ locale: "en-US", extraHTTPHeaders: { "Accept-Language": "en" } });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "tr");
  await context.close();
});

test("unknown path and unsupported locale 404 (WEB-23)", async ({ request }) => {
  for (const path of ["/xyz", "/de/privacy"]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});

test("premium table matches app limits and shows no price (WEB-24)", async ({ page }) => {
  await page.goto("/");
  const table = page.locator("#premium table");
  await expect(table).toContainText("1 aktif program, 3 zikir");
  await expect(table).toContainText("10 program");
  await expect(table).toContainText("1 aktif halka, 5 üye");
  await expect(table).toContainText("10 aktif halka, 200 üye");
  await expect(table).toContainText("8 tema");
  await expect(table).toContainText("22 tema");
  await expect(table).toContainText("Günde 1");
  await expect(table).toContainText("Ayda 50");
  expect(await page.locator("#premium").innerText()).not.toMatch(/[$€₺]|\d+[.,]\d{2}\s?(TL|USD)/);
});

test("og:locale and canonical per locale (WEB-25)", async ({ page }) => {
  const cases: [string, string, string][] = [
    ["/", "tr_TR", "/"],
    ["/en", "en_US", "/en"],
    ["/privacy", "tr_TR", "/privacy"],
    ["/en/privacy", "en_US", "/en/privacy"]
  ];
  for (const [path, ogLocale, canonical] of cases) {
    await page.goto(path);
    await expect(page.locator('meta[property="og:locale"]'), path).toHaveAttribute("content", ogLocale);
    const href = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(new URL(href ?? "").pathname, path).toBe(canonical);
  }
});
