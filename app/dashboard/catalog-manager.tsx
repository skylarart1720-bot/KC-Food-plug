'use client'

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react'
import type { Category, CarouselSlide, Product, Restaurant } from '../../lib/catalog-store'
import type { AdminSettings, RestaurantRecord } from '../../lib/admin-store'

const emptyProduct = { name: '', description: '', price: '', restaurant: 'KFC' as Restaurant, category: '', image: '', badge: '', active: true }
const emptySlide = { title: '', text: '', image: '' }
const emptyRestaurant = { name: '', description: '' }
const emptyCategory = { name: '', description: '', restaurant: 'Both' as Restaurant | 'Both', image: '', badge: '', active: true }

async function optimizeImage(file: File) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read image.'))
    reader.onerror = () => reject(new Error('Could not read image.'))
    reader.readAsDataURL(file)
  })
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const preview = new Image()
    preview.onload = () => resolve(preview)
    preview.onerror = () => reject(new Error('Could not process image.'))
    preview.src = dataUrl
  })
  const scale = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)
  const optimized = await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not optimize image.')), 'image/jpeg', 0.78))
  const optimizedUrl = URL.createObjectURL(optimized)
  const optimizedDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not prepare image.'))
    reader.onerror = () => reject(new Error('Could not prepare image.'))
    reader.readAsDataURL(optimized)
  })
  URL.revokeObjectURL(optimizedUrl)
  return { file: new File([optimized], 'product-image.jpg', { type: 'image/jpeg' }), dataUrl: optimizedDataUrl }
}

function ImageField({ value, onChange, label = 'Upload image', onUploadingChange }: { value: string; onChange: (value: string) => void; label?: string; onUploadingChange?: (uploading: boolean) => void }) {
  const [localPreview, setLocalPreview] = useState('')
  const [uploading, setUploading] = useState(false)
  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setLocalPreview(URL.createObjectURL(file))
    setUploading(true)
    onUploadingChange?.(true)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onChange(reader.result)
    }
    reader.readAsDataURL(file)
    optimizeImage(file).then(({ file: optimizedFile, dataUrl }) => {
      onChange(dataUrl)
      const formData = new FormData()
      formData.append('file', optimizedFile)
      return fetch('/api/uploads', { method: 'POST', body: formData }).then(async (response) => {
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error || 'Upload failed.')
        setLocalPreview('')
      })
    }).catch((error) => window.alert(error.message)).finally(() => { setUploading(false); onUploadingChange?.(false) })
  }
  return <label className="manager-field">{label}<span className="upload-row"><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={chooseFile} /><small>{uploading ? 'Uploading image…' : 'Choose a local image (max 4.5 MB)'}</small></span>{(localPreview || value) && <img className="manager-image-preview" src={localPreview || value} alt="Selected preview" />}</label>
}

