import { expect, test } from '@playwright/test';

test.describe('route foundation', () => {
  test('supports the primary shopping routes', async ({ page }) => {
    const routes = [
      ['/', 'Home'],
      ['/s?k=headphones', 'Search results'],
      ['/dp/B0QW7A2N9K', 'AeroSound QuietWave Pro Wireless Over-Ear Headphones with Adaptive Noise Cancelling, 45-Hour Battery and Multipoint Bluetooth'],
      ['/gp/cart/view.html', 'Shopping Cart'],
    ] as const;

    for (const [path, heading] of routes) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    }
  });

  test('redirects /cart to the canonical Amazon-style path', async ({ page }) => {
    await page.goto('/cart');

    await expect(page).toHaveURL(/\/gp\/cart\/view\.html$/);
    await expect(page.getByRole('heading', { name: 'Shopping Cart' })).toBeVisible();
  });

  test('renders a catch-all route', async ({ page }) => {
    await page.goto('/not-a-real-route');

    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  });

  test('every secondary navigation collection has results and working product links', async ({
    page,
  }) => {
    test.setTimeout(120000);
    const secondaryLinks = [
      'Medical Care',
      'Amazon Basics',
      'Best Sellers',
      "Today's Deals",
      'New Releases',
      'Prime',
      'Books',
      'Registry',
      'Gift Cards',
      'Groceries',
      'Smart Home',
      'Customer Service',
    ];

    await page.setViewportSize({ width: 1440, height: 900 });

    for (const label of secondaryLinks) {
      await page.goto('/');
      const collectionLink = page
        .locator('nav[aria-label="Primary departments"] a')
        .filter({ hasText: label })
        .first();
      await expect(collectionLink).toBeVisible();
      await collectionLink.click();

      await expect(page).toHaveURL(/\/s\?k=/);
      const results = page.locator('[data-search-result]');
      await expect(results.first()).toBeVisible();
      expect(await results.count(), label).toBeGreaterThan(0);

      await results.first().getByRole('link').first().click();
      await expect(page).toHaveURL(/\/dp\/[A-Z0-9]+$/);
      await expect(page.locator('[data-product-layout]')).toBeVisible();
    }
  });
});

test.describe('Amazon product detail page', () => {
  test('uses a dense three-column desktop structure with a bordered buy box', async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dp/B0QW7A2N9K');

    const layout = page.locator('[data-product-layout]');
    const gallery = page.locator('[data-product-gallery]');
    const summary = page.locator('[data-product-summary]');
    const buyBox = page.locator('[data-buy-box]');

    await expect(
      page.getByRole('heading', { name: /AeroSound QuietWave Pro Wireless/i }),
    ).toBeVisible();
    await expect(gallery).toBeVisible();
    await expect(summary).toBeVisible();
    await expect(buyBox).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Product information' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'About this item' })).toBeVisible();

    const structure = await layout.evaluate((element) => {
      const style = getComputedStyle(element);
      const galleryRect = element.querySelector('[data-product-gallery]')!.getBoundingClientRect();
      const summaryRect = element.querySelector('[data-product-summary]')!.getBoundingClientRect();
      const buyBoxElement = element.querySelector('[data-buy-box]')!;
      const buyBoxRect = buyBoxElement.getBoundingClientRect();
      return {
        display: style.display,
        columns: style.gridTemplateColumns.split(' ').length,
        galleryLeft: galleryRect.left,
        summaryLeft: summaryRect.left,
        buyBoxLeft: buyBoxRect.left,
        buyBoxBorder: Number.parseFloat(getComputedStyle(buyBoxElement).borderLeftWidth),
      };
    });

    expect(structure.display).toBe('grid');
    expect(structure.columns).toBe(3);
    expect(structure.galleryLeft).toBeLessThan(structure.summaryLeft);
    expect(structure.summaryLeft).toBeLessThan(structure.buyBoxLeft);
    expect(structure.buyBoxBorder).toBeGreaterThan(0);

    await page.screenshot({
      path: testInfo.outputPath('product-detail-desktop-1440.png'),
      fullPage: true,
    });
  });

  test('keeps the product structure usable across target widths', async ({ page }, testInfo) => {
    for (const width of [320, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/dp/B0LM27QHD8');

      await expect(page.locator('[data-product-gallery]')).toBeVisible();
      await expect(page.locator('[data-product-summary]')).toBeVisible();
      await expect(page.locator('[data-buy-box]')).toBeVisible();

      const viewport = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth + 1);

      const display = await page.locator('[data-product-layout]').evaluate((element) => (
        getComputedStyle(element).display
      ));
      expect(display).toBe(width <= 700 ? 'flex' : 'grid');

      if (width === 320 || width === 768) {
        await page.screenshot({
          path: testInfo.outputPath(`product-detail-responsive-${width}.png`),
          fullPage: true,
        });
      }
    }
  });

  test('updates priced variants and handles an invalid product ID', async ({ page }) => {
    await page.goto('/dp/B0CH4R65PD');
    const buyBox = page.locator('[data-buy-box]');
    await expect(buyBox.getByLabel('$34.99')).toBeVisible();

    await page.getByRole('radio', { name: /With 6 ft USB-C cable/i }).click();
    await expect(buyBox.getByLabel('$42.99')).toBeVisible();

    await page.goto('/dp/not-a-real-product');
    await expect(page.getByRole('heading', { name: 'Product not found' })).toBeVisible();
    await expect(page.getByText('not-a-real-product')).toBeVisible();
  });

  test('adds matching lines to the local cart and updates the header count', async ({ page }) => {
    await page.goto('/dp/B0QW7A2N9K');
    const buyBox = page.locator('[data-buy-box]');

    await buyBox.getByRole('combobox', { name: 'Quantity:' }).selectOption('2');
    await buyBox.getByRole('button', { name: 'Add to Cart' }).click();

    await expect(page.getByRole('link', { name: 'Cart, 2 items' })).toBeVisible();
    await expect(buyBox.getByRole('status')).toContainText('2 items in cart');

    await buyBox.getByRole('button', { name: 'Add to Cart' }).click();
    await expect(page.getByRole('link', { name: 'Cart, 4 items' })).toBeVisible();
    await expect(buyBox.getByRole('status')).toContainText('4 items in cart');
  });
});

