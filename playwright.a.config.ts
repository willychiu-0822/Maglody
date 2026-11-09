import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './e2e', testMatch: 'a-experience.spec.ts', workers: 1,
  timeout: 30000, retries: 0,
  use: { baseURL: 'http://127.0.0.1:4101', channel: 'chrome', colorScheme: 'light', launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] } },
  projects: [ { name: 'mobile', use: { viewport: { width: 390, height: 844 } } }, { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } } ],
  reporter: [['list'], ['./e2e/uat-reporter.ts']],
})
