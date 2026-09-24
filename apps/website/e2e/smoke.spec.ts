import { test, expect } from "@playwright/test";

const EN_HERO_TITLE = "A calm, focused companion for your daily dhikr";
const TR_HERO_TITLE = "Günlük zikirleriniz için sakin ve odaklı bir yardımcı";

test("home page (en) renders hero and html lang", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(EN_HERO_TITLE);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("tr home page renders hero and language switcher navigates en <-> tr", async ({ page }) => {
  await page.goto("/tr");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(TR_HERO_TITLE);
  await expect(page.locator("html")).toHaveAttribute("lang", "tr");

  const switcher = page.getByRole("contentinfo").getByRole("group");
  await switcher.getByRole("button", { name: "EN" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(EN_HERO_TITLE);

  await page
    .getByRole("contentinfo")
    .getByRole("group")
    .getByRole("button", { name: "TR" })
    .click();
  await expect(page).toHaveURL(/\/tr$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(TR_HERO_TITLE);
});

test("legal pages return 200 with a populated h1", async ({ page }) => {
  for (const path of ["/privacy", "/terms", "/refund-policy"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).not.toBeEmpty();
  }
});

test("halka invite page validates code and is noindex; invalid code 404s", async ({ page, request }) => {
  const response = await page.goto("/tr/halka/abcdefgh");
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
