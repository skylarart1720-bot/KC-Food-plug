import fs from 'node:fs'
import path from 'node:path'
import { del as deleteBlob, get, list, put } from '@vercel/blob'

export type Restaurant = 'KFC' | 'Chickenman'

export type Product = {
  id: string
  name: string
  description: string
  price: number
  restaurant: Restaurant
  category?: string
  image: string
  badge?: string
  active: boolean
}

export type Category = {
  id: string
  name: string
  description: string
  image: string
  restaurant: Restaurant | 'Both'
  badge?: string
  active: boolean
}

export type CarouselSlide = {
  id: string
  title: string
  text: string
  image: string
  active: boolean
}

export const defaultProducts: Product[] = []
export const defaultCategories: Category[] = []
export const defaultCarousel: CarouselSlide[] = []

type CatalogSnapshot = { products: Product[]; categories: Category[]; carousel: CarouselSlide[] }
const filePath = path.join(process.cwd(), 'data', 'catalog.json')
const globalCatalog = globalThis as typeof globalThis & { plugCatalog?: CatalogSnapshot }
function cloneDefaults(): CatalogSnapshot { return { products: defaultProducts.map((item) => ({ ...item })), categories: defaultCategories.map((item) => ({ ...item })), carousel: defaultCarousel.map((item) => ({ ...item })) } }
function loadCatalog(): CatalogSnapshot {
  try {
    const saved = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Partial<CatalogSnapshot>
    if (Array.isArray(saved.products) && Array.isArray(saved.categories) && Array.isArray(saved.carousel)) return { ...saved, products: saved.products.map((product) => ({ ...product, active: product.active !== false })) } as CatalogSnapshot
  } catch {}
  return cloneDefaults()
}
export const catalog = globalCatalog.plugCatalog ?? (globalCatalog.plugCatalog = loadCatalog())
export const productStore = catalog.products
export const categoryStore = catalog.categories
export const carouselStore = catalog.carousel
let hydrated = false
let storageReady = false
let mutationQueue = Promise.resolve()
let entityStorageInitialized = false

async function readEntityCollection<T>(prefix: string): Promise<T[] | null> {
  const result = await list({ prefix })
  if (!result.blobs.length) return null
  return Promise.all(result.blobs.map(async (blob) => JSON.parse(await (await fetch(blob.url, { cache: 'no-store' })).text()) as T))
}

async function persistEntityCollection<T extends { id: string }>(prefix: string, before: T[], after: T[], writeAll: boolean) {
  const previous = new Map(before.map((item) => [item.id, JSON.stringify(item)]))
  const current = new Map(after.map((item) => [item.id, JSON.stringify(item)]))
  const existing = await list({ prefix })
  await Promise.all(after.filter((item) => writeAll || previous.get(item.id) !== current.get(item.id)).map((item) => put(`${prefix}/${item.id}.json`, JSON.stringify(item), { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' })))
  if (!writeAll) await Promise.all(existing.blobs.filter((blob) => !current.has(blob.pathname.split('/').pop()?.replace(/\.json$/, '') || '')).map((blob) => deleteBlob(blob.url)))
}

export async function hydrateCatalog(force = false) {
  if (hydrated && !force) return storageReady
  try {
    const [products, categories, carousel] = await Promise.all([
      readEntityCollection<Product>('catalog/products'),
      readEntityCollection<Category>('catalog/categories'),
      readEntityCollection<CarouselSlide>('catalog/carousel'),
    ])
    if (products || categories || carousel) {
      entityStorageInitialized = true
      if (products) catalog.products.splice(0, catalog.products.length, ...products.map((product) => ({ ...product, active: product.active !== false })))
      if (categories) catalog.categories.splice(0, catalog.categories.length, ...categories)
      if (carousel) catalog.carousel.splice(0, catalog.carousel.length, ...carousel)
    } else {
      const blob = await get('catalog.json', { access: 'public' })
      if (blob) {
        const saved = JSON.parse(await new Response(blob.stream).text()) as Partial<CatalogSnapshot>
        if (Array.isArray(saved.products) && Array.isArray(saved.categories) && Array.isArray(saved.carousel)) {
          catalog.products.splice(0, catalog.products.length, ...saved.products.map((product) => ({ ...product, active: product.active !== false })))
          catalog.categories.splice(0, catalog.categories.length, ...saved.categories)
          catalog.carousel.splice(0, catalog.carousel.length, ...saved.carousel)
        }
      }
    }
    storageReady = true
    hydrated = true
    return true
  } catch {
    return false
  }
}

export async function mutateCatalog<T>(mutator: () => Promise<T> | T): Promise<T> {
  let release!: () => void
  const previous = mutationQueue
  mutationQueue = new Promise<void>((resolve) => { release = resolve })
  await previous
  let before: CatalogSnapshot | undefined
  try {
    const loaded = await hydrateCatalog(true)
    if (!loaded && !fs.existsSync(filePath)) throw new Error('Catalog storage is temporarily unavailable. Existing catalog was protected.')
    before = { products: productStore.map((item) => ({ ...item })), categories: categoryStore.map((item) => ({ ...item })), carousel: carouselStore.map((item) => ({ ...item })) }
    const result = await mutator()
    await persistCatalog(before)
    return result
  } catch (error) {
    if (before) {
      productStore.splice(0, productStore.length, ...before.products)
      categoryStore.splice(0, categoryStore.length, ...before.categories)
      carouselStore.splice(0, carouselStore.length, ...before.carousel)
    }
    throw error
  } finally {
    release()
  }
}

export async function persistCatalog(before?: CatalogSnapshot) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await externalizeDataImages()
    const previous = before || { products: [], categories: [], carousel: [] }
    await persistEntityCollection('catalog/products', previous.products, productStore, !entityStorageInitialized)
    await persistEntityCollection('catalog/categories', previous.categories, categoryStore, !entityStorageInitialized)
    await persistEntityCollection('catalog/carousel', previous.carousel, carouselStore, !entityStorageInitialized)
    entityStorageInitialized = true
    await put('catalog.json', JSON.stringify(catalog), { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' })
    return
  }
  if (process.env.VERCEL) throw new Error('Catalog storage is not configured. Connect Vercel Blob storage before saving catalog changes.')
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const temporaryPath = `${filePath}.tmp`
  fs.writeFileSync(temporaryPath, JSON.stringify(catalog, null, 2), 'utf8')
  fs.renameSync(temporaryPath, filePath)
}

async function externalizeDataImages() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return
  const imageEntries = [
    ...catalog.products.map((item) => ({ item, name: 'product' })),
    ...catalog.categories.map((item) => ({ item, name: 'category' })),
    ...catalog.carousel.map((item) => ({ item, name: 'carousel' })),
  ]
  for (const { item, name } of imageEntries) {
    if (!item.image.startsWith('data:')) continue
    const match = item.image.match(/^data:([^;]+);base64,(.+)$/)
    if (!match) continue
    const blob = await put(`images/${name}-${crypto.randomUUID()}`, Buffer.from(match[2], 'base64'), { access: 'public', addRandomSuffix: false, contentType: match[1] })
    item.image = blob.url
  }
}
