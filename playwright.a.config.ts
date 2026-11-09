import { defineConfig } from '@playwright/test'
import config from './playwright.config'
export default defineConfig({...config,testMatch:'a-experience.spec.ts',webServer:undefined,use:{...config.use,baseURL:'http://127.0.0.1:4101'}})
