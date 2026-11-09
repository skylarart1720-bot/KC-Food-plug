export type Restaurant = 'KFC' | 'Chickenman'
export type Product = { id: string; name: string; description: string; price: number; restaurant: Restaurant; category?: string; image: string; badge?: string; active: boolean }
export type Category = { id: string; name: string; description: string; image: string; restaurant: Restaurant | 'Both'; badge?: string; active: boolean }
export type CarouselSlide = { id: string; title: string; text: string; image: string; active: boolean }

export const defaultProducts: Product[] = []
export const defaultCategories: Category[] = []
export const defaultCarousel: CarouselSlide[] = []
