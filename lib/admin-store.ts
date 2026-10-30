export type RestaurantRecord = { id: string; name: string; description: string; active: boolean }
export type AdminSettings = { notificationEmail: string; whatsappNumber: string; deliveryNote: string }

const globalAdmin = globalThis as typeof globalThis & { plugRestaurants?: RestaurantRecord[]; plugSettings?: AdminSettings }
export const restaurantStore = globalAdmin.plugRestaurants ?? (globalAdmin.plugRestaurants = [
  { id: 'kfc', name: 'KFC', description: 'Classic chicken, burgers and buckets.', active: true },
  { id: 'chickenman', name: 'Chickenman', description: 'Pizza, rice and favourite comfort meals.', active: true },
])
export const settingsStore = globalAdmin.plugSettings ?? (globalAdmin.plugSettings = { notificationEmail: '', whatsappNumber: '233501242319', deliveryNote: 'Delivery is confirmed personally on WhatsApp.' })
