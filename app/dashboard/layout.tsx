"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { ErrorBoundary } from "@/components/ui/error-boundary"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, loading, user, isAdmin } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [redirected, setRedirected] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Cargar el estado del sidebar desde localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-collapsed")
    if (savedState) {
      setSidebarCollapsed(savedState === "true")
    }
  }, [])

  // Una sola lógica de redirección unificada
  useEffect(() => {
    // Esperar a que la autenticación termine de cargar
    if (loading || redirected) return

    // Si el usuario no está autenticado, redirigir a la página de inicio
    if (!isAuthenticated) {
      router.replace("/")
      return
    }

    const isAdminRoute = pathname.includes("/admin")

    // Si es admin y está en la página principal del dashboard, redirigir a dashboard/admin
    if (isAdmin && pathname === "/dashboard") {
      setRedirected(true)
      router.replace("/dashboard/admin")
      return
    }

    // Si no es admin pero está intentando acceder a rutas de admin, redirigir a dashboard/cliente
    if (!isAdmin && isAdminRoute) {
      setRedirected(true)
      router.replace("/dashboard/cliente")
      return
    }
  }, [isAuthenticated, loading, pathname, router, user, isAdmin, redirected])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className={`flex h-screen bg-gray-100 ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <Sidebar />
        <div
          className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${sidebarCollapsed ? "md:ml-20" : "md:ml-64"}`}
        >
          <Header />
          <main className="flex-1 overflow-y-auto p-4">
            {!isAuthenticated ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Sesión no iniciada</AlertTitle>
                <AlertDescription>Debes iniciar sesión para acceder a esta sección.</AlertDescription>
              </Alert>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}