test.describe('Amazon cart', () => {
  test('renders the empty state through the cart alias', async ({ page }) => {
    await page.goto('/cart');

    await expect(page).toHaveURL(/\/gp\/cart\/view\.html$/);
    await expect(page.getByRole('heading', { name: 'Shopping Cart' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your Amazon Cart is empty' })).toBeVisible();
  });

  test('persists variants and updates quantities, totals, and deletion', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dp/B0CH4R65PD');
    const buyBox = page.locator('[data-buy-box]');

    await buyBox.getByRole('button', { name: 'Add to Cart' }).click();
    await page.getByRole('radio', { name: /With 6 ft USB-C cable/i }).click();
    await buyBox.getByRole('button', { name: 'Add to Cart' }).click();
    await page.getByRole('link', { name: 'Cart, 2 items' }).click();

    await expect(page.locator('[data-cart-row]')).toHaveCount(2);
    await expect(page.getByRole('complementary', { name: 'Cart subtotal' })).toContainText('$77.98');

    await page.reload();
    await expect(page.locator('[data-cart-row]')).toHaveCount(2);
    await expect(page.getByRole('link', { name: 'Cart, 2 items' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('cart-desktop-1440.png'), fullPage: true });

    await page.getByRole('combobox', { name: /Quantity for NovaLink/i }).first().selectOption('2');
    await expect(page.getByRole('link', { name: 'Cart, 3 items' })).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Cart subtotal' })).toContainText('$112.97');

    await page.locator('[data-cart-row]').nth(1).getByRole('button', { name: 'Delete' }).click();
    await expect(page.locator('[data-cart-row]')).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Cart, 2 items' })).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Cart subtotal' })).toContainText('$69.98');

    await page.setViewportSize({ width: 320, height: 900 });
    const viewport = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth + 1);
    await page.screenshot({ path: testInfo.outputPath('cart-mobile-320.png'), fullPage: true });
  });
});

