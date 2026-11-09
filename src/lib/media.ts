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
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode)
    let r: IDBRequest<T>
    try { r = fn(transaction.objectStore(STORE)) }
    catch (error) { transaction.abort(); db.close(); reject(error); return }
    transaction.oncomplete = () => { db.close(); resolve(r.result) }
    transaction.onabort = transaction.onerror = () => { db.close(); reject(transaction.error ?? r.error) }
    r.onerror = () => { /* transaction reports failure; never resolve before commit */ }
  })
}

export const putBlob = (id: string, b: Blob) => tx('readwrite', (s) => s.put(b, id))
export const getBlob = (id: string) => tx<Blob | undefined>('readonly', (s) => s.get(id))
export const deleteBlob = (id: string) => tx('readwrite', (s) => s.delete(id))

/** 照片縮到長邊 1280px、轉 JPEG，手機原圖動輒 5MB，縮完約 200KB */
export async function shrinkImage(file: File, max = 1280): Promise<{ blob: Blob; w: number; h: number }> {
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k)
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  cv.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
  const blob = await new Promise<Blob>((res) => cv.toBlob((b) => res(b!), 'image/jpeg', 0.85))
  return { blob, w, h }
}
