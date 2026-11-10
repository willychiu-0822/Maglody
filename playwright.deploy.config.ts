import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './e2e', testMatch: 'deploy-assets.spec.ts', timeout: 45_000,
  reporter: 'list', workers: 1,
  use: { baseURL: 'http://127.0.0.1:4109', channel: 'chrome' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: { command: 'node scripts/deploy-serve.mjs', url: 'http://127.0.0.1:4109', reuseExistingServer: false, timeout: 15_000 },
})