test.describe('desktop header', () => {
  test('submits and retains the search query', async ({ page }) => {
    await page.goto('/');

    const searchInput = page.getByRole('searchbox', { name: 'Search Amazon' });
    await searchInput.fill('wireless headphones');
    await searchInput.press('Enter');

    await expect(page).toHaveURL(/\/s\?k=wireless\+headphones$/);
    await expect(searchInput).toHaveValue('wireless headphones');
  });

  test('fits the requested desktop widths without horizontal overflow', async ({ page }, testInfo) => {
    for (const width of [1024, 1280, 1366, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');

      const metrics = await page.evaluate(() => {
        const header = document.querySelector('header');
        const search = document.querySelector('[role="search"]');
        const headerRect = header?.getBoundingClientRect();
        const searchRect = search?.getBoundingClientRect();

        return {
          viewportWidth: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          headerHeight: headerRect?.height ?? 0,
          headerLeft: headerRect?.left ?? -1,
          headerRight: headerRect?.right ?? -1,
          searchWidth: searchRect?.width ?? 0,
        };
      });

      expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth);
      expect(metrics.headerHeight).toBe(99);
      expect(metrics.headerLeft).toBe(0);
      expect(metrics.headerRight).toBe(width);
      expect(metrics.searchWidth).toBeGreaterThan(250);

      await page.screenshot({
        path: testInfo.outputPath(`desktop-header-${width}.png`),
        clip: { x: 0, y: 0, width, height: 140 },
      });
    }
  });

  test('keeps the selected department label readable without crowding search', async ({ page }) => {
    for (const width of [600, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/s?k=beauty&category=beauty-personal-care');

      const department = page.getByRole('combobox', { name: 'Search department' });
      const label = page.locator('[data-department-label]');
      await expect(department).toHaveValue('beauty-personal-care');
      await expect(label).toHaveText('Beauty & Personal Care');

      const metrics = await page.evaluate(() => {
        const visibleLabel = document.querySelector<HTMLElement>('[data-department-label]')!;
        const searchInput = document.querySelector<HTMLInputElement>('#global-search-input')!;
        return {
          documentWidth: document.documentElement.scrollWidth,
          labelClientWidth: visibleLabel.clientWidth,
          labelScrollWidth: visibleLabel.scrollWidth,
          inputWidth: searchInput.getBoundingClientRect().width,
        };
      });

      expect(metrics.documentWidth).toBeLessThanOrEqual(width);
      expect(metrics.labelScrollWidth).toBeLessThanOrEqual(metrics.labelClientWidth);
      expect(metrics.inputWidth).toBeGreaterThan(100);
    }
  });
});

test.describe('responsive Amazon header', () => {
  test('uses the mobile composition and remains robust at every requested width', async ({ page }, testInfo) => {
    for (const width of [320, 360, 375, 390, 430, 480, 768, 820]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');

      const header = page.getByRole('banner');
      const menu = page.getByRole('button', { name: 'Open navigation menu' });
      const logo = header.getByRole('link', { name: 'Amazon Clone home' });
      const account = page.getByRole('button', { name: /sign in/i });
      const cart = page.getByRole('link', { name: /cart/i });
      const search = page.getByRole('search');
      const location = page.getByRole('button', { name: /deliver to pakistan/i });
      const nav = page.getByRole('navigation', { name: 'Primary departments' });

      await expect(menu).toBeVisible();
      await expect(logo).toBeVisible();
      await expect(account).toBeVisible();
      await expect(cart).toBeVisible();
      await expect(search).toBeVisible();
      await expect(location).toBeVisible();
      await expect(nav).toBeVisible();
      await expect(cart.getByText('0', { exact: true })).toBeVisible();

      const metrics = await page.evaluate(() => {
        const rect = (selector: string) => document.querySelector(selector)?.getBoundingClientRect();
        const menuRect = rect('[aria-label="Open navigation menu"]');
        const logoRect = rect('[aria-label="Amazon Clone home"]');
        const accountRect = rect('header button[class*="account"]');
        const cartRect = rect('header a[class*="cart"]');
        const searchRect = rect('[role="search"]');
        const searchButtonRect = rect('[aria-label="Search"]');
        const locationRect = rect('header button[class*="location"]');
        const navRect = rect('nav[aria-label="Primary departments"]');
        const firstCategoryRect = document
          .querySelector('nav[aria-label="Primary departments"] a')
          ?.getBoundingClientRect();

        return {
          viewportWidth: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
          menu: menuRect && { left: menuRect.left, top: menuRect.top, right: menuRect.right, bottom: menuRect.bottom, width: menuRect.width, height: menuRect.height },
          logo: logoRect && { left: logoRect.left, top: logoRect.top, right: logoRect.right, bottom: logoRect.bottom, height: logoRect.height },
          account: accountRect && { left: accountRect.left, top: accountRect.top, right: accountRect.right, bottom: accountRect.bottom, height: accountRect.height },
          cart: cartRect && { left: cartRect.left, top: cartRect.top, right: cartRect.right, bottom: cartRect.bottom, height: cartRect.height },
          search: searchRect && { left: searchRect.left, top: searchRect.top, right: searchRect.right, bottom: searchRect.bottom, width: searchRect.width, height: searchRect.height },
          searchButton: searchButtonRect && { width: searchButtonRect.width, height: searchButtonRect.height },
          location: locationRect && { left: locationRect.left, top: locationRect.top, right: locationRect.right, bottom: locationRect.bottom, height: locationRect.height },
          nav: navRect && { left: navRect.left, top: navRect.top, right: navRect.right, height: navRect.height, scrollWidth: document.querySelector('nav[aria-label="Primary departments"]')?.scrollWidth ?? 0 },
          firstCategory: firstCategoryRect && { top: firstCategoryRect.top, height: firstCategoryRect.height },
        };
      });

      expect(metrics.documentWidth).toBeLessThanOrEqual(width);
      expect(metrics.bodyWidth).toBeLessThanOrEqual(width);
      expect(metrics.menu?.width).toBeGreaterThanOrEqual(44);
      expect(metrics.menu?.height).toBeGreaterThanOrEqual(44);
      expect(metrics.logo?.height).toBeGreaterThanOrEqual(44);
      expect(metrics.account?.height).toBeGreaterThanOrEqual(44);
      expect(metrics.cart?.height).toBeGreaterThanOrEqual(44);
      expect(metrics.search?.height).toBeGreaterThanOrEqual(44);
      expect(metrics.searchButton?.width).toBeGreaterThanOrEqual(44);
      expect(metrics.searchButton?.height).toBeGreaterThanOrEqual(44);
      expect(metrics.location?.height).toBeGreaterThanOrEqual(44);
      expect(metrics.nav?.height).toBeGreaterThanOrEqual(44);
      expect(metrics.firstCategory?.height).toBeGreaterThanOrEqual(44);
      expect(metrics.search?.left).toBe(8);
      expect(metrics.search?.right).toBe(width - 8);
      expect(metrics.search?.width).toBe(width - 16);
      expect(metrics.location?.left).toBe(0);
      expect(metrics.location?.right).toBe(width);
      expect(metrics.nav?.left).toBe(0);
      expect(metrics.nav?.right).toBe(width);
      expect(metrics.firstCategory?.top).toBe(metrics.nav?.top);
      expect(metrics.menu?.right ?? 0).toBeLessThanOrEqual(metrics.logo?.left ?? 0);
      expect(metrics.logo?.right ?? 0).toBeLessThanOrEqual(metrics.account?.left ?? 0);
      expect(metrics.account?.right ?? 0).toBeLessThanOrEqual(metrics.cart?.left ?? 0);
      expect(metrics.menu?.bottom ?? 0).toBeLessThanOrEqual(metrics.search?.top ?? 0);
      expect(metrics.search?.bottom ?? 0).toBeLessThanOrEqual(metrics.location?.top ?? 0);
      expect(metrics.location?.bottom ?? 0).toBeLessThanOrEqual(metrics.nav?.top ?? 0);

      const longQuery = 'extra long wireless noise cancelling headphones for travel and home office'.repeat(3);
      await page.getByRole('searchbox', { name: 'Search Amazon' }).fill(longQuery);
      await expect(page.getByRole('searchbox', { name: 'Search Amazon' })).toHaveValue(longQuery);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);

      const scrollMetrics = await nav.evaluate((element) => {
        element.scrollLeft = element.scrollWidth;
        const lastLinkRect = element.querySelector('a:last-child')?.getBoundingClientRect();
        const navRect = element.getBoundingClientRect();

        return {
          scrollLeft: element.scrollLeft,
          lastLinkLeft: lastLinkRect?.left ?? -1,
          lastLinkRight: lastLinkRect?.right ?? -1,
          navLeft: navRect.left,
          navRight: navRect.right,
        };
      });

      expect(scrollMetrics.scrollLeft).toBeGreaterThan(0);
      expect(scrollMetrics.lastLinkLeft).toBeGreaterThanOrEqual(scrollMetrics.navLeft);
      expect(scrollMetrics.lastLinkRight).toBeLessThanOrEqual(scrollMetrics.navRight + 1);
      await nav.evaluate((element) => {
        element.scrollLeft = 0;
      });

      await page.screenshot({
        path: testInfo.outputPath(`mobile-header-${width}.png`),
        clip: { x: 0, y: 0, width, height: 220 },
      });
    }
  });

  test('retains the desktop header at 1024px', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto('/');

    await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeHidden();
    await expect(page.getByRole('combobox', { name: 'Search department' })).toBeVisible();
    await expect(page.getByRole('button', { name: /returns & orders/i })).toBeVisible();

    const metrics = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      headerHeight: document.querySelector('header')?.getBoundingClientRect().height ?? 0,
      searchWidth: document.querySelector('[role="search"]')?.getBoundingClientRect().width ?? 0,
    }));

    expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth);
    expect(metrics.headerHeight).toBe(99);
    expect(metrics.searchWidth).toBeGreaterThan(250);
  });
});

