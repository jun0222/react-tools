import { test, expect, type Page } from '@playwright/test';

let page: Page;

test.describe.serial('グローバルテーマ E2E', () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test.afterAll(async () => {
    await page.waitForTimeout(2000);
    await page.close();
  });

  // =============================================
  // ホーム画面でのテーマ切替
  // =============================================
  test('ホーム：初期状態はダークモード（.dark クラスが付く）', async () => {
    await page.goto('/');
    await expect(page.locator('.home.dark')).toBeVisible();
    await page.waitForTimeout(600);
  });

  test('ホーム：テーマ切替ボタンでライトモードに切り替わる', async () => {
    await page.getByTitle('テーマ切替').click();
    await expect(page.locator('.home.light')).toBeVisible();
    await expect(page.locator('.home.dark')).not.toBeVisible();
    await page.waitForTimeout(800);
  });

  // =============================================
  // ページをまたいでテーマが維持される
  // =============================================
  test('OneShot：ホームで設定したライトモードが維持される', async () => {
    await page.getByRole('link', { name: /oneshot/i }).first().click();
    await expect(page).toHaveURL('/oneshot');
    await expect(page.locator('.oneshot.light')).toBeVisible();
    await page.waitForTimeout(800);
  });

  test('Phantom：ホームで設定したライトモードが維持される', async () => {
    await page.goto('/phantom');
    await expect(page.locator('.ph-root.light')).toBeVisible();
    await page.waitForTimeout(800);
  });

  test('Phantom：テーマ切替ボタンでダークモードに戻せる', async () => {
    await page.getByTitle('テーマ切替').click();
    await expect(page.locator('.ph-root.dark')).toBeVisible();
    await page.waitForTimeout(800);
  });

  // =============================================
  // リロード後もテーマが維持される
  // =============================================
  test('リロード後もダークモードが維持される', async () => {
    await page.reload();
    await expect(page.locator('.ph-root.dark')).toBeVisible();
    await page.waitForTimeout(600);
  });

  test('ライトモードに切替後リロードしてもライトモードが維持される', async () => {
    await page.getByTitle('テーマ切替').click();
    await expect(page.locator('.ph-root.light')).toBeVisible();
    await page.reload();
    await expect(page.locator('.ph-root.light')).toBeVisible();
    await page.waitForTimeout(800);
  });

  // =============================================
  // ホームに戻ってもテーマが維持される
  // =============================================
  test('ホームに戻ってもライトモードが維持される', async () => {
    await page.goto('/');
    await expect(page.locator('.home.light')).toBeVisible();
    await page.waitForTimeout(600);
  });
});