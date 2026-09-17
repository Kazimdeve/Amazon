import { expect, test, type Page } from '@playwright/test';

const CART_KEY = 'amazon-clone-cart';

async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function expectVisibleImagesHealthy(page: Page) {
  await expect.poll(async () => page.locator('img').evaluateAll((images) => (
    images
      .filter((image) => image.getBoundingClientRect().width > 0 && image.getBoundingClientRect().height > 0)
      .filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => ({
        fallbackStage: image.dataset.fallbackStage,
        src: image.getAttribute('src'),
      }))
  ))).toEqual([]);
}

test.describe('Task 17 adversarial functional QA', () => {
  test('survives the full search-to-delete shopping journey', async ({ page }) => {
    await page.goto('/');
    const search = page.getByRole('searchbox', { name: 'Search Amazon' });
    await search.fill('charger');
    await search.press('Enter');

    await expect(page).toHaveURL(/\/s\?k=charger/);
    const results = page.locator('[data-search-result]');
    await expect(results.first()).toBeVisible();
    expect(await results.count()).toBeGreaterThan(0);

    const filters = page.getByRole('complementary', { name: 'Search filters' });
    await filters.getByRole('link', { name: /Electronics \(/ }).click();
    await expect(page).toHaveURL(/category=electronics/);
    await page.getByLabel('Sort results').selectOption('price-desc');
    await expect(page).toHaveURL(/sort=price-desc/);

    await page.getByRole('link', { name: /NovaLink 65W/i }).first().click();
    await expect(page).toHaveURL(/\/dp\/B0CH4R65PD$/);
    await page.getByRole('radio', { name: /With 6 ft USB-C cable/i }).click();

    const buyBox = page.getByRole('complementary', { name: 'Purchase options' });
    await buyBox.getByRole('combobox', { name: 'Quantity:' }).selectOption('2');
    await buyBox.getByRole('button', { name: 'Add to Cart' }).click();
    await buyBox.getByRole('button', { name: 'Add to Cart' }).click();
    await expect(page.getByRole('link', { name: 'Cart, 4 items' })).toBeVisible();

    await page.getByRole('link', { name: 'Cart, 4 items' }).click();
    const row = page.locator('[data-cart-row]');
    await expect(row).toHaveCount(1);
    await row.getByRole('combobox', { name: /Quantity for NovaLink/i }).selectOption('3');
    await expect(page.getByRole('link', { name: 'Cart, 3 items' })).toBeVisible();

    await page.reload();
    await expect(row).toHaveCount(1);
    await expect(row.getByRole('combobox', { name: /Quantity for NovaLink/i })).toHaveValue('3');
    await row.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByRole('heading', { name: 'Your Amazon Cart is empty' })).toBeVisible();
  });

  test('handles corrupted storage, empty search, direct URLs, and invalid destinations', async ({ page }) => {
    await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [CART_KEY, '{broken-json']);
    await page.goto('/gp/cart/view.html');
    await expect(page.getByRole('heading', { name: 'Your Amazon Cart is empty' })).toBeVisible();
    await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), CART_KEY))
      .toBe('{"lines":[]}');

    await page.goto('/');
    const before = page.url();
    await page.getByRole('searchbox', { name: 'Search Amazon' }).fill('   ');
    await page.getByRole('searchbox', { name: 'Search Amazon' }).press('Enter');
    await expect(page).toHaveURL(before);

    await page.goto('/s?k=moon-powered+typewriter');
    await expect(page.getByRole('heading', { name: /No results for/i })).toBeVisible();
    await page.goto('/dp/not-a-real-product');
    await expect(page.getByRole('heading', { name: 'Product not found' })).toBeVisible();
    await page.goto('/not-a-real-route');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  });

  test('replaces failed product and merchandising images instead of showing broken assets', async ({ page }) => {
    await page.route('https://images.unsplash.com/**', (route) => route.abort('failed'));
    await page.route('**/products/**', (route) => route.abort('failed'));

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Everyday upgrades, delivered' })).toBeVisible();
    await expectVisibleImagesHealthy(page);

    await page.goto('/s?k=electronics');
    await expect(page.locator('[data-search-result]').first()).toBeVisible();
    await expectVisibleImagesHealthy(page);

    await page.goto('/dp/B0QW7A2N9K');
    await expect(page.locator('[data-product-gallery]')).toBeVisible();
    await expectVisibleImagesHealthy(page);

    await page.getByRole('button', { name: 'Add to Cart' }).click();
    await page.getByRole('link', { name: 'Cart, 1 item' }).click();
    await expect(page.locator('[data-cart-row]')).toHaveCount(1);
    await expectVisibleImagesHealthy(page);

    await page.getByRole('link', { name: 'Proceed to checkout' }).click();
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
    await expectVisibleImagesHealthy(page);
  });

  test('remains usable while resizing across mobile, tablet, and desktop navigation', async ({ page }) => {
    await page.goto('/');

    for (const width of [320, 768, 1440, 390, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      await expectNoHorizontalOverflow(page);
      await expect(page.getByRole('searchbox', { name: 'Search Amazon' })).toBeVisible();

      if (width < 900) {
        await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeVisible();
      } else {
        await expect(page.getByRole('combobox', { name: 'Search department' })).toBeVisible();
      }
    }
  });

  test('emits no runtime or console errors and stays responsive on core routes', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    const failedAppResponses: string[] = [];

    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('response', (response) => {
      const url = new URL(response.url());
      if (url.origin === 'http://127.0.0.1:4173' && response.status() >= 400) {
        failedAppResponses.push(`${response.status()} ${url.pathname}`);
      }
    });

    for (const [path, heading] of [
      ['/', 'Home'],
      ['/s?k=headphones', 'Search results'],
      ['/dp/B0QW7A2N9K', 'AeroSound QuietWave Pro Wireless Over-Ear Headphones with Adaptive Noise Cancelling, 45-Hour Battery and Multipoint Bluetooth'],
      ['/gp/cart/view.html', 'Shopping Cart'],
    ] as const) {
      const started = Date.now();
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      expect(Date.now() - started).toBeLessThan(5000);
    }

    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/s');
    const longTitle = page.locator('[data-search-result] h2').first();
    await expect(longTitle).toBeVisible();
    await expectNoHorizontalOverflow(page);

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(failedAppResponses).toEqual([]);
  });
});
