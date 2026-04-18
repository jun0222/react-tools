import { test, expect, type Page } from '@playwright/test';

let page: Page;

test.describe.serial('ページメタデータ E2E', () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto('/');
  });

  test.afterAll(async () => {
    await page.waitForTimeout(2000);
    await page.close();
  });

  // =============================================
  // ホームページのメタデータ
  // =============================================
  test('ホーム：タイトルが react-tools を含む', async () => {
    await page.goto('/');
    await expect(page).toHaveTitle(/react-tools/i);
    await page.waitForTimeout(600);
  });

  test('ホーム：meta description にツールの説明が設定される', async () => {
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toMatch(/ツール/);
    await page.waitForTimeout(400);
  });

  // =============================================
  // OneShot ページのメタデータ
  // =============================================
  test('OneShot：リンクをクリックするとタイトルが切り替わる', async () => {
    await page.getByRole('link', { name: /oneshot/i }).first().click();
    await expect(page).toHaveURL('/oneshot');
    await expect(page).toHaveTitle(/OneShot/i);
    await page.waitForTimeout(800);
  });

  test('OneShot：meta description にプロンプトの説明が設定される', async () => {
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toMatch(/プロンプト/);
    await page.waitForTimeout(400);
  });

  // =============================================
  // Phantom ページのメタデータ
  // =============================================
  test('Phantom：ナビゲートするとタイトルが切り替わる', async () => {
    await page.goto('/phantom');
    await expect(page).toHaveTitle(/Phantom/i);
    await page.waitForTimeout(800);
  });

  test('Phantom：meta description にテキストの説明が設定される', async () => {
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toMatch(/テキスト/);
    await page.waitForTimeout(400);
  });

  // =============================================
  // ホームに戻ってもメタデータが切り替わる
  // =============================================
  test('ホームに戻るとタイトルが react-tools に戻る', async () => {
    await page.goto('/');
    await expect(page).toHaveTitle(/react-tools/i);
    await page.waitForTimeout(600);
  });
});