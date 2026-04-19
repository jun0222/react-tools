# react-tools 開発方針

## プロジェクト概要

React + Vite + TypeScript で構築したテキスト処理ツール集。
ルート `/` にホーム画面、各ツールはサブルートに配置する。

```
src/
  config/       # アプリ全体の静的設定（ページメタ等）
  context/      # グローバル状態（Theme, Meta）
  home/         # トップページ
  tools/
    oneshot/    # プロンプト管理ツール
    phantom/    # テキストマスクツール
e2e/            # Playwright E2E テスト
```

---

## テスト方針

### TDD（テストファースト）

**必ずテストを先に書いてから実装する。**
赤 → 緑 → リファクタの順で進める。テストが失敗することを確認してから実装に入ること。

### BDD スタイルの命名

テスト名は日本語で振る舞いを記述する。

```typescript
describe('ThemeContext', () => {
  it('localStorage に "light" があるときライトモードで初期化される', () => { ... });
  it('toggleTheme でダーク→ライトに切り替わる', () => { ... });
});
```

### テスト種別と役割

4種類のテストを使い分ける。

#### 1. Vitest — BDD 振る舞いテスト
ロジック・コンポーネントの振る舞いを日本語で記述する。ユニットテスト・インテグレーションテストの主力。

- ツール: Vitest + Testing Library (`renderHook`, `render`, `userEvent`)
- 場所: 対象ファイルと同ディレクトリ（コロケーション）
- 命名: `describe` / `it` を日本語で、「〜のとき〜になる」形式

#### 2. Vitest — UI スナップショットテスト
コンポーネントの HTML 構造を記録し、意図しない DOM 変更を検知する。

- ツール: Vitest `toMatchSnapshot()`
- 場所: `src/snapshot.test.tsx`（全画面を1ファイルにまとめる）
- 検知できるもの: クラス名の変更・要素の追加削除・属性の変化

#### 3. Playwright — E2E テスト
実ブラウザで画面操作をシナリオとして検証する。状態遷移・ナビゲーション・ユーザー操作が対象。

- ツール: Playwright (`test.describe.serial` + 共有 `page`)
- 場所: `e2e/*.spec.ts`（スナップショット系とは別ファイル）
- 特徴: 同一ブラウザで連続実行、`slowMo: 800` で人間が目視できる速度

#### 4. Playwright — ビジュアルリグレッションテスト
スクリーンショットをピクセル単位で比較し、CSS・レイアウトの変化を検知する。

- ツール: Playwright `toHaveScreenshot()`
- 場所: `e2e/snapshot.spec.ts`
- 検知できるもの: 色・余白・フォント・レイアウトずれなど DOM では見えない視覚変化
- ベースライン更新: `npx playwright test e2e/snapshot.spec.ts --update-snapshots`

---

| 種別 | ツール | 検知対象 | 場所 |
|------|--------|----------|------|
| BDD 振る舞いテスト | Vitest + Testing Library | ロジック・DOM操作の振る舞い | `src/**/*.test.tsx` |
| UI スナップショット | Vitest `toMatchSnapshot` | HTML 構造の変化 | `src/snapshot.test.tsx` |
| E2E | Playwright | 画面操作・状態遷移 | `e2e/*.spec.ts` |
| ビジュアルリグレッション | Playwright `toHaveScreenshot` | 視覚的な見た目の変化 | `e2e/snapshot.spec.ts` |

### E2E テストの書き方

- **必ず `test.describe.serial` + 共有 `page`** で同一ブラウザを使い続ける
- テスト間でブラウザを閉じ・開きしない（人間が目視できる連続実行にする）
- `test.afterAll` で `waitForTimeout(2000)` を入れて最後の画面を確認できるようにする
- vitest が E2E ファイルを拾わないよう `vite.config.ts` の `exclude: ['e2e/**']` を維持する

### slowMo について

`playwright.config.ts` の `use.slowMo` で全操作に一律の遅延を挟める（現在 **800ms**）。
これが「人間が目視できる」テストを実現する主な手段。

```ts
use: {
  headless: false,  // ブラウザを表示
  slowMo: 800,      // クリック・入力など1ステップごとに 0.8 秒待つ
}
```

- `waitForTimeout` は「この画面を見せたい」ときの追加待機。`slowMo` と役割が違う
- CI など目視不要な環境では `headless: true` + `slowMo: 0` に変えて高速化できる
- `slowMo` を変えたら既存テストの `waitForTimeout` 値が過剰・不足にならないか確認する

```typescript
let page: Page;

test.describe.serial('機能名 E2E', () => {
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

  test('〜のとき〜になる', async () => {
    // ...
    await page.waitForTimeout(600); // 人間が確認できる間隔
  });
});
```

### スナップショット更新コマンド

```bash
# DOM スナップショット
npx vitest run src/snapshot.test.tsx -u

# ビジュアルスナップショット（ベースライン再生成）
npx playwright test e2e/snapshot.spec.ts --update-snapshots
```

---

## 実装方針：KISS ファースト

### 基本ルール

**実装方法の指定がないときは、常に最もシンプルな方法を選ぶ。**
複雑さはバグの温床。読みやすく、テストしやすく、後から変えやすいコードを優先する。

