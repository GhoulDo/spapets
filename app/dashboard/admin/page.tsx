"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Dog, FileText, Users, Scissors, ShoppingBag, ArrowRight, Shield } from "lucide-react"
import Link from "next/link"
import { fetchDashboardStats } from "@/lib/api"
import { motion } from "framer-motion"

export default function AdminDashboardPage() {
  const { user, isAdmin, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalClients: 0,
    totalPets: 0,
    totalAppointments: 0,
    totalInvoices: 0,
  })
  const [pageLoading, setPageLoading] = useState(true)

  // Verificar que el usuario sea administrador
  useEffect(() => {
    if (!loading) {
      console.log("Admin Dashboard: Usuario cargado", user, "Es admin:", isAdmin, "Rol:", user?.rol)

      if (!isAdmin) {
        console.log("Usuario no es admin, redirigiendo a dashboard cliente")
        router.push("/dashboard/cliente")
      }
    }
  }, [isAdmin, loading, router, user])

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchDashboardStats()
        setStats(data)
      } catch (error) {
        console.error("Error loading dashboard stats:", error)
      } finally {
        setPageLoading(false)
      }
    }

    if (isAdmin && !loading) {
      loadStats()
    }
  }, [isAdmin, loading])

  if (loading || pageLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Encabezado con ilustración */}
      <div className="relative bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl p-6 mb-8 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 z-10 relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary">Panel de Administración</h1>
              <p className="text-muted-foreground">
                Bienvenido, {user?.username || "Administrador"}. Gestiona tu peluquería canina desde un solo lugar.
              </p>
            </div>
          </div>
        </div>

        {/* Decoración de fondo */}
        <div className="absolute right-0 bottom-0 opacity-20 w-40 h-40">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M36 34.15c-1.2 0-2.36.47-3.22 1.3-1.78 1.73-1.78 4.5 0 6.22.86.84 2 1.3 3.22 1.3 1.2 0 2.36-.47 3.22-1.3 1.78-1.73 1.78-4.5 0-6.22-.86-.84-2-1.3-3.22-1.3zM29.5 26.5c-1.2 0-2.36.47-3.22 1.3-1.78 1.73-1.78 4.5 0 6.22.86.84 2 1.3 3.22 1.3 1.2 0 2.36-.47 3.22-1.3 1.78-1.73 1.78-4.5 0-6.22-.86-.84-2-1.3-3.22-1.3zM42.5 26.5c-1.2 0-2.36.47-3.22 1.3-1.78 1.73-1.78 4.5 0 6.22.86.84 2 1.3 3.22 1.3 1.2 0 2.36-.47 3.22-1.3 1.78-1.73 1.78-4.5 0-6.22-.86-.84-2-1.3-3.22-1.3zM24 34.15c-1.2 0-2.36.47-3.22 1.3-1.78 1.73-1.78 4.5 0 6.22.86.84 2 1.3 3.22 1.3 1.2 0 2.36-.47 3.22-1.3 1.78-1.73 1.78-4.5 0-6.22-.86-.84-2-1.3-3.22-1.3z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="dashboard-stat-card">
            <div className="icon-wrapper bg-pet-primary">
              <Users className="h-5 w-5" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalClients}</div>
              <p className="text-xs text-muted-foreground mt-1">Clientes registrados</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="dashboard-stat-card">
            <div className="icon-wrapper bg-pet-secondary">
              <Dog className="h-5 w-5" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Mascotas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalPets}</div>
              <p className="text-xs text-muted-foreground mt-1">Mascotas registradas</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="dashboard-stat-card">
            <div className="icon-wrapper bg-pet-tertiary">
              <Calendar className="h-5 w-5" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Citas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalAppointments}</div>
              <p className="text-xs text-muted-foreground mt-1">Citas programadas</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="dashboard-stat-card">
            <div className="icon-wrapper bg-pet-blue">
              <FileText className="h-5 w-5" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Facturas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalInvoices}</div>
              <p className="text-xs text-muted-foreground mt-1">Facturas emitidas</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="overflow-hidden h-full">
            <div className="h-2 bg-pet-primary w-full"></div>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-pet-primary" /> Gestión de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-88px)]">
              <p className="mb-4 text-muted-foreground">Administra los clientes de la peluquería.</p>
              <div className="mt-auto">
                <Button asChild className="w-full rounded-full bg-pet-primary hover:bg-pet-primary/90">
                  <Link href="/dashboard/admin/clientes" className="flex items-center justify-between">
                    <span>Ver Clientes</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card className="overflow-hidden h-full">
            <div className="h-2 bg-pet-secondary w-full"></div>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scissors className="h-5 w-5 mr-2 text-pet-secondary" /> Gestión de Servicios
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-88px)]">
              <p className="mb-4 text-muted-foreground">Administra los servicios ofrecidos.</p>
              <div className="mt-auto">
                <Button asChild className="w-full rounded-full bg-pet-secondary hover:bg-pet-secondary/90">
                  <Link href="/dashboard/admin/servicios" className="flex items-center justify-between">
                    <span>Ver Servicios</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <Card className="overflow-hidden h-full">
            <div className="h-2 bg-pet-tertiary w-full"></div>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2 text-pet-tertiary" /> Gestión de Productos
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-88px)]">
              <p className="mb-4 text-muted-foreground">Administra los productos disponibles.</p>
              <div className="mt-auto">
                <Button asChild className="w-full rounded-full bg-pet-tertiary hover:bg-pet-tertiary/90">
                  <Link href="/dashboard/admin/productos" className="flex items-center justify-between">
                    <span>Ver Productos</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
