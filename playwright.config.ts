import path from 'path';
import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  // ビジュアルリグレッション(snapshot.spec.ts)はheaded/headlessの描画差だけで
  // ピクセルズレが発生するため、CI(ヘッドレス)では除外しローカル専用にする
  testIgnore: isCI ? '**/snapshot.spec.ts' : undefined,
  timeout: 30_000,
  outputDir: isCI
    ? 'playwright-results'
    : path.join(process.env.HOME ?? '.', 'Desktop', 'playwright-results'),
  use: {
    baseURL: 'http://localhost:5173',
    headless: isCI ? true : false,   // CIではヘッドレス、ローカルは目視確認用
    slowMo: isCI ? 0 : 800,          // CIでは待機なし、ローカルは1ステップ0.8秒
    video: isCI ? 'retain-on-failure' : 'on',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 15_000,
  },
});
