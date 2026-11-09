import { defineConfig } from '@playwright/test'
import uiConfig from './playwright.a.config'
export default defineConfig({
  ...uiConfig, testMatch: '*.spec.ts',
  use: {...uiConfig.use, baseURL:'http://127.0.0.1:4102'},
  webServer: {command:'npm run build && npm run preview -- --host 127.0.0.1 --port 4102 --strictPort',url:'http://127.0.0.1:4102',reuseExistingServer:false,timeout:60000},
  reporter:[['list'],['./e2e/uat-reporter.ts']],
})
