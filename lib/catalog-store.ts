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
    if (Array.isArray(saved.products) && Array.isArray(saved.categories) && Array.isArray(saved.carousel)) return saved as CatalogSnapshot
  } catch {}
  return cloneDefaults()
}
export const catalog = globalCatalog.plugCatalog ?? (globalCatalog.plugCatalog = loadCatalog())
export const productStore = catalog.products
export const categoryStore = catalog.categories
export const carouselStore = catalog.carousel
let hydrated = false
export async function hydrateCatalog() {
  if (hydrated) return
  try {
    const blob = await get('catalog.json', { access: 'public' })
    if (blob) {
      const saved = JSON.parse(await new Response(blob.stream).text()) as Partial<CatalogSnapshot>
      if (Array.isArray(saved.products) && Array.isArray(saved.categories) && Array.isArray(saved.carousel)) {
        catalog.products.splice(0, catalog.products.length, ...saved.products)
        catalog.categories.splice(0, catalog.categories.length, ...saved.categories)
        catalog.carousel.splice(0, catalog.carousel.length, ...saved.carousel)
      }
    }
  } catch {}
  hydrated = true
}

export async function persistCatalog() {
  try {
    await put('catalog.json', JSON.stringify(catalog), { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' })
    return
  } catch {}
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const temporaryPath = `${filePath}.tmp`
  fs.writeFileSync(temporaryPath, JSON.stringify(catalog, null, 2), 'utf8')
  fs.renameSync(temporaryPath, filePath)
}
