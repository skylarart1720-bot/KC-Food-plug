'use client'

import { useEffect, useMemo, useState } from 'react'
import { defaultProducts, Product, Restaurant } from '../lib/catalog-store'

const money = (value: number) => `GH₵ ${value.toFixed(2)}`
const deliveryFee = (itemCount: number) => itemCount <= 0 ? 0 : itemCount === 1 ? 20 : itemCount === 2 ? 40 : itemCount === 3 ? 50 : itemCount * 20

export default function Home() {
  const [activeRestaurant, setActiveRestaurant] = useState<'All' | Restaurant>('All')
  const [products, setProducts] = useState<Product[]>(defaultProducts)
  const [cart, setCart] = useState<Record<string, number>>({})
  const [cartReady, setCartReady] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [search, setSearch] = useState('')
  const [carouselIndex, setCarouselIndex] = useState(0)
  const carouselSlides = [
    { title: 'Crispy comfort', text: 'Big flavour, straight to your door.', image: products[0].image },
    { title: 'Hot, fresh, plugged in', text: 'KFC classics and Chickenman favourites.', image: products[3].image },
    { title: 'Share the good stuff', text: 'Build one basket from both menus.', image: products[5].image },
  ]
  useEffect(() => { const timer = window.setInterval(() => setCarouselIndex((index) => (index + 1) % carouselSlides.length), 4500); return () => window.clearInterval(timer) }, [carouselSlides.length])

  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesRestaurant = product.active && (activeRestaurant === 'All' || product.restaurant === activeRestaurant)
    const query = search.toLowerCase()
    return matchesRestaurant && (!query || `${product.name} ${product.description}`.toLowerCase().includes(query))
  }), [activeRestaurant, search])

  const cartItems = products.filter((product) => cart[product.id]).map((product) => ({ ...product, quantity: cart[product.id] }))
  const count = cartItems.reduce((total, item) => total + item.quantity, 0)
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  const delivery = deliveryFee(count)

  useEffect(() => {
    fetch('/api/products', { cache: 'no-store' }).then((response) => response.ok ? response.json() : null).then((payload) => { if (payload?.products?.length) setProducts(payload.products) }).catch(() => {})
  }, [])

  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem('kc-food-plug-cart')
      if (savedCart) setCart(JSON.parse(savedCart))
    } catch {}
    setCartReady(true)
  }, [])

  useEffect(() => {
    if (cartReady) window.localStorage.setItem('kc-food-plug-cart', JSON.stringify(cart))
  }, [cart, cartReady])

  function add(product: Product) { setCart((current) => ({ ...current, [product.id]: (current[product.id] || 0) + 1 })) }
  function change(id: string, amount: number) { setCart((current) => { const next = Math.max(0, (current[id] || 0) + amount); const copy = { ...current }; if (next) copy[id] = next; else delete copy[id]; return copy }) }

  return <main>
    <style jsx global>{`\n      .nav { position: sticky; top: 0; z-index: 20; background: rgba(245, 241, 233, .94); backdrop-filter: blur(14px); }\n      .hero { padding-top: 52px; padding-bottom: 58px; }\n      .hero h1 { font-size: 16px; letter-spacing: 0; line-height: 1.2; display: flex; gap: 5px; margin: 12px 0 8px; }\n      .hero h1 br { display: none; }\n      .hero-text { font-size: 12px; margin: 0; }\n      .hero-actions { margin-top: 16px; }\n      .hero-art { background: linear-gradient(145deg, rgba(0,0,0,.08), rgba(0,0,0,.2)), url('https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=85') center/cover; border-radius: 10px; }\n      @media (max-width: 800px) { .hero { padding-top: 42px; } .hero h1 { font-size: 14px; } }\n    `}</style>
    <header className="nav"><div className="nav-inner shell">
      <a className="brand" href="#top" aria-label="KFC Chicken Man Plug home"><span className="brand-mark">✦</span><span><strong>KFC</strong> <em>CHICKEN MAN</em><small>PLUG</small></span></a>
      <nav className="desktop-nav" aria-label="Menu navigation"><button className={activeRestaurant === 'All' ? 'active' : ''} onClick={() => { setActiveRestaurant('All'); document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' }) }}>All dishes</button><button className={activeRestaurant === 'KFC' ? 'active' : ''} onClick={() => { setActiveRestaurant('KFC'); document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' }) }}>KFC</button><button className={activeRestaurant === 'Chickenman' ? 'active' : ''} onClick={() => { setActiveRestaurant('Chickenman'); document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' }) }}>Chickenman</button></nav>
      <button className="cart-button" onClick={() => setShowCart(true)} aria-label={`Open cart with ${count} items`}>Cart <span>{count}</span></button>
    </div></header>

    <section className="hero shell" id="top">
      <div className="hero-copy"><p className="eyebrow">GOOD FOOD. ZERO STRESS.</p><h1>Your cravings,<br /><span>plugged in.</span></h1><p className="hero-text">KFC classics and Chickenman favourites, brought together in one simple order.</p><div className="hero-actions"><a className="button primary" href="#menu">Explore the menu <span>↘</span></a><a className="text-link" href="#how-it-works">How it works <span>→</span></a></div><div className="hero-note"><span>◎</span> Order direct on WhatsApp<br /><small>We confirm every order personally.</small></div></div>
      <div className="hero-art"><div className="art-card card-a"><span>✦</span><b>CRISPY<br />&amp; FRESH</b></div><div className="art-card card-b"><span>HOT<br /><i>stuff.</i></span></div><div className="hero-photo" /></div>
    </section>

    <section className="food-carousel shell" aria-label="Featured food"><div className="carousel-copy"><p className="eyebrow">TODAY'S FEATURED PLUG</p><h2>{carouselSlides[carouselIndex].title}</h2><p>{carouselSlides[carouselIndex].text}</p><a className="button dark" href="#menu">Order the good stuff <span>↘</span></a></div><div className="carousel-stage" style={{ backgroundImage: `url(${carouselSlides[carouselIndex].image})` }}><span className="carousel-sticker">FRESH<br />DROP ✦</span><div className="carousel-controls"><button onClick={() => setCarouselIndex((carouselIndex - 1 + carouselSlides.length) % carouselSlides.length)} aria-label="Previous featured food">←</button>{carouselSlides.map((item, index) => <button key={item.title} className={index === carouselIndex ? 'selected' : ''} onClick={() => setCarouselIndex(index)} aria-label={`Show ${item.title}`} />)}<button onClick={() => setCarouselIndex((carouselIndex + 1) % carouselSlides.length)} aria-label="Next featured food">→</button></div></div></section>
    <section className="trust-strip"><div className="shell trust-inner"><span>THE PLUG FOR</span><strong>KFC</strong><i>×</i><strong>CHICKENMAN</strong><span className="trust-right">ONE CART · ONE WHATSAPP ORDER</span></div></section>

    <section className="menu-section shell" id="menu"><div className="section-heading"><div><p className="eyebrow">PICK YOUR PLEASURE</p><h2>What are you<br /><i>feeling today?</i></h2></div><div className="restaurant-tabs"><button className={activeRestaurant === 'All' ? 'selected' : ''} onClick={() => setActiveRestaurant('All')}>All dishes</button><button className={activeRestaurant === 'KFC' ? 'selected' : ''} onClick={() => setActiveRestaurant('KFC')}>KFC</button><button className={activeRestaurant === 'Chickenman' ? 'selected' : ''} onClick={() => setActiveRestaurant('Chickenman')}>Chickenman</button></div></div><div className="menu-tools"><div className="search"><span>⌕</span><input aria-label="Search menu" placeholder="Search the menu" value={search} onChange={(e) => setSearch(e.target.value)} /></div><span className="result-count">{visibleProducts.length} dishes</span></div><div className="product-grid">{visibleProducts.map((product) => <article className="product-card" key={product.id}><div className="product-image" style={{ backgroundImage: `url(${product.image})` }}>{product.badge && <span className="badge">{product.badge}</span>}<span className={`restaurant-tag ${product.restaurant === 'KFC' ? 'red' : 'orange'}`}>{product.restaurant === 'KFC' ? 'KFC' : 'CHICKENMAN'}</span></div><div className="product-info"><div><h3>{product.name}</h3><p>{product.description}</p></div><div className="product-footer"><strong>{money(product.price)}</strong><button className="add-button" onClick={() => add(product)} aria-label={`Add ${product.name} to cart`}>+</button></div></div></article>)}</div></section>

    <section className="how shell" id="how-it-works"><div className="how-intro"><p className="eyebrow">NO APP. NO ACCOUNT.</p><h2>Just good food<br /><i>on the way.</i></h2><p>We make ordering as easy as sending a message to a friend.</p></div><div className="steps"><div><span>01</span><h3>Choose your food</h3><p>Browse KFC and Chickenman in one menu.</p></div><div><span>02</span><h3>Build your basket</h3><p>Mix favourites from both spots. No problem.</p></div><div><span>03</span><h3>Send on WhatsApp</h3><p>We confirm availability, price and delivery.</p></div></div></section>

    <section className="cta shell" id="contact"><div><p className="eyebrow">READY WHEN YOU ARE</p><h2>Hungry? Let's<br /><i>sort that.</i></h2><p>Tell us what you want. We’ll handle the rest.</p></div><a className="button light" href="https://wa.me/233501242319" target="_blank" rel="noreferrer">Chat on WhatsApp <span>↗</span></a><div className="cta-scribble">made for<br /><b>good days</b> ✦</div></section>

    <footer className="footer"><div className="footer-inner shell"><a className="brand" href="#top"><span className="brand-mark">✦</span><span><strong>KFC</strong> <em>CHICKEN MAN</em><small>PLUG</small></span></a><p>Independent ordering service.<br />We confirm every order on WhatsApp.</p><span>© 2026 KFC — Chicken Man Plug</span></div></footer>

    {showCart && <div className="overlay" onClick={() => setShowCart(false)}><aside className="drawer" onClick={(e) => e.stopPropagation()}><div className="drawer-head"><div><p className="eyebrow">YOUR ORDER</p><h2>Basket <span>({count})</span></h2></div><button className="close" onClick={() => setShowCart(false)}>×</button></div>{cartItems.length ? <><div className="cart-list">{cartItems.map((item) => <div className="cart-row" key={item.id}><div className="mini-image" style={{ backgroundImage: `url(${item.image})` }} /><div className="cart-details"><b>{item.name}</b><small>{item.restaurant} · {money(item.price)}</small><div className="quantity"><button onClick={() => change(item.id, -1)}>−</button><span>{item.quantity}</span><button onClick={() => change(item.id, 1)}>+</button><button className="remove-item" onClick={() => change(item.id, -item.quantity)}>Remove</button></div></div><strong>{money(item.price * item.quantity)}</strong></div>)}</div><div className="cart-total"><span>Food subtotal</span><b>{money(subtotal)}</b><span>Delivery fee</span><b>{money(delivery)}</b><span>Total</span><b>{money(subtotal + delivery)}</b><small>Delivery is calculated by total quantity: 1=GH₵20, 2=GH₵40, 3=GH₵50, then GH₵20 per item.</small></div><button className="button primary full" onClick={() => { setShowCart(false); setShowCheckout(true) }}>Continue to WhatsApp <span>↗</span></button></> : <div className="empty"><span>✦</span><h3>Your basket is waiting.</h3><p>Add something delicious from the menu.</p><button className="button dark" onClick={() => setShowCart(false)}>Browse menu</button></div>}</aside></div>}
    {showCheckout && <Checkout subtotal={subtotal} items={cartItems} onClose={() => setShowCheckout(false)} onComplete={() => { setCart({}); setShowCheckout(false) }} />}
  </main>
}

function Checkout({ subtotal, items, onClose, onComplete }: { subtotal: number; items: Array<Product & { quantity: number }>; onClose: () => void; onComplete: () => void }) {
  const [form, setForm] = useState({ name: '', phone: '', area: '', address: '', notes: '' })
  const [error, setError] = useState('')
  async function submitOrder(e: React.FormEvent) {
    e.preventDefault()
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const delivery = itemCount === 1 ? 20 : itemCount === 2 ? 40 : itemCount === 3 ? 50 : itemCount * 20
    const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer: form, items: items.map((item) => ({ id: item.id, name: item.name, restaurant: item.restaurant, quantity: item.quantity, price: item.price })), subtotal, delivery, total: subtotal + delivery }) })
    const result = await response.json()
    if (!response.ok) { setError(result.error || 'We could not record this order.'); return }
    const lines = items.map((item) => `- ${item.name} x${item.quantity} - ${money(item.price * item.quantity)}`).join('%0A')
    const message = `NEW FOOD ORDER%0A%0AOrder reference: ${result.order.id}%0AName: ${encodeURIComponent(form.name)}%0APhone: ${encodeURIComponent(form.phone)}%0AArea: ${encodeURIComponent(form.area)}%0AAddress: ${encodeURIComponent(form.address)}%0A%0AORDER%0A${lines}%0A%0ASubtotal: ${money(subtotal)}%0ADelivery: ${money(delivery)}%0ATotal: ${money(subtotal + delivery)}%0A%0ANotes: ${encodeURIComponent(form.notes || 'None')}`
    onComplete()
    window.location.assign(`https://wa.me/233501242319?text=${message}`)
  }
  function submit(e: React.FormEvent) { e.preventDefault(); if (!form.name || !form.phone || !form.area || !form.address) { setError('Please fill in your name, phone, area and address.'); return } const reference = `PLUG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`; const lines = items.map((item) => `• ${item.name} x${item.quantity} — ${money(item.price * item.quantity)}`).join('%0A'); const message = `🍗 NEW FOOD ORDER%0A%0AOrder reference: ${reference}%0AName: ${encodeURIComponent(form.name)}%0APhone: ${encodeURIComponent(form.phone)}%0AArea: ${encodeURIComponent(form.area)}%0AAddress: ${encodeURIComponent(form.address)}%0A%0AORDER%0A${lines}%0A%0ASubtotal: ${money(subtotal)}%0ADelivery: To be confirmed%0A%0ANotes: ${encodeURIComponent(form.notes || 'None')}%0A%0APlease confirm availability and final delivery charge.`; window.open(`https://wa.me/233501242319?text=${message}`, '_blank'); }
  return <div className="overlay"><div className="checkout"><button className="close" onClick={onClose}>×</button><p className="eyebrow">ALMOST THERE</p><h2>Send your order<br /><i>on WhatsApp.</i></h2><p className="checkout-note">We’ll confirm availability and the final delivery fee with you.</p><form onSubmit={submitOrder}><label>Full name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ama Mensah" /></label><label>Phone number<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 024 000 0000" /></label><label>Delivery area<input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="e.g. East Legon" /></label><label>Address or landmark<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Where should we meet you?" /></label><label>Anything else? <span>(optional)</span><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Extra sauce, call on arrival..." /></label>{error && <p className="form-error">{error}</p>}<button className="button primary full" type="submit">Open WhatsApp <span>↗</span></button><small className="send-note">Your order is not confirmed until you press Send in WhatsApp.</small></form></div></div>
}