test.describe('Amazon search results', () => {
  test('renders horizontal product results and opens the product page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/s?k=wireless+headphones');

    await expect(page.getByText(/results for/i).first()).toContainText('wireless headphones');
    const result = page.locator('[data-search-result]').first();
    await expect(result).toBeVisible();
    await expect(result.getByText('3K+ bought in past month')).toBeVisible();
    await expect(result.getByLabel('Prime eligible')).toBeVisible();

    const resultLayout = await result.evaluate((element) => {
      const style = getComputedStyle(element);
      const image = element.querySelector('img')!.getBoundingClientRect();
      const title = element.querySelector('h2')!.getBoundingClientRect();
      return { display: style.display, imageLeft: image.left, titleLeft: title.left };
    });
    expect(resultLayout.display).toBe('grid');
    expect(resultLayout.imageLeft).toBeLessThan(resultLayout.titleLeft);

    await result.getByRole('link', { name: /AeroSound QuietWave Pro Wireless/i }).first().click();
    await expect(page).toHaveURL(/\/dp\/B0QW7A2N9K$/);
  });

  test('handles responsive rows, all results, and no results', async ({ page }, testInfo) => {
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/s');
      await expect(page.locator('[data-search-result]').first()).toBeVisible();

      const metrics = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        resultCount: document.querySelectorAll('[data-search-result]').length,
        firstResultColumns: getComputedStyle(
          document.querySelector<HTMLElement>('[data-search-result]')!,
        ).gridTemplateColumns,
      }));

      expect(metrics.documentWidth).toBeLessThanOrEqual(width);
      expect(metrics.bodyWidth).toBeLessThanOrEqual(width);
      expect(metrics.resultCount).toBeGreaterThan(10);
      expect(metrics.firstResultColumns.split(' ').length).toBe(width > 1050 ? 3 : 2);

      if ([320, 768, 1440].includes(width)) {
        await page.screenshot({
          path: testInfo.outputPath(`search-results-${width}.png`),
          fullPage: true,
        });
      }
    }

    await page.goto('/s?k=moon-powered+typewriter');
    await expect(
      page.getByRole('heading', { name: 'No results for “moon-powered typewriter”' }),
    ).toBeVisible();
    await expect(page.locator('[data-search-result]')).toHaveCount(0);
  });
});

