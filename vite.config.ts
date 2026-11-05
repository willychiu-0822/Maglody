import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// 手機測試麥克風需要 https：`npm run dev:mobile` 會開自簽憑證並對區網開放
const https = process.env.HTTPS === '1'

export default defineConfig({
  plugins: [react(), ...(https ? [basicSsl()] : [])],
  base: './',
  server: { host: https ? true : undefined },
})
