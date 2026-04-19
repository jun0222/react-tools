import path from 'path';
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  outputDir: path.join(process.env.HOME ?? '.', 'Desktop', 'playwright-results'),
  use: {
    baseURL: 'http://localhost:5173',
    headless: false,   // 目視確認用
    slowMo: 800,       // 1ステップ 0.8秒
    video: 'on',       // 動画を ~/Desktop/playwright-results に保存
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