test.describe('Search filtering and sorting', () => {
  test('recreates combined URL state across reload and browser history', async ({ page }, testInfo) => {
    const filteredUrl =
      '/s?k=electronics&category=electronics&prime=true&rating=4.5&minPrice=30&maxPrice=150&sort=price-asc';
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(filteredUrl);

    const results = page.locator('[data-search-result]');
    await expect(results).toHaveCount(2);
    await expect(results.first()).toContainText('NovaLink 65W GaN USB-C Charger');
    await expect(page.getByLabel('Sort results')).toHaveValue('price-asc');
    await expect(page.getByRole('navigation', { name: 'Active filters' })).toContainText(
      'Electronics',
    );
    await page.screenshot({
      path: testInfo.outputPath('desktop-filtered-results.png'),
      fullPage: true,
    });

    await page.reload();
    await expect(results).toHaveCount(2);
    await expect(results.first()).toContainText('NovaLink 65W GaN USB-C Charger');

    await page.goto('/s?k=electronics');
    const sidebar = page.getByRole('complementary', { name: 'Search filters' });
    await sidebar.getByRole('link', { name: /Electronics \(/ }).click();
    await expect(page).toHaveURL(/category=electronics/);
    await sidebar.getByRole('link', { name: 'Prime only' }).click();
    await expect(page).toHaveURL(/prime=true/);
    await expect(results).toHaveCount(3);

    await page.goBack();
    await expect(page).not.toHaveURL(/prime=true/);
    await expect(results).toHaveCount(4);

    await page.goForward();
    await expect(page).toHaveURL(/prime=true/);
    await expect(results).toHaveCount(3);
  });

  test('uses a mobile filter drawer and preserves empty filtered state', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/s?k=electronics');

    await expect(page.getByRole('complementary', { name: 'Search filters' })).toBeHidden();
    await page.getByRole('button', { name: 'Filters' }).click();
    let drawer = page.getByRole('dialog', { name: 'Filters' });
    await expect(drawer).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath('mobile-filter-drawer.png'),
      fullPage: true,
    });
    await drawer.getByRole('link', { name: '4.5 stars and up' }).click();
    await expect(page).toHaveURL(/rating=4.5/);
    await expect(drawer).toBeHidden();

    await page.getByRole('button', { name: 'Filters (1)' }).click();
    drawer = page.getByRole('dialog', { name: 'Filters' });
    await drawer.getByLabel('Minimum price').fill('30');
    await drawer.getByLabel('Maximum price').fill('100');
    await drawer.getByRole('button', { name: 'Go' }).click();
    await expect(page).toHaveURL(/minPrice=30/);
    await expect(page).toHaveURL(/maxPrice=100/);
    await expect(page.getByRole('button', { name: 'Filters (2)' })).toBeVisible();

    await page.getByLabel('Sort results').selectOption('price-desc');
    await expect(page).toHaveURL(/sort=price-desc/);

    await page.goto('/s?k=headphones&category=office&prime=true&rating=4.5&maxPrice=50');
    await expect(page.getByRole('heading', { name: 'No results for “headphones”' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Clear filters' }).first()).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath('mobile-filtered-empty-state.png'),
      fullPage: true,
    });
  });
});

