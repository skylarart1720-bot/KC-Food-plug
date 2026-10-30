'use client'

import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import type { CarouselSlide, Product, Restaurant } from '../../lib/catalog-store'

const emptyProduct = { name: '', description: '', price: '', restaurant: 'KFC' as Restaurant, category: 'Meals', image: '', badge: '' }
const emptySlide = { title: '', text: '', image: '' }

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

export default function CatalogManager({ mode }: { mode: 'Products' | 'Carousel media' }) {
  const [products, setProducts] = useState<Product[]>([])
  const [slides, setSlides] = useState<CarouselSlide[]>([])
  const [product, setProduct] = useState(emptyProduct)
  const [slide, setSlide] = useState(emptySlide)
  const [message, setMessage] = useState('')

  async function refresh() {
    if (mode === 'Products') setProducts((await (await fetch('/api/products', { cache: 'no-store' })).json()).products || [])
    else setSlides((await (await fetch('/api/carousel', { cache: 'no-store' })).json()).slides || [])
  }
  useEffect(() => { refresh().catch(() => setMessage('Could not load content.')) }, [mode])

  async function addProduct(event: FormEvent) {
    event.preventDefault()
    const response = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(product) })
    setMessage(response.ok ? 'Product added to the storefront.' : 'Product could not be added.')
    if (response.ok) { setProduct(emptyProduct); refresh() }
  }

  async function addSlide(event: FormEvent) {
    event.preventDefault()
    const response = await fetch('/api/carousel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(slide) })
    setMessage(response.ok ? 'Carousel slide added.' : 'Carousel slide could not be added.')
    if (response.ok) { setSlide(emptySlide); refresh() }
  }

  async function toggleProduct(item: Product) { await fetch(`/api/products/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !item.active }) }); refresh() }
  async function deleteProduct(id: string) { await fetch(`/api/products/${id}`, { method: 'DELETE' }); refresh() }
  async function toggleSlide(item: CarouselSlide) { await fetch(`/api/carousel/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !item.active }) }); refresh() }
  async function deleteSlide(id: string) { await fetch(`/api/carousel/${id}`, { method: 'DELETE' }); refresh() }

  if (mode === 'Carousel media') return <section className="admin-panel manager-panel"><div className="panel-heading"><div><p className="admin-kicker">STOREFRONT CONTENT</p><h2>Carousel media</h2></div><span>{slides.length} slides</span></div><form className="manager-form" onSubmit={addSlide}><input value={slide.title} onChange={(e) => setSlide({ ...slide, title: e.target.value })} placeholder="Slide title" /><input value={slide.text} onChange={(e) => setSlide({ ...slide, text: e.target.value })} placeholder="Supporting text" /><ImageField value={slide.image} onChange={(image) => setSlide({ ...slide, image })} /><button className="admin-button" type="submit">Add slide</button></form><div className="manager-grid">{slides.map((item) => <article className={`manager-card ${!item.active ? 'inactive' : ''}`} key={item.id}><img src={item.image} alt="" /><div><b>{item.title}</b><p>{item.text}</p></div><div className="manager-actions"><button onClick={() => toggleSlide(item)}>{item.active ? 'Hide' : 'Show'}</button><button onClick={() => deleteSlide(item.id)}>Delete</button></div></article>)}</div>{message && <p className="manager-message">{message}</p>}</section>

  return <section className="admin-panel manager-panel"><div className="panel-heading"><div><p className="admin-kicker">CATALOGUE EDITOR</p><h2>Products</h2></div><span>{products.length} total</span></div><form className="manager-form product-manager-form" onSubmit={addProduct}><input value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} placeholder="Product name" required /><input value={product.description} onChange={(e) => setProduct({ ...product, description: e.target.value })} placeholder="Description" /><input value={product.price} onChange={(e) => setProduct({ ...product, price: e.target.value })} type="number" min="0" step="0.01" placeholder="Price" required /><select value={product.restaurant} onChange={(e) => setProduct({ ...product, restaurant: e.target.value as Restaurant })}><option>KFC</option><option>Chickenman</option></select><input value={product.category} onChange={(e) => setProduct({ ...product, category: e.target.value })} placeholder="Category" /><ImageField value={product.image} onChange={(image) => setProduct({ ...product, image })} /><button className="admin-button" type="submit">Add product</button></form><div className="manager-grid product-manager-grid">{products.map((item) => <article className={`manager-card ${!item.active ? 'inactive' : ''}`} key={item.id}><img src={item.image} alt="" /><div><b>{item.name}</b><p>{item.restaurant} · {item.category} · GH₵ {item.price.toFixed(2)}</p></div><div className="manager-actions"><button onClick={() => toggleProduct(item)}>{item.active ? 'Hide' : 'Show'}</button><button onClick={() => deleteProduct(item.id)}>Delete</button></div></article>)}</div>{message && <p className="manager-message">{message}</p>}</section>
}
