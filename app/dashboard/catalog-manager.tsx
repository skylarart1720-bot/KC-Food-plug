'use client'

import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import type { CarouselSlide, Product, Restaurant } from '../../lib/catalog-store'
import type { AdminSettings, RestaurantRecord } from '../../lib/admin-store'

const emptyProduct = { name: '', description: '', price: '', restaurant: 'KFC' as Restaurant, category: 'Meals', image: '', badge: '', active: true }
const emptySlide = { title: '', text: '', image: '' }
const emptyRestaurant = { name: '', description: '' }

function ImageField({ value, onChange, label = 'Image URL or local file' }: { value: string; onChange: (value: string) => void; label?: string }) {
  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange(String(reader.result))
    reader.readAsDataURL(file)
  }
  return <label className="manager-field">{label}<input value={value.startsWith('data:') ? '' : value} onChange={(event) => onChange(event.target.value)} placeholder="https://..." /><span className="upload-row"><input type="file" accept="image/*" onChange={chooseFile} /><small>or choose a local image</small></span>{value && <img className="manager-image-preview" src={value} alt="Selected preview" />}</label>
}

export default function CatalogManager({ mode }: { mode: 'Products' | 'Carousel media' | 'Restaurants' | 'Settings' }) {
  const [products, setProducts] = useState<Product[]>([])
  const [slides, setSlides] = useState<CarouselSlide[]>([])
  const [restaurants, setRestaurants] = useState<RestaurantRecord[]>([])
  const [settings, setSettings] = useState<AdminSettings>({ notificationEmail: '', whatsappNumber: '', deliveryNote: '' })
  const [product, setProduct] = useState(emptyProduct)
  const [slide, setSlide] = useState(emptySlide)
  const [restaurant, setRestaurant] = useState(emptyRestaurant)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  function resetProductForm() { setProduct({ ...emptyProduct }); setEditingProductId(null) }

  async function refresh() {
    if (mode === 'Products') setProducts((await (await fetch('/api/products', { cache: 'no-store' })).json()).products || [])
    else if (mode === 'Carousel media') setSlides((await (await fetch('/api/carousel', { cache: 'no-store' })).json()).slides || [])
    else if (mode === 'Restaurants') setRestaurants((await (await fetch('/api/restaurants', { cache: 'no-store' })).json()).restaurants || [])
    else setSettings((await (await fetch('/api/settings', { cache: 'no-store' })).json()).settings || settings)
  }
  useEffect(() => { refresh().catch(() => setMessage('Could not load content.')) }, [mode])

  async function saveProduct(event: FormEvent) {
    event.preventDefault()
    const editing = Boolean(editingProductId)
    const response = await fetch(editing ? `/api/products/${editingProductId}` : '/api/products', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...product, price: Number(product.price) }) })
    setMessage(response.ok ? (editing ? 'Product updated on the storefront.' : 'Product added to the storefront.') : 'Product could not be saved.')
    if (response.ok) { resetProductForm(); refresh() }
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
  async function toggleSlide(item: CarouselSlide) { await fetch(`/api/carousel/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !item.active }) }); refresh() }
  async function deleteSlide(id: string) { await fetch(`/api/carousel/${id}`, { method: 'DELETE' }); refresh() }
  async function toggleRestaurant(item: RestaurantRecord) { await fetch(`/api/restaurants/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !item.active }) }); refresh() }
  async function deleteRestaurant(id: string) { await fetch(`/api/restaurants/${id}`, { method: 'DELETE' }); refresh() }
  function editProduct(item: Product) { setEditingProductId(item.id); setProduct({ name: item.name, description: item.description, price: String(item.price), restaurant: item.restaurant, category: item.category, image: item.image, badge: item.badge || '', active: item.active }); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  async function editSlide(item: CarouselSlide) { const title = window.prompt('Slide title', item.title); const image = window.prompt('Image URL or data image', item.image); if (!title || !image) return; await fetch(`/api/carousel/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, image }) }); refresh() }
  async function editRestaurant(item: RestaurantRecord) { const name = window.prompt('Restaurant name', item.name); const description = window.prompt('Description', item.description); if (!name) return; await fetch(`/api/restaurants/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description: description || '' }) }); refresh() }

  if (mode === 'Settings') return <section className="admin-panel manager-panel"><div className="panel-heading"><div><p className="admin-kicker">SYSTEM SETTINGS</p><h2>Settings</h2></div><span>Live configuration</span></div><form className="manager-form settings-form" onSubmit={saveSettings}><input value={settings.notificationEmail} onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })} type="email" placeholder="Notification email" /><input value={settings.whatsappNumber} onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })} placeholder="WhatsApp number" /><textarea value={settings.deliveryNote} onChange={(e) => setSettings({ ...settings, deliveryNote: e.target.value })} placeholder="Delivery note" /><button className="admin-button" type="submit">Save settings</button></form>{message && <p className="manager-message">{message}</p>}</section>

  if (mode === 'Restaurants') return <section className="admin-panel manager-panel"><div className="panel-heading"><div><p className="admin-kicker">PARTNER MENUS</p><h2>Restaurants</h2></div><span>{restaurants.length} total</span></div><form className="manager-form" onSubmit={addRestaurant}><input value={restaurant.name} onChange={(e) => setRestaurant({ ...restaurant, name: e.target.value })} placeholder="Restaurant name" required /><input value={restaurant.description} onChange={(e) => setRestaurant({ ...restaurant, description: e.target.value })} placeholder="Description" /><button className="admin-button" type="submit">Add restaurant</button></form><div className="manager-grid">{restaurants.map((item) => <article className={`manager-card ${!item.active ? 'inactive' : ''}`} key={item.id}><span className="restaurant-logo orange">{item.name.slice(0, 2).toUpperCase()}</span><div><b>{item.name}</b><p>{item.description}</p></div><div className="manager-actions"><button onClick={() => editRestaurant(item)}>Edit</button><button onClick={() => toggleRestaurant(item)}>{item.active ? 'Hide' : 'Show'}</button><button onClick={() => deleteRestaurant(item.id)}>Delete</button></div></article>)}</div>{message && <p className="manager-message">{message}</p>}</section>

  if (mode === 'Carousel media') return <section className="admin-panel manager-panel"><div className="panel-heading"><div><p className="admin-kicker">STOREFRONT CONTENT</p><h2>Carousel media</h2></div><span>{slides.length} slides</span></div><form className="manager-form" onSubmit={addSlide}><input value={slide.title} onChange={(e) => setSlide({ ...slide, title: e.target.value })} placeholder="Slide title" /><input value={slide.text} onChange={(e) => setSlide({ ...slide, text: e.target.value })} placeholder="Supporting text" /><ImageField value={slide.image} onChange={(image) => setSlide({ ...slide, image })} /><button className="admin-button" type="submit">Add slide</button></form><div className="manager-grid">{slides.map((item) => <article className={`manager-card ${!item.active ? 'inactive' : ''}`} key={item.id}><img src={item.image} alt="" /><div><b>{item.title}</b><p>{item.text}</p></div><div className="manager-actions"><button onClick={() => editSlide(item)}>Edit</button><button onClick={() => toggleSlide(item)}>{item.active ? 'Hide' : 'Show'}</button><button onClick={() => deleteSlide(item.id)}>Delete</button></div></article>)}</div>{message && <p className="manager-message">{message}</p>}</section>

  return <section className="admin-panel manager-panel"><div className="panel-heading"><div><p className="admin-kicker">CATALOGUE EDITOR</p><h2>{editingProductId ? 'Edit product' : 'Products'}</h2></div><span>{products.length} total</span></div><form className="manager-form product-manager-form" onSubmit={saveProduct}><input value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} placeholder="Product name" required /><label className="manager-field">Product description<textarea value={product.description} onChange={(e) => setProduct({ ...product, description: e.target.value })} placeholder="Tell customers what is inside, portion size, flavour and what makes it special." required /></label><input value={product.price} onChange={(e) => setProduct({ ...product, price: e.target.value })} type="number" min="0" step="0.01" placeholder="Price" required /><select value={product.restaurant} onChange={(e) => setProduct({ ...product, restaurant: e.target.value as Restaurant })}><option>KFC</option><option>Chickenman</option></select><input value={product.category} onChange={(e) => setProduct({ ...product, category: e.target.value })} placeholder="Category" required /><input value={product.badge} onChange={(e) => setProduct({ ...product, badge: e.target.value })} placeholder="Badge (e.g. Best seller)" /><ImageField value={product.image} onChange={(image) => setProduct({ ...product, image })} /><label className="manager-check"><input type="checkbox" checked={product.active} onChange={(e) => setProduct({ ...product, active: e.target.checked })} /> Visible on storefront</label><div className="manager-form-actions"><button className="admin-button" type="submit">{editingProductId ? 'Save product' : 'Add product'}</button>{editingProductId && <button className="manager-cancel" type="button" onClick={resetProductForm}>Cancel edit</button>}</div></form><div className="manager-grid product-manager-grid">{products.map((item) => <article className={`manager-card ${!item.active ? 'inactive' : ''}`} key={item.id}><img src={item.image} alt="" /><div><b>{item.name}</b><p>{item.restaurant} · {item.category} · GH₵ {item.price.toFixed(2)}</p><small>{item.description}</small></div><div className="manager-actions"><button onClick={() => editProduct(item)}>Edit all details</button><button onClick={() => toggleProduct(item)}>{item.active ? 'Hide' : 'Show'}</button><button onClick={() => deleteProduct(item.id)}>Delete</button></div></article>)}</div>{message && <p className="manager-message">{message}</p>}</section>
}
