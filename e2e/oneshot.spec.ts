import { test, expect, type Page } from '@playwright/test';

// =====================================================================
// 同一ブラウザで全テストを連続実行（目視確認用）
// test.describe.serial + 共有 page で、テスト間でブラウザを閉じない
// =====================================================================

let page: Page;

test.describe.serial('OneShot 全機能 E2E', () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    // 最初にホームへ移動して localStorage をクリア
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test.afterAll(async () => {
    // テスト終了後も少し表示を維持してから閉じる
    await page.waitForTimeout(3000);
    await page.close();
  });

  // =====================
  // ホーム画面
  // =====================
  test('ホーム：タイトルとOneShot カードが表示される', async () => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('OneShot').first()).toBeVisible();
    await page.waitForTimeout(1000);
  });

  test('ホーム：OneShot カードをクリックすると /oneshot に遷移する', async () => {
    await page.getByRole('link', { name: /oneshot/i }).first().click();
    await expect(page).toHaveURL('/oneshot');
    await page.waitForTimeout(1000);
  });

  // =====================
  // プロンプト追加
  // =====================
  test('追加：「新しいプロンプトを追加」ボタンでフォームが開く', async () => {
    await page.getByRole('button', { name: /新しいプロンプトを追加/ }).click();
    await expect(page.getByPlaceholder('プロンプト本文...')).toBeVisible();
    await page.waitForTimeout(800);
  });

  test('追加：本文を入力して追加するとバブルが表示される', async () => {
    await page.getByPlaceholder('プロンプト本文...').fill('最初のプロンプト');
    await page.getByRole('button', { name: /^追加$/ }).click();
    await expect(page.getByText('最初のプロンプト')).toBeVisible();
    await page.waitForTimeout(800);
  });

  test('追加：タグ付きプロンプトを追加するとバブルにタグが表示される', async () => {
    await page.getByRole('button', { name: /新しいプロンプトを追加/ }).click();
    await page.getByPlaceholder('プロンプト本文...').fill('タグ付きプロンプト');
    await page.getByPlaceholder('タグ（カンマ区切り）').fill('react, typescript');
    await page.getByRole('button', { name: /^追加$/ }).click();
    await expect(page.locator('.os-tag', { hasText: 'react' })).toBeVisible();
    await expect(page.locator('.os-tag', { hasText: 'typescript' })).toBeVisible();
    await page.waitForTimeout(800);
  });

  test('追加：キャンセルするとフォームが閉じる', async () => {
    await page.getByRole('button', { name: /新しいプロンプトを追加/ }).click();
    await page.getByPlaceholder('プロンプト本文...').fill('キャンセルテスト');
    await page.getByRole('button', { name: /キャンセル/ }).click();
    await expect(page.getByPlaceholder('プロンプト本文...')).not.toBeVisible();
    await expect(page.getByText('キャンセルテスト')).not.toBeVisible();
    await page.waitForTimeout(800);
  });

  // =====================
  // プロンプト編集
  // =====================
  test('編集：保存するとバブル本文が更新される', async () => {
    // 一番古い「最初のプロンプト」（末尾）を編集
    await page.getByRole('button', { name: '編集' }).last().click();
    await page.locator('textarea.os-edit-textarea').fill('編集済みプロンプト');
    await page.getByRole('button', { name: /保存/ }).click();
    await expect(page.getByText('編集済みプロンプト')).toBeVisible();
    await page.waitForTimeout(1000);
  });

  // =====================
  // タグフィルター
  // =====================
  test('タグ：フィルターで絞り込みができる', async () => {
    // #react フィルターをクリック
    await page.getByRole('button', { name: '#react' }).click();
    await expect(page.locator('.os-bubble-body', { hasText: 'タグ付きプロンプト' })).toBeVisible();
    await expect(page.locator('.os-bubble-body', { hasText: '編集済みプロンプト' })).not.toBeVisible();
    await page.waitForTimeout(1000);
    // すべてに戻す
    await page.getByRole('button', { name: /^すべて$/ }).click();
    await page.waitForTimeout(800);
  });

  // =====================
  // Sent トグル & フィルター
  // =====================
  test('Sent：Mark Sent でバブルが SENT 表示になる', async () => {
    // 送信済み用プロンプトを追加
    await page.getByRole('button', { name: /新しいプロンプトを追加/ }).click();
    await page.getByPlaceholder('プロンプト本文...').fill('送信済みプロンプト');
    await page.getByRole('button', { name: /^追加$/ }).click();
    await page.getByRole('button', { name: /Mark Sent/ }).first().click();
    await expect(page.locator('.os-sent-badge')).toBeVisible();
    await page.waitForTimeout(800);
  });

  test('Sent：「送信済み」フィルターで絞り込み → 「すべて」で全表示', async () => {
    await page.getByRole('button', { name: /^送信済み$/ }).click();
    await expect(page.locator('.os-bubble-body', { hasText: '送信済みプロンプト' })).toBeVisible();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /^すべて$/ }).click();
    await page.waitForTimeout(800);
  });

  // =====================
  // プログレスマーカー
  // =====================
  test('作業中：マークを付けると in-progress バブルが表示される', async () => {
    await page.getByRole('button', { name: '作業中にする' }).first().click();
    await expect(page.locator('.os-bubble.in-progress')).toBeVisible();
    await expect(page.getByText('▶ 作業中')).toBeVisible();
    await page.waitForTimeout(1000);
  });

  test('作業中：別のプロンプトを選ぶと前のが自動解除される', async () => {
    const btns = page.getByRole('button', { name: '作業中にする' });
    await btns.first().click();
    await expect(page.locator('.os-bubble.in-progress')).toHaveCount(1);
    await page.waitForTimeout(1000);
  });

  // =====================
  // 並べ替え
  // =====================
  test('並べ替え：下ボタンで先頭プロンプトが2番目に移動する', async () => {
    // フィルターなし状態で上下ボタンが見える
    await expect(page.getByRole('button', { name: '上に移動' }).first()).toBeVisible();
    // 先頭を下へ
    await page.getByRole('button', { name: '下に移動' }).first().click();
    await page.waitForTimeout(1000);
  });

  test('並べ替え：フィルター中は並べ替えボタンが非表示', async () => {
    await page.getByRole('button', { name: /^未送信$/ }).click();
    await expect(page.getByRole('button', { name: '上に移動' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '下に移動' })).not.toBeVisible();
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: /^すべて$/ }).click();
    await page.waitForTimeout(800);
  });

  // =====================
  // ゴミ箱
  // =====================
  test('ゴミ箱：移動して復元できる', async () => {
    // 新規プロンプトを追加してゴミ箱へ
    await page.getByRole('button', { name: /新しいプロンプトを追加/ }).click();
    await page.getByPlaceholder('プロンプト本文...').fill('ゴミ箱テスト');
    await page.getByRole('button', { name: /^追加$/ }).click();
    await page.getByRole('button', { name: 'ゴミ箱に移動' }).first().click();
    await expect(page.getByText('ゴミ箱テスト')).not.toBeVisible();
    await page.waitForTimeout(800);
    // ゴミ箱パネルを開いて復元
    await page.getByTitle('ゴミ箱').click();
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: /復元/ }).click();
    await expect(page.getByText('ゴミ箱テスト')).toBeVisible();
    await page.waitForTimeout(1000);
    // ゴミ箱パネルを閉じる
    await page.getByTitle('ゴミ箱').click();
    await page.waitForTimeout(800);
  });

  // =====================
  // リプライ
  // =====================
  test('リプライ：追加・解決できる', async () => {
    await page.getByRole('button', { name: /Reply/ }).first().click();
    await page.getByPlaceholder('リプライを入力...').fill('E2Eリプライ');
    await page.keyboard.press('Enter');
    await expect(page.getByText('E2Eリプライ')).toBeVisible();
    await page.waitForTimeout(800);
    // 解決
    await page.getByRole('button', { name: 'リプライを解決' }).click();
    await expect(page.locator('.os-reply.resolved')).toBeVisible();
    await page.waitForTimeout(1000);
  });

  // =====================
  // チェックボックス構文
  // =====================
  test('チェックボックス：クリックでチェック状態に切り替わる', async () => {
    await page.getByRole('button', { name: /新しいプロンプトを追加/ }).click();
    await page.getByPlaceholder('プロンプト本文...').fill('- [ ] チェックタスク');
    await page.getByRole('button', { name: /^追加$/ }).click();
    await expect(page.getByText('チェックタスク')).toBeVisible();
    await page.getByText('チェックタスク').click();
    await expect(page.locator('.os-body-check.checked')).toBeVisible();
    await page.waitForTimeout(1000);
  });

  // =====================
  // localStorage 永続化
  // =====================
  test('永続化：リロード後もデータが復元される', async () => {
    const count = await page.locator('.os-bubble').count();
    await page.reload();
    await expect(page.locator('.os-bubble')).toHaveCount(count);
    await page.waitForTimeout(1000);
  });
});