- 将来への備えより「今動くこと」を優先する
- 抽象化・汎用化は3回同じことを書いてから考える
- エラーハンドリング・バリデーションは本当に必要な境界にだけ書く
- ヘルパー・ユーティリティは1回しか使わないなら作らない

### how が指定されたときはそれに従う

ユーザーが実装方法を明示した場合（例: Phantom の KMP + LCG）は、たとえ複雑でも指示に従う。
how の指定 = 技術的な意図や学習目的がある。勝手にシンプル版に変えない。

### バグりやすい機能の依頼が来たとき

複雑さやバグリスクを感じたら、実装に入る前に立ち止まって次のいずれかを提案する。

**① そのまま実装する**
要件が明確で実現可能なら進める。

**② 一緒に小さく進める**
要件が曖昧・スコープが大きいときは、最初の一歩だけ合意してから動く。

> 「まず〇〇だけ動かして、次に△△を足す形で進めましょうか？」

**③ KISSスリム版を提案する**
本来の目的を達成できる、よりシンプルな代替案を出す。

> 「KMP + LCG で実装もできますが、この用途なら `String.replace` + `Math.random` でも同じ結果になりそうです。どちらにしますか？」

どれを選ぶかはユーザーが決める。提案したあとは黙って待つ。

---

## グローバル状態の設計方針

複数画面にまたがる状態は React Context で管理する。prop drilling 禁止。

### 現在のグローバルコンテキスト

| Context | ファイル | 役割 |
|---------|----------|------|
| `ThemeProvider` | `src/context/ThemeContext.tsx` | ダーク/ライトテーマ。`localStorage` キー: `oneshot-theme` |
| `MetaProvider` | `src/context/MetaContext.tsx` | `document.title` と `meta[name="description"]` の動的更新 |

### 新しいページを追加するとき

1. `src/config/pageMeta.ts` の `PAGE_META` にパスとメタ情報を追加する
2. `src/App.tsx` の `<Routes>` にルートを追加する
3. `src/home/Home.tsx` の `tools` 配列にカードを追加する
4. コンポーネント内では `useTheme()` でテーマを取得し、ルート要素に `.dark` / `.light` クラスを付与する
5. CSS はダークをデフォルト、`.root.light` でオーバーライドする構成にする

---

## CSS 設計方針

- ダークモードをデフォルトとして書く
- ライトモードは `.コンポーネントroot.light` スコープで上書きする

```css
/* デフォルト（ダーク） */
.ph-root { background: #0d0d14; color: #e0e0e0; }

/* ライト上書き */
.ph-root.light { background: #f4f6fa; color: #1a2030; }
.ph-root.light .ph-panel { background: #fff; }
```

---

## アルゴリズム方針（Phantom）

- **置換**: KMP（Knuth-Morris-Pratt）によるサブストリングマッチング
- **ランダム変換**: LCG（Linear Congruential Generator）による疑似乱数 + 文字クラス維持
  - `targetStr` はキャラクタセットではなく **部分文字列** として KMP で検索する
  - マッチした部分のみをランダム化し、それ以外は変更しない
  - 変換後の文字は元の文字と同じ文字クラス（小文字→小文字、ひらがな→ひらがな等）

---

## TypeScript

- `npx tsc -b` でエラー 0 を維持する
- 型は使う場所の近くに定義する。共有が必要な型はコアファイル（`phantomCore.ts` 等）に置く

---

## コロケーション方針

参考: https://kentcdodds.com/blog/colocation

**コードは、それを使う場所の近くに置く。** 関係ないものを遠ざけ、関係あるものを近づける。

### 具体的なルール

- テストファイルは対象コンポーネントと同じディレクトリに置く（`tools/oneshot/OneShot.test.tsx`）
- CSS はそのコンポーネントだけが使うなら同ディレクトリに置く（`Phantom.css`）
- 型定義は使う場所の近くに書く。複数ファイルをまたぐときだけコアファイルに移す
- カスタムフックはそのツール専用なら同ディレクトリに置く（`usePhantom.ts`）
- 複数のページ・ツールで共有するものだけ `context/` や `config/` に上げる

### やらないこと

- `types/` `utils/` `hooks/` のような「種類別」のグローバルフォルダを作って全部そこに入れる
- 1か所でしか使わないのに共通化のために上に移す
- テストを `__tests__/` に集約する

```
tools/
  phantom/
    Phantom.tsx        # コンポーネント
    Phantom.css        # このコンポーネント専用スタイル
    Phantom.test.tsx   # このコンポーネントのテスト
    phantomCore.ts     # ロジック（Phantomだけが使う）
    usePhantom.ts      # フック（Phantomだけが使う）
```

---

## 命名・ファイル構成

- ツールのロジックはカスタムフック（`useXxx.ts`）またはコアファイル（`xxxCore.ts`）に分離する
- コンポーネントと同名のファイルが競合する場合（macOS の case-insensitive FS）はサフィックスで区別する（例: `phantomCore.ts`）
- E2E スペックは `e2e/` 配下、ユニットテストは対象ファイルと同ディレクトリに置く
