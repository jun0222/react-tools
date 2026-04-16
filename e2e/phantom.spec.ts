import { test, expect, type Page } from '@playwright/test';

// =====================================================================
// 同一ブラウザで全テストを連続実行（目視確認用）
// test.describe.serial + 共有 page で、テスト間でブラウザを閉じない
// =====================================================================

let page: Page;

test.describe.serial('Phantom 全機能 E2E', () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto('/');
  });

  test.afterAll(async () => {
    await page.waitForTimeout(3000);
    await page.close();
  });

  // =====================
  // ホーム → Phantom 遷移
  // =====================
  test('ホーム：Phantom カードが表示される', async () => {
    await page.goto('/');
    await expect(page.getByText('Phantom').first()).toBeVisible();
    await page.waitForTimeout(800);
  });

  test('ホーム：Phantom カードをクリックすると /phantom に遷移する', async () => {
    await page.getByRole('link', { name: /phantom/i }).first().click();
    await expect(page).toHaveURL('/phantom');
    await page.waitForTimeout(800);
  });

  // =====================
  // ヘッダー・基本レイアウト
  // =====================
  test('PHANTOM ヘッダーとサブタイトルが表示される', async () => {
    await expect(page.getByText('PHANTOM')).toBeVisible();
    await expect(page.getByText(/text mask/i)).toBeVisible();
    await page.waitForTimeout(800);
  });

  test('INPUT エリアと OUTPUT エリアが表示される', async () => {
    await expect(page.getByPlaceholder('テキストを入力...')).toBeVisible();
    await expect(page.locator('.ph-output')).toBeVisible();
    await page.waitForTimeout(800);
  });

  test('置換タブとランダムタブが表示される', async () => {
    await expect(page.getByRole('button', { name: /置換/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /ランダム/ })).toBeVisible();
    await page.waitForTimeout(800);
  });

  // =====================
  // 入出力
  // =====================
  test('入力テキストがそのまま OUTPUT に反映される', async () => {
    await page.getByPlaceholder('テキストを入力...').fill('hello world');
    await expect(page.locator('.ph-output')).toHaveText('hello world');
    await page.waitForTimeout(800);
  });

  // =====================
  // 置換タブ
  // =====================
  test('置換：変換前→変換後を入力すると OUTPUT が変換される', async () => {
    await page.getByPlaceholder('変換前').fill('hello');
    await page.getByPlaceholder('変換後').fill('bye');
    await expect(page.locator('.ph-output')).toHaveText('bye world');
    await page.waitForTimeout(1000);
  });

  test('置換：「ペアを追加」で2セット目が表示される', async () => {
    await page.getByRole('button', { name: /ペアを追加/ }).click();
    await expect(page.getByPlaceholder('変換前')).toHaveCount(2);
    await page.waitForTimeout(800);
  });

  test('置換：2セット目を入力すると連鎖的に変換される', async () => {
    const froms = page.getByPlaceholder('変換前');
    const tos = page.getByPlaceholder('変換後');
    await froms.nth(1).fill('world');
    await tos.nth(1).fill('there');
    await expect(page.locator('.ph-output')).toHaveText('bye there');
    await page.waitForTimeout(1000);
  });

  test('置換：削除ボタンで2セット目が消える', async () => {
    await page.getByRole('button', { name: 'ペアを削除' }).last().click();
    await expect(page.getByPlaceholder('変換前')).toHaveCount(1);
    await page.waitForTimeout(800);
  });

  // =====================
  // ランダムタブ
  // =====================
  test('ランダムタブ前準備：置換ペアをクリアしてテキストを "hello" にする', async () => {
    // 置換ペアを空にして副作用をなくす
    await page.getByPlaceholder('変換前').fill('');
    await page.getByPlaceholder('変換後').fill('');
    await page.getByPlaceholder('テキストを入力...').fill('hello');
    await expect(page.locator('.ph-output')).toHaveText('hello');
    await page.waitForTimeout(800);
  });

  test('ランダムタブに切り替えると「ルールを追加」ボタンが表示される', async () => {
    await page.getByRole('button', { name: /ランダム/ }).click();
    await expect(page.getByRole('button', { name: /ルールを追加/ })).toBeVisible();
    await page.waitForTimeout(800);
  });

  test('ランダム：ルール追加で対象文字列の入力が現れる', async () => {
    await page.getByRole('button', { name: /ルールを追加/ }).click();
    await expect(page.getByPlaceholder(/対象文字列/)).toBeVisible();
    await page.waitForTimeout(800);
  });

  test('ランダム：対象文字列「hello」を入力すると一致部分だけが変換される（外側の " " は不変）', async () => {
    await page.getByPlaceholder(/対象文字列/).fill('hello');
    const output = await page.locator('.ph-output').textContent() ?? '';
    // 'hello' の5文字がすべて変換されている（元の文字とは異なる）
    expect(output).toHaveLength(5);
    expect(output).not.toBe('hello');
    // すべて小文字
    expect(output).toMatch(/^[a-z]{5}$/);
    await page.waitForTimeout(1000);
  });

  test('ランダム：削除ボタンでルールが消え OUTPUT が元に戻る', async () => {
    await page.getByRole('button', { name: 'ルールを削除' }).click();
    await expect(page.getByPlaceholder(/対象文字列/)).not.toBeVisible();
    await expect(page.locator('.ph-output')).toHaveText('hello');
    await page.waitForTimeout(800);
  });

  // =====================
  // コピーボタン
  // =====================
  test('コピーボタンが表示される', async () => {
    await expect(page.getByRole('button', { name: /コピー/ })).toBeVisible();
    await page.waitForTimeout(500);
  });
});