import { expect, test, type Page } from '@playwright/test';

const cartLines = [
  { productId: 'B0QW7A2N9K', variantId: 'black', quantity: 2 },
  { productId: 'B0CH4R65PD', variantId: 'with-cable', quantity: 1 },
];

async function seedCart(page: Page, lines = cartLines) {
  await page.goto('/');
  await page.evaluate((nextLines) => {
    localStorage.setItem('amazon-clone-cart', JSON.stringify({ lines: nextLines }));
  }, lines);
}

test.describe('Demo checkout and order confirmation', () => {
  test('recomposes payment UI without clipping at every required width', async ({ page }, testInfo) => {
    const widths = [320, 360, 375, 390, 430, 480, 768, 820, 1024, 1280, 1440, 1920];

    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await seedCart(page);
      await page.goto('/checkout/payment');
      await page.getByRole('radio', { name: /^Card/ }).check();

      await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
      await expect(page.getByLabel('Card number')).toBeVisible();
      await expect(page.getByRole('complementary', { name: 'Order Summary' })).toBeVisible();

      const metrics = await page.evaluate(() => {
        const controls = Array.from(document.querySelectorAll<HTMLElement>('main input, main button, main a'))
          .filter((element) => element.offsetParent !== null)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return { left: rect.left, right: rect.right, width: rect.width, height: rect.height };
          });
        return {
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
          controlsFit: controls.every((rect) => (
            rect.left >= -0.5 && rect.right <= window.innerWidth + 0.5 && rect.width > 0 && rect.height > 0
          )),
          cardInputWidth: document.querySelector<HTMLInputElement>('#card-number')!.getBoundingClientRect().width,
        };
      });

      expect(metrics.documentWidth).toBeLessThanOrEqual(width);
      expect(metrics.bodyWidth).toBeLessThanOrEqual(width);
      expect(metrics.controlsFit).toBe(true);
      expect(metrics.cardInputWidth).toBeGreaterThan(120);

      if ([320, 768, 1440].includes(width)) {
        await page.screenshot({
          path: testInfo.outputPath(`checkout-card-${width}.png`),
          fullPage: true,
        });
      }
    }

    await page.getByRole('radio', { name: /Cash on Arrival/ }).check();
    await page.getByRole('button', { name: 'Place your order' }).click();
    await expect(page).toHaveURL(/\/order\/success$/);

    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/order/success');
      await expect(page.getByRole('heading', { name: /demo order is confirmed/i })).toBeVisible();

      const successMetrics = await page.evaluate(() => {
        const main = document.querySelector('main')!;
        const controls = Array.from(main.querySelectorAll<HTMLElement>('a, button')).map((element) => {
          const rect = element.getBoundingClientRect();
          return { left: rect.left, right: rect.right, height: rect.height };
        });
        const actionHeights = Array.from(main.querySelectorAll<HTMLAnchorElement>('a[href="/s"], a[href="/"]'))
          .map((element) => element.getBoundingClientRect().height);
        return {
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
          controlsFit: controls.every((rect) => (
            rect.left >= -0.5 && rect.right <= window.innerWidth + 0.5 && rect.height > 0
          )),
          actionHeights,
        };
      });

      expect(successMetrics.documentWidth).toBeLessThanOrEqual(width);
      expect(successMetrics.bodyWidth).toBeLessThanOrEqual(width);
      expect(successMetrics.controlsFit).toBe(true);
      expect(successMetrics.actionHeights.every((height) => height >= 44)).toBe(true);

      if ([320, 768, 1440].includes(width)) {
        await page.screenshot({
          path: testInfo.outputPath(`order-success-${width}.png`),
          fullPage: true,
        });
      }
    }
  });

  test('navigates from cart, declines deterministically, then completes and survives refresh', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedCart(page, [{ productId: 'B0QW7A2N9K', variantId: 'black', quantity: 1 }]);
    await page.goto('/gp/cart/view.html');
    await page.getByRole('link', { name: 'Proceed to checkout' }).click();
    await expect(page).toHaveURL(/\/checkout\/payment$/);

    await page.getByRole('radio', { name: /^Card/ }).check();
    await page.getByLabel('Cardholder name').fill('Demo Shopper');
    await page.getByLabel('Card number').fill('4000000000000002');
    await page.getByLabel('Expiry').fill('1299');
    await page.getByLabel('CVV').fill('123');
    await page.getByRole('button', { name: 'Place your order' }).click();
    await expect(page.getByRole('alert')).toContainText('Payment was declined');
    await expect(page.getByRole('link', { name: 'Cart, 1 item' })).toBeVisible();

    await page.getByLabel('Card number').fill('4242424242424242');
    await page.getByRole('button', { name: 'Place your order' }).click();
    await expect(page).toHaveURL(/\/order\/success$/);
    await expect(page.getByRole('heading', { name: /demo order is confirmed/i })).toBeVisible();
    await expect(page.getByText(/ORDER-[A-Z0-9]{8}/)).toBeVisible();
    await expect(page.getByText('Demo card ending in 4242')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Cart, 0 items' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: /demo order is confirmed/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Continue Shopping' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to Home' })).toBeVisible();

    const stored = await page.evaluate(() => ({
      cart: localStorage.getItem('amazon-clone-cart'),
      order: sessionStorage.getItem('amazon-clone-completed-order'),
    }));
    expect(stored.cart).toBe('{"lines":[]}');
    expect(stored.order).not.toContain('4242424242424242');
    expect(stored.order).not.toContain('Demo Shopper');
  });
});