test.describe('Amazon homepage hero', () => {
  test('uses intentional promotional and merchandising layouts at every target width', async ({
    page,
  }, testInfo) => {
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');

      const hero = page.locator('section[aria-labelledby="homepage-hero-title"]');
      const heroHeading = page.getByRole('heading', { name: 'Everyday upgrades, delivered' });
      const heroImage = page.getByRole('img', {
        name: 'Everyday essentials arranged for home, work, and life on the go',
      });
      const merchandising = page.getByRole('region', { name: 'Featured shopping categories' });
      const cards = page.locator('[data-merch-card]');

      await expect(hero).toBeVisible();
      await expect(heroHeading).toBeVisible();
      await expect(heroImage).toBeVisible();
      await expect(merchandising).toBeVisible();
      await expect(cards).toHaveCount(4);
      await expect
        .poll(() => heroImage.evaluate((image: HTMLImageElement) => image.naturalWidth))
        .toBeGreaterThan(0);

      const metrics = await page.evaluate(() => {
        const mainRect = document.querySelector('#main-content')!.getBoundingClientRect();
        const heroRect = document
          .querySelector('section[aria-labelledby="homepage-hero-title"]')!
          .getBoundingClientRect();
        const imageRect = document
          .querySelector<HTMLImageElement>('#main-content img[fetchpriority="high"]')!
          .getBoundingClientRect();
        const copyRect = document.querySelector('#homepage-hero-title')!.parentElement!.getBoundingClientRect();
        const merchandisingElement = document.querySelector<HTMLElement>(
          'section[aria-label="Featured shopping categories"]',
        )!;
        const merchandisingRect = merchandisingElement.getBoundingClientRect();
        const cardRects = Array.from(document.querySelectorAll<HTMLElement>('[data-merch-card]')).map(
          (card) => {
            const rect = card.getBoundingClientRect();
            return {
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              top: Math.round(rect.top),
              width: rect.width,
            };
          },
        );

        return {
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
          main: { left: mainRect.left, right: mainRect.right, width: mainRect.width },
          hero: {
            left: heroRect.left,
            right: heroRect.right,
            top: heroRect.top,
            bottom: heroRect.bottom,
            width: heroRect.width,
            height: heroRect.height,
          },
          image: {
            left: imageRect.left,
            right: imageRect.right,
            top: imageRect.top,
            bottom: imageRect.bottom,
            width: imageRect.width,
            height: imageRect.height,
          },
          copy: {
            left: copyRect.left,
            right: copyRect.right,
            top: copyRect.top,
            bottom: copyRect.bottom,
          },
          merchandising: {
            left: merchandisingRect.left,
            right: merchandisingRect.right,
            top: merchandisingRect.top,
            width: merchandisingRect.width,
            scrollWidth: merchandisingElement.scrollWidth,
          },
          cardColumnCount: new Set(cardRects.map((card) => card.left)).size,
          cardRowCount: new Set(cardRects.map((card) => card.top)).size,
          firstCard: cardRects[0],
        };
      });

      const expectedMainWidth = Math.min(width, 1500);
      expect(metrics.documentWidth).toBeLessThanOrEqual(width);
      expect(metrics.bodyWidth).toBeLessThanOrEqual(width);
      expect(metrics.main.width).toBe(expectedMainWidth);
      expect(metrics.main.left).toBe((width - expectedMainWidth) / 2);
      expect(metrics.main.right).toBe(metrics.main.left + expectedMainWidth);
      expect(metrics.hero.left).toBe(metrics.main.left);
      expect(metrics.hero.right).toBe(metrics.main.right);
      expect(metrics.image).toEqual(metrics.hero);
      expect(metrics.copy.left).toBeGreaterThanOrEqual(metrics.hero.left + 14);
      expect((metrics.copy.left + metrics.copy.right) / 2).toBeLessThan(
        (metrics.hero.left + metrics.hero.right) / 2,
      );
      expect(metrics.copy.top).toBeGreaterThan(metrics.hero.top);
      expect(metrics.copy.bottom).toBeLessThan(metrics.hero.bottom);
      expect(metrics.merchandising.top).toBeLessThan(metrics.hero.bottom);
      expect(metrics.merchandising.top).toBeGreaterThan(metrics.hero.top);
      expect(metrics.copy.bottom).toBeLessThanOrEqual(metrics.merchandising.top);
      expect(metrics.firstCard.left).toBeGreaterThanOrEqual(metrics.main.left + 10);

      if (width < 600) {
        expect(metrics.hero.height).toBe(284);
        expect(metrics.cardRowCount).toBe(1);
        expect(metrics.merchandising.scrollWidth).toBeGreaterThan(metrics.merchandising.width);

        const scrollMetrics = await merchandising.evaluate((element) => {
          element.scrollLeft = element.scrollWidth;
          const lastCardRect = element.lastElementChild!.getBoundingClientRect();
          const railRect = element.getBoundingClientRect();
          return {
            scrollLeft: element.scrollLeft,
            cardLeft: lastCardRect.left,
            cardRight: lastCardRect.right,
            railLeft: railRect.left,
            railRight: railRect.right,
          };
        });

        expect(scrollMetrics.scrollLeft).toBeGreaterThan(0);
        expect(scrollMetrics.cardLeft).toBeGreaterThanOrEqual(scrollMetrics.railLeft);
        expect(scrollMetrics.cardRight).toBeLessThanOrEqual(scrollMetrics.railRight);
        await merchandising.evaluate((element) => {
          element.scrollLeft = 0;
        });
      } else if (width < 900) {
        expect(metrics.cardColumnCount).toBe(2);
        expect(metrics.cardRowCount).toBe(2);
      } else {
        expect(metrics.cardColumnCount).toBe(4);
        expect(metrics.cardRowCount).toBe(1);
        expect(metrics.hero.width / metrics.hero.height).toBeCloseTo(2.5, 1);
      }

      await page.screenshot({
        path: testInfo.outputPath(`homepage-hero-${width}.png`),
        clip: { x: 0, y: metrics.hero.top, width, height: 900 },
      });
    }
  });

  test('supports a complete responsive product-discovery journey', async ({ page }, testInfo) => {
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');

      const topPicks = page.getByRole('region', { name: 'Top picks for you' });
      const refresh = page.getByRole('region', { name: 'Refresh your space' });
      const deals = page.getByRole('region', { name: 'Deals worth a look' });
      const interests = page.getByRole('region', { name: 'More ways to discover' });
      const promiseBar = page.getByRole('region', { name: 'Shopping benefits' });
      const rails = page.locator('[data-product-rail]');

      await expect(topPicks).toBeVisible();
      await expect(refresh).toBeVisible();
      await expect(deals).toBeVisible();
      await expect(interests).toBeVisible();
      await expect(promiseBar).toBeVisible();
      await expect(page.locator('[data-product-card]')).toHaveCount(9);
      await expect(topPicks.locator('[data-product-card]')).toHaveCount(5);
      await expect(deals.locator('[data-product-card]')).toHaveCount(4);

      const metrics = await page.evaluate(() => {
        const mainRect = document.querySelector('#main-content')!.getBoundingClientRect();
        const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-home-section]'));
        const firstRail = document.querySelector<HTMLElement>('[data-product-rail]')!;
        const promiseItems = Array.from(
          document.querySelector<HTMLElement>('section[aria-label="Shopping benefits"]')!.children,
        ).map((item) => Math.round(item.getBoundingClientRect().left));
        const interestItems = Array.from(
          document.querySelectorAll<HTMLElement>('a[href*="category=office"], a[href*="category=sports-outdoors"]'),
        )
          .filter((item) => item.closest('section[aria-labelledby="interests-title"]'))
          .map((item) => Math.round(item.getBoundingClientRect().left));

        return {
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
          sectionCount: sections.length,
          sectionsStayInsideMain: sections.every((section) => {
            const rect = section.getBoundingClientRect();
            return rect.left >= mainRect.left - 0.5 && rect.right <= mainRect.right + 0.5;
          }),
          railWidth: firstRail.clientWidth,
          railScrollWidth: firstRail.scrollWidth,
          promiseColumns: new Set(promiseItems).size,
          interestColumns: new Set(interestItems).size,
        };
      });

      expect(metrics.documentWidth).toBeLessThanOrEqual(width);
      expect(metrics.bodyWidth).toBeLessThanOrEqual(width);
      expect(metrics.sectionCount).toBe(5);
      expect(metrics.sectionsStayInsideMain).toBe(true);
      expect(metrics.promiseColumns).toBe(width < 900 ? 1 : 3);
      expect(metrics.interestColumns).toBe(width < 600 ? 1 : 2);

      if (width <= 1100) {
        expect(metrics.railScrollWidth).toBeGreaterThan(metrics.railWidth);
        const firstRail = rails.first();
        const scrollMetrics = await firstRail.evaluate((element) => {
          element.scrollLeft = element.scrollWidth;
          const railRect = element.getBoundingClientRect();
          const lastCardRect = element.lastElementChild!.getBoundingClientRect();
          return {
            scrollLeft: element.scrollLeft,
            railRight: railRect.right,
            cardRight: lastCardRect.right,
          };
        });
        expect(scrollMetrics.scrollLeft).toBeGreaterThan(0);
        expect(scrollMetrics.cardRight).toBeLessThanOrEqual(scrollMetrics.railRight + 1);
      } else {
        expect(metrics.railScrollWidth).toBe(metrics.railWidth);
      }

      if ([320, 768, 1440].includes(width)) {
        await page.screenshot({
          path: testInfo.outputPath(`homepage-redesign-${width}.png`),
          fullPage: true,
        });
      }
    }

    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto('/');
    await page
      .getByRole('region', { name: 'Top picks for you' })
      .getByRole('link', { name: /AeroSound QuietWave Pro/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/dp\/B0QW7A2N9K$/);
    await expect(
      page.getByRole('heading', { name: /AeroSound QuietWave Pro Wireless/i }),
    ).toBeVisible();
  });
});

