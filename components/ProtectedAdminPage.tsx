'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/context/AdminContext'
import { ReactNode } from 'react'

export function ProtectedAdminPage({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { isAdmin, isLoading } = useAdmin()

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/admin-login')
    }
  }, [isAdmin, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return <>{children}</>
}
