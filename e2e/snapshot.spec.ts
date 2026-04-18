import { test, expect, type Page } from '@playwright/test';

let page: Page;

test.describe.serial('UI ビジュアルスナップショット', () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    page = await context.newPage();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test.afterAll(async () => {
    await page.waitForTimeout(1000);
    await page.close();
  });

  // =============================================
  // ホーム
  // =============================================
  test('ホーム ダークモード', async () => {
    await page.goto('/');
    await page.locator('.home.dark').waitFor();
    await expect(page.locator('.home')).toHaveScreenshot('home-dark.png');
    await page.waitForTimeout(600);
  });

  test('ホーム ライトモード', async () => {
    await page.getByTitle('テーマ切替').click();
    await page.locator('.home.light').waitFor();
    await expect(page.locator('.home')).toHaveScreenshot('home-light.png');
    await page.waitForTimeout(600);
  });

  // =============================================
  // OneShot
  // =============================================
  test('OneShot ダークモード', async () => {
    await page.evaluate(() => localStorage.setItem('oneshot-theme', 'dark'));
    await page.goto('/oneshot');
    await page.locator('.oneshot.dark').waitFor();
    await expect(page.locator('.oneshot')).toHaveScreenshot('oneshot-dark.png');
    await page.waitForTimeout(600);
  });

  test('OneShot ライトモード', async () => {
    await page.getByTitle('テーマ切替').click();
    await page.locator('.oneshot.light').waitFor();
    await expect(page.locator('.oneshot')).toHaveScreenshot('oneshot-light.png');
    await page.waitForTimeout(600);
  });

  // =============================================
  // Phantom
  // =============================================
  test('Phantom ダークモード', async () => {
    await page.evaluate(() => localStorage.setItem('oneshot-theme', 'dark'));
    await page.goto('/phantom');
    await page.locator('.ph-root.dark').waitFor();
    await expect(page.locator('.ph-root')).toHaveScreenshot('phantom-dark.png');
    await page.waitForTimeout(600);
  });

  test('Phantom ライトモード', async () => {
    await page.getByTitle('テーマ切替').click();
    await page.locator('.ph-root.light').waitFor();
    await expect(page.locator('.ph-root')).toHaveScreenshot('phantom-light.png');
    await page.waitForTimeout(600);
  });
});