export default function CatalogManager({ mode }: { mode: 'Products' | 'Categories' | 'Carousel media' | 'Restaurants' | 'Settings' }) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [slides, setSlides] = useState<CarouselSlide[]>([])
  const [restaurants, setRestaurants] = useState<RestaurantRecord[]>([])
  const [settings, setSettings] = useState<AdminSettings>({ notificationEmail: '', whatsappNumber: '', deliveryNote: '' })
  const [product, setProduct] = useState(emptyProduct)
  const [slide, setSlide] = useState(emptySlide)
  const [restaurant, setRestaurant] = useState(emptyRestaurant)
  const [category, setCategory] = useState(emptyCategory)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [productImageUploading, setProductImageUploading] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const refreshing = useRef(false)

  function resetProductForm() { setProduct({ ...emptyProduct }); setEditingProductId(null) }
  function resetCategoryForm() { setCategory({ ...emptyCategory }); setEditingCategoryId(null) }
  useEffect(() => {
    if (mode === 'Products') setCategories((items) => items.map((item) => ({ ...item, restaurant: 'Both' as const })))
  }, [mode])

  async function readJson(path: string) {
    let lastError: unknown
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch(path, { cache: 'no-store' })
        if (!response.ok) throw new Error(`Request failed: ${response.status}`)
        return await response.json()
      } catch (error) {
        lastError = error
        await new Promise((resolve) => window.setTimeout(resolve, 250 * (attempt + 1)))
      }
    }
    throw lastError || new Error('Request failed')
  }

  async function refresh() {
    if (refreshing.current) return
    refreshing.current = true
    try {
      if (mode === 'Products' || mode === 'Categories') {
        const [productsResult, categoriesResult] = await Promise.allSettled([readJson('/api/products'), readJson('/api/categories')])
        if (productsResult.status === 'fulfilled' && Array.isArray(productsResult.value.products)) setProducts(productsResult.value.products)
        if (categoriesResult.status === 'fulfilled' && Array.isArray(categoriesResult.value.categories)) setCategories(categoriesResult.value.categories)
        if (productsResult.status === 'rejected' && categoriesResult.status === 'rejected') throw productsResult.reason
      } else if (mode === 'Carousel media') {
        const payload = await readJson('/api/carousel')
        if (Array.isArray(payload.slides)) setSlides(payload.slides)
      } else if (mode === 'Restaurants') {
        const payload = await readJson('/api/restaurants')
        if (Array.isArray(payload.restaurants)) setRestaurants(payload.restaurants)
      } else {
        const payload = await readJson('/api/settings')
        if (payload.settings) setSettings(payload.settings)
      }
    } finally {
      refreshing.current = false
    }
  }
  useEffect(() => {
    refresh().catch(() => {})
    if (!['Products', 'Categories'].includes(mode)) return
    const timer = window.setInterval(() => refresh().catch(() => {}), 3000)
    return () => window.clearInterval(timer)
  }, [mode])
  useEffect(() => { if (mode === 'Categories') { const form = document.querySelector('.category-manager-form'); form?.setAttribute('novalidate', 'true'); form?.querySelectorAll('textarea, input[type="file"]').forEach((field) => field.removeAttribute('required')) } }, [mode])

  async function saveProduct(event: FormEvent) {
    event.preventDefault()
    if (productImageUploading) { setMessage('Please wait for the product image to finish processing.'); return }
    if (!product.image) { setMessage('Upload a product image from your device before saving.'); return }
    const editing = Boolean(editingProductId)
    const response = await fetch(editing ? `/api/products/${editingProductId}` : '/api/products', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...product, price: Number(product.price) }) })
    const result = await response.json().catch(() => null)
    setMessage(response.ok ? (editing ? 'Product updated on the storefront.' : 'Product added to the storefront.') : (result?.error || 'Product could not be saved.'))
    if (response.ok) { resetProductForm(); refresh() }
  }

  async function saveCategory(event: FormEvent) {
    event.preventDefault()
    const editing = Boolean(editingCategoryId)
    const response = await fetch(editing ? `/api/categories/${editingCategoryId}` : '/api/categories', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(category) })
    setMessage(response.ok ? (editing ? 'Category updated.' : 'Category created.') : 'Category could not be saved.')
    if (response.ok) { resetCategoryForm(); refresh() }
  }

  async function addSlide(event: FormEvent) {
    event.preventDefault()
    const response = await fetch('/api/carousel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(slide) })
    setMessage(response.ok ? 'Carousel slide added.' : 'Carousel slide could not be added.')
    if (response.ok) { setSlide(emptySlide); refresh() }
  }

  async function addRestaurant(event: FormEvent) {
    event.preventDefault()
    const response = await fetch('/api/restaurants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(restaurant) })
    setMessage(response.ok ? 'Restaurant added.' : 'Restaurant could not be added.')
    if (response.ok) { setRestaurant(emptyRestaurant); refresh() }
  }

  async function saveSettings(event: FormEvent) {
    event.preventDefault()
    const response = await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
    setMessage(response.ok ? 'Settings saved.' : 'Settings could not be saved.')
  }

  async function toggleProduct(item: Product) { await fetch(`/api/products/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !item.active }) }); refresh() }
  async function deleteProduct(id: string) { await fetch(`/api/products/${id}`, { method: 'DELETE' }); refresh() }
  async function toggleCategory(item: Category) { await fetch(`/api/categories/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !item.active }) }); refresh() }
  async function deleteCategory(id: string) { await fetch(`/api/categories/${id}`, { method: 'DELETE' }); refresh() }
  async function toggleSlide(item: CarouselSlide) { await fetch(`/api/carousel/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !item.active }) }); refresh() }
  async function deleteSlide(id: string) { await fetch(`/api/carousel/${id}`, { method: 'DELETE' }); refresh() }
  async function toggleRestaurant(item: RestaurantRecord) { await fetch(`/api/restaurants/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !item.active }) }); refresh() }
  async function deleteRestaurant(id: string) { await fetch(`/api/restaurants/${id}`, { method: 'DELETE' }); refresh() }
  function editProduct(item: Product) { setEditingProductId(item.id); setProduct({ name: item.name, description: item.description, price: String(item.price), restaurant: item.restaurant, category: item.category || '', image: item.image, badge: item.badge || '', active: item.active }); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function editCategory(item: Category) { setEditingCategoryId(item.id); setCategory({ name: item.name, description: item.description, restaurant: item.restaurant, image: item.image, badge: item.badge || '', active: item.active }); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  async function editSlide(item: CarouselSlide) { const title = window.prompt('Slide title', item.title); const text = window.prompt('Supporting text', item.text); if (!title) return; await fetch(`/api/carousel/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, text: text || '' }) }); refresh() }
  async function editRestaurant(item: RestaurantRecord) { const name = window.prompt('Restaurant name', item.name); const description = window.prompt('Description', item.description); if (!name) return; await fetch(`/api/restaurants/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description: description || '' }) }); refresh() }

  if (mode === 'Categories') return <section className="admin-panel manager-panel"><div className="panel-heading"><div><p className="admin-kicker">STOREFRONT NAVIGATION</p><h2>{editingCategoryId ? 'Edit category' : 'Categories'}</h2></div><span>{categories.length} total</span></div><form className="manager-form category-manager-form" onSubmit={saveCategory}><input value={category.name} onChange={(e) => setCategory({ ...category, name: e.target.value })} placeholder="Category name" required /><label className="manager-field">Category description<textarea value={category.description} onChange={(e) => setCategory({ ...category, description: e.target.value })} placeholder="Describe what customers will find here." required /></label><select value={category.restaurant} onChange={(e) => setCategory({ ...category, restaurant: e.target.value as Category['restaurant'] })}><option value="Both">KFC + Chickenman</option><option value="KFC">KFC only</option><option value="Chickenman">Chickenman only</option></select><input value={category.badge} onChange={(e) => setCategory({ ...category, badge: e.target.value })} placeholder="Badge (e.g. Popular)" /><ImageField value={category.image} onChange={(image) => setCategory({ ...category, image })} label="Category cover image" /><label className="manager-check"><input type="checkbox" checked={category.active} onChange={(e) => setCategory({ ...category, active: e.target.checked })} /> Show as a storefront category</label><div className="manager-form-actions"><button className="admin-button" type="submit">{editingCategoryId ? 'Save category' : 'Create category'}</button>{editingCategoryId && <button className="manager-cancel" type="button" onClick={resetCategoryForm}>Cancel edit</button>}</div></form><div className="manager-grid category-manager-grid">{categories.map((item) => <article className={`manager-card category-manager-card ${!item.active ? 'inactive' : ''}`} key={item.id}><img src={item.image} alt="" /><div><b>{item.name}</b><p>{item.restaurant} · {products.filter((product) => product.category === item.id).length} products</p><small>{item.description}</small></div><div className="manager-actions"><button onClick={() => editCategory(item)}>Edit</button><button onClick={() => toggleCategory(item)}>{item.active ? 'Hide' : 'Show'}</button><button onClick={() => deleteCategory(item.id)}>Delete</button></div></article>)}</div>{message && <p className="manager-message">{message}</p>}</section>

  if (mode === 'Settings') return <section className="admin-panel manager-panel"><div className="panel-heading"><div><p className="admin-kicker">SYSTEM SETTINGS</p><h2>Settings</h2></div><span>Live configuration</span></div><form className="manager-form settings-form" onSubmit={saveSettings}><input value={settings.notificationEmail} onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })} type="email" placeholder="Notification email" /><input value={settings.whatsappNumber} onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })} placeholder="WhatsApp number" /><textarea value={settings.deliveryNote} onChange={(e) => setSettings({ ...settings, deliveryNote: e.target.value })} placeholder="Delivery note" /><button className="admin-button" type="submit">Save settings</button></form>{message && <p className="manager-message">{message}</p>}</section>

  if (mode === 'Restaurants') return <section className="admin-panel manager-panel"><div className="panel-heading"><div><p className="admin-kicker">PARTNER MENUS</p><h2>Restaurants</h2></div><span>{restaurants.length} total</span></div><form className="manager-form" onSubmit={addRestaurant}><input value={restaurant.name} onChange={(e) => setRestaurant({ ...restaurant, name: e.target.value })} placeholder="Restaurant name" required /><input value={restaurant.description} onChange={(e) => setRestaurant({ ...restaurant, description: e.target.value })} placeholder="Description" /><button className="admin-button" type="submit">Add restaurant</button></form><div className="manager-grid">{restaurants.map((item) => <article className={`manager-card ${!item.active ? 'inactive' : ''}`} key={item.id}><span className="restaurant-logo orange">{item.name.slice(0, 2).toUpperCase()}</span><div><b>{item.name}</b><p>{item.description}</p></div><div className="manager-actions"><button onClick={() => editRestaurant(item)}>Edit</button><button onClick={() => toggleRestaurant(item)}>{item.active ? 'Hide' : 'Show'}</button><button onClick={() => deleteRestaurant(item.id)}>Delete</button></div></article>)}</div>{message && <p className="manager-message">{message}</p>}</section>

  if (mode === 'Carousel media') return <section className="admin-panel manager-panel"><div className="panel-heading"><div><p className="admin-kicker">STOREFRONT CONTENT</p><h2>Carousel media</h2></div><span>{slides.length} slides</span></div><form className="manager-form" onSubmit={addSlide}><input value={slide.title} onChange={(e) => setSlide({ ...slide, title: e.target.value })} placeholder="Slide title" /><input value={slide.text} onChange={(e) => setSlide({ ...slide, text: e.target.value })} placeholder="Supporting text" /><ImageField value={slide.image} onChange={(image) => setSlide({ ...slide, image })} /><button className="admin-button" type="submit">Add slide</button></form><div className="manager-grid">{slides.map((item) => <article className={`manager-card ${!item.active ? 'inactive' : ''}`} key={item.id}><img src={item.image} alt="" /><div><b>{item.title}</b><p>{item.text}</p></div><div className="manager-actions"><button onClick={() => editSlide(item)}>Edit</button><button onClick={() => toggleSlide(item)}>{item.active ? 'Hide' : 'Show'}</button><button onClick={() => deleteSlide(item.id)}>Delete</button></div></article>)}</div>{message && <p className="manager-message">{message}</p>}</section>

  return <section className="admin-panel manager-panel"><div className="panel-heading"><div><p className="admin-kicker">CATALOGUE EDITOR</p><h2>{editingProductId ? 'Edit product' : 'Products'}</h2></div><span>{products.length} total</span></div><form className="manager-form product-manager-form" onSubmit={saveProduct}><input value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} placeholder="Product name" required /><label className="manager-field">Product description<textarea value={product.description} onChange={(e) => setProduct({ ...product, description: e.target.value })} placeholder="Tell customers what is inside, portion size, flavour and what makes it special." required /></label><input value={product.price} onChange={(e) => setProduct({ ...product, price: e.target.value })} type="number" min="0" step="0.01" placeholder="Price" required /><select value={product.restaurant} onChange={(e) => setProduct({ ...product, restaurant: e.target.value as Restaurant })}><option>KFC</option><option>Chickenman</option></select><select value={product.category} onChange={(e) => setProduct({ ...product, category: e.target.value })}><option value="">No category — use restaurant store</option>{categories.filter((item) => item.active && (item.restaurant === 'Both' || item.restaurant === product.restaurant)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input value={product.badge} onChange={(e) => setProduct({ ...product, badge: e.target.value })} placeholder="Badge (e.g. Best seller)" /><ImageField value={product.image} onChange={(image) => setProduct({ ...product, image })} /><label className="manager-check"><input type="checkbox" checked={product.active} onChange={(e) => setProduct({ ...product, active: e.target.checked })} /> Visible on storefront</label><div className="manager-form-actions"><button className="admin-button" type="submit">{editingProductId ? 'Save product' : 'Add product'}</button>{editingProductId && <button className="manager-cancel" type="button" onClick={resetProductForm}>Cancel edit</button>}</div></form><div className="manager-grid product-manager-grid">{products.map((item) => <article className={`manager-card ${!item.active ? 'inactive' : ''}`} key={item.id}><img src={item.image} alt="" /><div><b>{item.name}</b><p>{item.restaurant} · {categories.find((category) => category.id === item.category)?.name || 'Restaurant store'} · GH₵ {item.price.toFixed(2)}</p><small>{item.description}</small></div><div className="manager-actions"><button onClick={() => editProduct(item)}>Edit all details</button><button onClick={() => toggleProduct(item)}>{item.active ? 'Hide' : 'Show'}</button><button onClick={() => deleteProduct(item.id)}>Delete</button></div></article>)}</div>{message && <p className="manager-message">{message}</p>}</section>
}
