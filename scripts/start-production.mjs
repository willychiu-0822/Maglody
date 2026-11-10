// 跨平台的 production 啟動。NODE_ENV 要在載入伺服器前設好，靜態檔才會打開。
// 不要把 NODE_ENV=production 設進主機的「建置」環境，否則 npm 會略過 vite / typescript。
process.env.NODE_ENV = 'production'
await import('../server/index.ts')
