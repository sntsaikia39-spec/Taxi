'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface AdminContextType {
  isAdmin: boolean
  adminEmail: string | null
  adminFullName: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  const [adminFullName, setAdminFullName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if admin is already logged in on mount
  useEffect(() => {
    checkAdminSession()
  }, [])

  const checkAdminSession = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        setIsLoading(false)
        return
      }

      // Verify token validity by calling a check endpoint
      const response = await fetch('/api/admin/verify-session', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setIsAdmin(true)
        setAdminEmail(data.email)
        setAdminFullName(data.full_name || null)
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('adminToken')
        setIsAdmin(false)
        setAdminEmail(null)
        setAdminFullName(null)
      }
    } catch (error) {
      console.error('Error checking admin session:', error)
      setIsAdmin(false)
      setAdminEmail(null)
      setAdminFullName(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' }
      }

      // Store token in localStorage
      localStorage.setItem('adminToken', data.token)
      setIsAdmin(true)
      setAdminEmail(email)
      setAdminFullName(data?.admin?.full_name || null)

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || 'An error occurred' }
    }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      
      // Notify backend to invalidate session if needed
      if (token) {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {})
      }

      localStorage.removeItem('adminToken')
      setIsAdmin(false)
      setAdminEmail(null)
      setAdminFullName(null)
    } catch (error) {
      console.error('Error logging out:', error)
      localStorage.removeItem('adminToken')
      setIsAdmin(false)
      setAdminEmail(null)
      setAdminFullName(null)
    }
  }

  return (
    <AdminContext.Provider value={{ isAdmin, adminEmail, adminFullName, isLoading, login, logout }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider')
  }
  return context
}