test.describe('Amazon-style footer', () => {
  test('keeps its hierarchy, responsive grids, and controls usable at every target width', async ({
    page,
  }, testInfo) => {
    const targetWidths = [
      320, 360, 375, 390, 430, 480, 768, 820, 1024, 1280, 1366, 1440, 1920,
    ];

    for (const width of targetWidths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');

      const footer = page.getByRole('contentinfo', { name: 'Amazon footer' });
      const backToTop = page.getByRole('link', { name: 'Back to top' });
      const footerNavigation = page.getByRole('navigation', { name: 'Footer navigation' });
      const servicesNavigation = page.getByRole('navigation', { name: 'Amazon services' });
      const legalNavigation = page.getByRole('navigation', { name: 'Legal' });
      const languageControl = page.getByRole('button', { name: 'English' });
      const countryControl = page.getByRole('button', { name: 'United States' });

      await footer.scrollIntoViewIfNeeded();
      await expect(footer).toBeVisible();
      await expect(backToTop).toBeVisible();
      await expect(footerNavigation).toBeVisible();
      await expect(servicesNavigation).toBeVisible();
      await expect(legalNavigation).toBeVisible();
      await expect(languageControl).toBeVisible();
      await expect(countryControl).toBeVisible();

      const metrics = await footer.evaluate((element) => {
        const getUniquePositions = (selector: string, axis: 'left' | 'top') =>
          new Set(
            Array.from(element.querySelectorAll<HTMLElement>(selector)).map((item) =>
              Math.round(item.getBoundingClientRect()[axis]),
            ),
          ).size;
        const interactiveRects = Array.from(element.querySelectorAll<HTMLElement>('a, button')).map(
          (item) => {
            const rect = item.getBoundingClientRect();
            return {
              left: rect.left,
              right: rect.right,
              width: rect.width,
              height: rect.height,
            };
          },
        );
        const footerRect = element.getBoundingClientRect();
        const backRect = element.querySelector('a[href="#root"]')?.getBoundingClientRect();
        const localeRects = Array.from(element.querySelectorAll<HTMLButtonElement>('button')).map(
          (button) => {
            const rect = button.getBoundingClientRect();
            return { width: rect.width, height: rect.height };
          },
        );
        const primaryColor = getComputedStyle(
          element.querySelector<HTMLElement>('[data-footer-primary]')!,
        ).backgroundColor;
        const legalColor = getComputedStyle(
          element.querySelector<HTMLElement>('[data-footer-legal]')!,
        ).backgroundColor;

        return {
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
          footerLeft: footerRect.left,
          footerRight: footerRect.right,
          footerWidth: footerRect.width,
          backHeight: backRect?.height ?? 0,
          columnCount: getUniquePositions('[data-footer-column]', 'left'),
          serviceColumnCount: getUniquePositions('nav[aria-label="Amazon services"] > a', 'left'),
          columnRowCount: getUniquePositions('[data-footer-column]', 'top'),
          primaryColor,
          legalColor,
          localeRects,
          hasClippedInteractive: interactiveRects.some(
            (rect) => rect.left < -0.5 || rect.right > window.innerWidth + 0.5 || rect.width <= 0,
          ),
        };
      });

      const expectedColumns = width < 900 ? 2 : 4;
      const expectedServiceColumns = width < 600 ? 2 : width < 900 ? 3 : 5;

      expect(metrics.documentWidth).toBeLessThanOrEqual(width);
      expect(metrics.bodyWidth).toBeLessThanOrEqual(width);
      expect(metrics.footerLeft).toBe(0);
      expect(metrics.footerRight).toBe(width);
      expect(metrics.footerWidth).toBe(width);
      expect(metrics.backHeight).toBeGreaterThanOrEqual(44);
      expect(metrics.columnCount).toBe(expectedColumns);
      expect(metrics.serviceColumnCount).toBe(expectedServiceColumns);
      expect(metrics.columnRowCount).toBe(width < 900 ? 2 : 1);
      expect(metrics.primaryColor).toBe('rgb(35, 47, 62)');
      expect(metrics.legalColor).toBe('rgb(19, 26, 34)');
      expect(metrics.hasClippedInteractive).toBe(false);
      expect(metrics.localeRects).toHaveLength(2);
      for (const rect of metrics.localeRects) {
        expect(rect.height).toBeGreaterThanOrEqual(44);
      }

      await footer.screenshot({ path: testInfo.outputPath(`amazon-footer-${width}.png`) });

      await backToTop.click();
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    }
  });
});
