'use client'

import CatalogManager from '../catalog-manager'

export default function CategoriesPage() {
  return <main className="admin-page"><aside className="admin-sidebar"><a className="admin-brand" href="/dashboard">✦ <span>KFC — Chickenman<br /><small>PLUG ADMIN</small></span></a><nav><a href="/dashboard">Overview</a><a className="active" href="/dashboard/categories">Categories</a><a href="/">Open storefront</a></nav></aside><section className="admin-content"><header className="admin-header"><div><p className="admin-kicker">CONTROL CENTRE · STOREFRONT NAVIGATION</p><h1>Categories</h1><p className="admin-muted">Create the lanes customers use to browse your products.</p></div><span className="live-pill"><i /> Live</span></header><CatalogManager mode="Categories" /></section></main>
}
