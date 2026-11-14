/** 能叫出分享表單的手機就分享；不行（桌面）就下載。使用者自己關掉分享表單不算失敗。 */
export async function shareOrDownload(file: File, title: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }
  if (nav.canShare?.({ files: [file] }) && nav.share) {
    try { await nav.share({ files: [file], title }); return 'shared' } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
    }
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(file)
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  return 'downloaded'
}

/** 檔名不能有的字元換掉，空的就用預設名。 */
export const safeFileName = (name: string, fallback: string) => (name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, ' ').trim().slice(0, 40) || fallback)
