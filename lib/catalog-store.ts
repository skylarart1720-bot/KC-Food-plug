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

export const defaultProducts: Product[] = [
  { id: 'kfc-bucket', name: 'Streetwise Bucket', description: 'Crispy chicken, chips and a cool drink for the table.', price: 115, restaurant: 'KFC', category: 'buckets', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=900&q=85', badge: 'Fan favourite', active: true },
  { id: 'kfc-burger', name: 'Zinger Burger', description: 'Hot & crispy chicken, fresh lettuce and signature sauce.', price: 72, restaurant: 'KFC', category: 'burgers', image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=900&q=85', active: true },
  { id: 'kfc-wings', name: 'Hot Wings', description: 'Tender, fiery wings made for sharing.', price: 58, restaurant: 'KFC', category: 'chicken', image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=900&q=85', badge: 'Spicy', active: true },
  { id: 'cm-pizza', name: 'Chickenman Special', description: 'Loaded pizza with chicken, peppers, onions and cheese.', price: 98, restaurant: 'Chickenman', category: 'pizza', image: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=900&q=85', badge: 'Best seller', active: true },
  { id: 'cm-fried-rice', name: 'Chicken Fried Rice', description: 'Fragrant fried rice, tender chicken and fresh vegetables.', price: 65, restaurant: 'Chickenman', category: 'meals', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=85', active: true },
  { id: 'cm-wings', name: 'Chickenman Wings', description: 'Crispy glazed wings with your choice of heat.', price: 68, restaurant: 'Chickenman', category: 'chicken', image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=900&q=85', active: true },
]

export const defaultCategories: Category[] = [
  { id: 'buckets', name: 'Buckets', description: 'Big sharing boxes for the whole table.', image: defaultProducts[0].image, restaurant: 'Both', badge: 'Shareable', active: true },
  { id: 'burgers', name: 'Burgers', description: 'Crispy, saucy favourites made to satisfy.', image: defaultProducts[1].image, restaurant: 'Both', active: true },
  { id: 'chicken', name: 'Chicken', description: 'Golden, crispy chicken with serious flavour.', image: defaultProducts[2].image, restaurant: 'Both', badge: 'Fan favourite', active: true },
  { id: 'pizza', name: 'Pizza', description: 'Loaded slices with Chickenman energy.', image: defaultProducts[3].image, restaurant: 'Both', active: true },
  { id: 'meals', name: 'Meals', description: 'Complete plates when you want the full plug.', image: defaultProducts[4].image, restaurant: 'Both', active: true },
]

export const defaultCarousel: CarouselSlide[] = [
  { id: 'crispy-comfort', title: 'Crispy comfort', text: 'Big flavour, straight to your door.', image: defaultProducts[0].image, active: true },
  { id: 'hot-fresh', title: 'Hot, fresh, plugged in', text: 'KFC classics and Chickenman favourites.', image: defaultProducts[3].image, active: true },
  { id: 'share-good-stuff', title: 'Share the good stuff', text: 'Build one basket from both menus.', image: defaultProducts[5].image, active: true },
]

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
  if (hydrated || !process.env.BLOB_READ_WRITE_TOKEN) return
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
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await put('catalog.json', JSON.stringify(catalog), { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' })
    return
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const temporaryPath = `${filePath}.tmp`
  fs.writeFileSync(temporaryPath, JSON.stringify(catalog, null, 2), 'utf8')
  fs.renameSync(temporaryPath, filePath)
}
