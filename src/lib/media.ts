// 靈感的媒體（語音、哼唱、照片）存在 IndexedDB：localStorage 太小，也不能放二進位資料。
const DB = 'maglody-media'
const STORE = 'blobs'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE, mode)
      let result: T
      transaction.oncomplete = () => resolve(result)
      transaction.onerror = () => reject(transaction.error ?? new Error('Media transaction failed'))
      transaction.onabort = () => reject(transaction.error ?? new Error('Media transaction aborted'))
      try {
        const request = fn(transaction.objectStore(STORE))
        request.onsuccess = () => { result = request.result }
        request.onerror = () => reject(request.error)
      } catch (error) {
        transaction.abort()
        reject(error)
      }
    })
  } finally {
    db.close()
  }
}

export const putBlob = (id: string, b: Blob) => tx('readwrite', (s) => s.put(b, id))
export const getBlob = (id: string) => tx<Blob | undefined>('readonly', (s) => s.get(id))
export const deleteBlob = (id: string) => tx('readwrite', (s) => s.delete(id))

/** 照片縮到長邊 1280px、轉 JPEG，手機原圖動輒 5MB，縮完約 200KB */
export async function shrinkImage(file: File, max = 1280): Promise<{ blob: Blob; w: number; h: number }> {
  const bmp = await createImageBitmap(file)
  try {
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
    const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k)
    const cv = document.createElement('canvas')
    cv.width = w
    cv.height = h
    const context = cv.getContext('2d')
    if (!context) throw new Error('Image canvas unavailable')
    context.drawImage(bmp, 0, 0, w, h)
    const blob = await new Promise<Blob>((resolve, reject) => cv.toBlob(b => b ? resolve(b) : reject(new Error('Image encoding failed')), 'image/jpeg', 0.85))
    return { blob, w, h }
  } finally {
    bmp.close()
  }
}
