'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const SIDEBAR_KEY = 'sturec-sidebar-collapsed'
const W_EXPANDED = 260
const W_COLLAPSED = 64

interface SidebarState {
  collapsed: boolean
  toggle: () => void
  width: number
}

const SidebarContext = createContext<SidebarState>({
  collapsed: false,
  toggle: () => {},
  width: W_EXPANDED,
})

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setCollapsed(localStorage.getItem(SIDEBAR_KEY) === '1')
  }, [])

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0')
      return next
    })
  }

  return (
    <SidebarContext.Provider value={{ collapsed, toggle, width: collapsed ? W_COLLAPSED : W_EXPANDED }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext)
}
