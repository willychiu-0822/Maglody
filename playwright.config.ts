import { defineConfig } from '@playwright/test'
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
process.env.UAT_RUN_ID ||= stamp
export default defineConfig({
  testDir: './e2e', outputDir: `test-results/${process.env.UAT_RUN_ID}`, timeout: 45_000, expect: { timeout: 7000 },
  fullyParallel: false, workers: 2, retries: 0,
  reporter: [['list'], ['./e2e/reporter.ts']],
  use: {
    baseURL: 'http://localhost:4102', actionTimeout: 8000, navigationTimeout: 10000, channel: 'chrome', colorScheme: 'light',
    permissions: ['microphone'], trace: 'retain-on-failure',
    launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] },
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: 'VITE_AGENT_URL=/api/master npm run build && npm run preview -- --host localhost --port 4102 --strictPort',
    url: 'http://localhost:4102', reuseExistingServer: false, timeout: 60_000,
  },
})
