import { test, expect } from "@playwright/test";

test("home page renders hero in Turkish at the root", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).not.toBeEmpty();
  await expect(page.locator("html")).toHaveAttribute("lang", "tr");
});

test("legacy /tr and /en prefixes redirect permanently to the root", async ({ request }) => {
  for (const path of ["/tr", "/en", "/tr/privacy", "/en/privacy", "/tr/halka/ABCD2345"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(308);
    const location = response.headers()["location"] ?? "";
    expect(location, path).toBe(path.replace(/^\/(tr|en)/, "") || "/");
  }
});

test("legal pages return 200 with a populated h1", async ({ page }) => {
  for (const path of ["/privacy", "/terms", "/refund-policy"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).not.toBeEmpty();
  }
});

test("halka invite page validates code and is noindex; invalid code 404s", async ({ page, request }) => {
  const response = await page.goto("/halka/abcdefgh");
  expect(response?.status()).toBe(200);
  await expect(page.getByText("ABCDEFGH")).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

  const invalid = await request.get("/halka/ABC!");
  expect(invalid.status()).toBe(404);
});

test("robots.txt and sitemap.xml are served", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
});
