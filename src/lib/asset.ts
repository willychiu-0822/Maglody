/**
 * public/ 底下的圖（人物、工作室底圖）要跟著網站放的位置走：
 * 放在網域根目錄是 /studio/…，放在子路徑（例如 GitHub Pages 的 /Maglody/）就是 /Maglody/studio/…。
 * 用頁面自己的 baseURI 推出來，不寫死開頭的斜線。
 */
export function asset(path: string): string {
  const rel = path.replace(/^\/+/, '')
  return typeof document === 'undefined' ? `/${rel}` : new URL(rel, document.baseURI).pathname
}
