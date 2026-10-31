import type { ReactNode } from 'react'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <><a className="dashboard-category-link" href="/dashboard/categories">✦ Manage categories</a>{children}</>
}
