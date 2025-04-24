"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Dog, FileText, PlusCircle, ArrowRight, Scissors, Sparkles } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { PetImage } from "@/components/ui/pet-image"
import { fetchPets, fetchServices } from "@/lib/api"
import { Badge } from "@/components/ui/badge"

// Definir interfaces para los tipos de datos
interface Pet {
  id: string
  nombre: string
  tipo: string
  raza: string
  edad: number
  descripcion: string | null
  cliente: any
  fotoUrl: string
  tieneFoto: boolean
}

interface Service {
  id: string
  nombre: string
  duracion: number
  precio: number
}

export default function ClientDashboardPage() {
  const { user, isAdmin, loading } = useAuth()
  const router = useRouter()
  const [pageLoading, setPageLoading] = useState(true)
  const [recentPets, setRecentPets] = useState<Pet[]>([])
  const [services, setServices] = useState<Service[]>([])

  // Verificar que el usuario no sea administrador
  useEffect(() => {
    if (!loading) {
      if (isAdmin) {
        router.push("/dashboard/admin")
      }
    }
  }, [isAdmin, loading, router])

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar mascotas recientes para el cliente
        const pets = await fetchPets()
        setRecentPets(pets.slice(0, 3)) // Mostrar solo las 3 más recientes

        // Cargar servicios disponibles
        const servicesData = await fetchServices()
        setServices(servicesData)

        console.log("Servicios cargados:", servicesData)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setPageLoading(false)
      }
    }

    if (!isAdmin) {
      loadData()
    }
  }, [isAdmin])

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
          <div>
            <h1 className="text-3xl font-bold text-primary">¡Bienvenido, {user?.username || "Usuario"}!</h1>
            <p className="text-muted-foreground">Gestiona las citas y servicios para tus mascotas</p>
          </div>

          <Button asChild className="rounded-full bg-primary hover:bg-primary/90">
            <Link href="/dashboard/citas">
              <Calendar className="h-4 w-4 mr-2" /> Agendar Cita
            </Link>
          </Button>
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

      {/* Sección de servicios disponibles */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-primary flex items-center">
            <Scissors className="h-5 w-5 mr-2" /> Servicios Disponibles
          </h2>
        </div>

        {services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <div className="h-2 bg-gradient-to-r from-primary to-secondary w-full absolute top-0"></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-primary">{service.nombre}</h3>
                    <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                      {service.duracion} min
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-2xl font-bold">${service.precio}</p>
                    <Button size="sm" variant="outline" className="text-primary border-primary/20 hover:bg-primary/10">
                      <Link href="/dashboard/citas" className="flex items-center">
                        Reservar <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-primary/20 bg-primary/5 rounded-xl">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">No hay servicios disponibles</h3>
              <p className="text-muted-foreground mb-4 text-center max-w-md">
                Pronto añadiremos nuevos servicios para tus mascotas.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sección de mascotas recientes */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-primary flex items-center">
            <Dog className="h-5 w-5 mr-2" /> Mis Mascotas
          </h2>
          <Button asChild variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">
            <Link href="/dashboard/mascotas" className="flex items-center">
              Ver todas <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        {recentPets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentPets.map((pet, index) => (
              <motion.div
                key={pet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="pet-card group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg"
              >
                <div className="relative h-40 rounded-t-xl overflow-hidden">
                  <PetImage pet={pet} className="h-40 w-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-primary">{pet.nombre}</h3>
                  <p className="text-sm text-muted-foreground">{pet.raza}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-primary/20 bg-primary/5 rounded-xl">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-bounce-slow">
                <Dog className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">No tienes mascotas registradas</h3>
              <p className="text-muted-foreground mb-4 text-center max-w-md">
                Agrega tu primera mascota para poder agendar citas.
              </p>
              <Button asChild className="rounded-full bg-primary hover:bg-primary/90">
                <Link href="/dashboard/mascotas">
                  <PlusCircle className="h-4 w-4 mr-2" /> Agregar Mascota
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="overflow-hidden h-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="h-2 bg-primary w-full"></div>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Dog className="h-5 w-5 mr-2 text-primary" /> Mis Mascotas
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-88px)]">
              <p className="mb-4 text-muted-foreground">Administra tus mascotas registradas.</p>
              <div className="mt-auto">
                <Button asChild className="w-full rounded-full bg-primary hover:bg-primary/90">
                  <Link href="/dashboard/mascotas" className="flex items-center justify-between">
                    <span>Ver Mascotas</span>
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
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="overflow-hidden h-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="h-2 bg-secondary w-full"></div>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-secondary" /> Mis Citas
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-88px)]">
              <p className="mb-4 text-muted-foreground">Administra tus citas programadas.</p>
              <div className="mt-auto">
                <Button asChild className="w-full rounded-full bg-secondary hover:bg-secondary/90">
                  <Link href="/dashboard/citas" className="flex items-center justify-between">
                    <span>Ver Citas</span>
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
          <Card className="overflow-hidden h-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="h-2 bg-accent w-full"></div>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-accent" /> Mis Facturas
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-88px)]">
              <p className="mb-4 text-muted-foreground">Consulta tus facturas y pagos.</p>
              <div className="mt-auto">
                <Button asChild className="w-full rounded-full bg-accent hover:bg-accent/90">
                  <Link href="/dashboard/facturas" className="flex items-center justify-between">
                    <span>Ver Facturas</span>
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
