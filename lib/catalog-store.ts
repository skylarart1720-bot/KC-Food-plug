import fs from 'node:fs'
import path from 'node:path'
import { get, put } from '@vercel/blob'

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
export async function hydrateCatalog(force = false) {
  if (hydrated && !force) return storageReady
  try {
    const blob = await get('catalog.json', { access: 'public' })
    if (blob) {
      const saved = JSON.parse(await new Response(blob.stream).text()) as Partial<CatalogSnapshot>
      if (Array.isArray(saved.products) && Array.isArray(saved.categories) && Array.isArray(saved.carousel)) {
        catalog.products.splice(0, catalog.products.length, ...saved.products.map((product) => ({ ...product, active: product.active !== false })))
        catalog.categories.splice(0, catalog.categories.length, ...saved.categories)
        catalog.carousel.splice(0, catalog.carousel.length, ...saved.carousel)
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
  try {
    const loaded = await hydrateCatalog(true)
    if (!loaded && !fs.existsSync(filePath)) throw new Error('Catalog storage is temporarily unavailable. Existing catalog was protected.')
    const result = await mutator()
    await persistCatalog()
    return result
  } finally {
    release()
  }
}

export async function persistCatalog() {
  try {
    await externalizeDataImages()
    await put('catalog.json', JSON.stringify(catalog), { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' })
    return
  } catch {}
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
