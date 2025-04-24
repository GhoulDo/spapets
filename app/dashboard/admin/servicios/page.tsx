"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Search, Edit, Trash, Scissors, Clock, DollarSign, Filter } from "lucide-react"
import { fetchServices, deleteService } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import { ServiceFormDialog } from "@/components/services/service-form-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion } from "framer-motion"

// Definición de la interfaz para Servicio
interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion: number;
  disponible: boolean;
}

export default function ServicesPage() {
  const { toast } = useToast()
  const [services, setServices] = useState<Servicio[]>([])
  const [filteredServices, setFilteredServices] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [openForm, setOpenForm] = useState(false)
  const [editingService, setEditingService] = useState<Servicio | null>(null)
  const [serviceToDelete, setServiceToDelete] = useState<Servicio | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sortOrder, setSortOrder] = useState("nombre-asc")
  const [availabilityFilter, setAvailabilityFilter] = useState("all")

  useEffect(() => {
    loadServices()
  }, [])

  useEffect(() => {
    filterAndSortServices()
  }, [services, searchTerm, sortOrder, availabilityFilter])

  const loadServices = async () => {
    try {
      setLoading(true)
      const data = await fetchServices()
      setServices(data)
      setFilteredServices(data)
    } catch (error) {
      console.error("Error loading services:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los servicios. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortServices = () => {
    let result = [...services]

    // Filtrar por término de búsqueda
    if (searchTerm.trim() !== "") {
      result = result.filter(
        (service) =>
          service.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.descripcion.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtrar por disponibilidad
    if (availabilityFilter !== "all") {
      const isAvailable = availabilityFilter === "available"
      result = result.filter((service) => service.disponible === isAvailable)
    }

    // Ordenar
    result.sort((a, b) => {
      switch (sortOrder) {
        case "nombre-asc":
          return a.nombre.localeCompare(b.nombre)
        case "nombre-desc":
          return b.nombre.localeCompare(a.nombre)
        case "precio-asc":
          return a.precio - b.precio
        case "precio-desc":
          return b.precio - a.precio
        case "duracion-asc":
          return a.duracion - b.duracion
        case "duracion-desc":
          return b.duracion - a.duracion
        default:
          return 0
      }
    })

    setFilteredServices(result)
  }

  const handleAddService = () => {
    setEditingService(null)
    setOpenForm(true)
  }

  const handleEditService = (service: Servicio) => {
    setEditingService(service)
    setOpenForm(true)
  }

  const handleDeleteClick = (service: Servicio) => {
    setServiceToDelete(service)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return

    setIsDeleting(true)
    try {
      await deleteService(serviceToDelete.id)
      setServices(services.filter((s) => s.id !== serviceToDelete.id))
      toast({
        title: "Éxito",
        description: "Servicio eliminado correctamente",
      })
    } catch (error) {
      console.error("Error deleting service:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el servicio. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setServiceToDelete(null)
    }
  }

  const handleServiceSaved = (savedService: Servicio) => {
    if (editingService) {
      setServices(services.map((s) => (s.id === savedService.id ? savedService : s)))
    } else {
      setServices([...services, savedService])
    }
    setOpenForm(false)
    toast({
      title: "Éxito",
      description: editingService ? "Servicio actualizado correctamente" : "Servicio creado correctamente",
    })
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado con ilustración */}
      <div className="relative bg-gradient-to-r from-pet-secondary/20 to-pet-tertiary/20 rounded-xl p-6 mb-8 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 z-10 relative">
          <div>
            <h1 className="text-3xl font-bold text-pet-secondary">Gestión de Servicios</h1>
            <p className="text-muted-foreground">Administra los servicios ofrecidos por tu peluquería canina</p>
          </div>
          <Button onClick={handleAddService} className="rounded-full bg-pet-secondary hover:bg-pet-secondary/90">
            <PlusCircle className="h-4 w-4 mr-2" /> Nuevo Servicio
          </Button>
        </div>

        {/* Decoración de fondo */}
        <div className="absolute right-0 bottom-0 opacity-20 w-40 h-40">
          <Scissors className="h-full w-full" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Servicios</CardTitle>
          <CardDescription>Administra los servicios ofrecidos por la peluquería</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 w-full md:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar servicios..."
                className="pl-8 rounded-full border-primary/20 focus-visible:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full border-primary/20">
                    <Filter className="h-4 w-4 mr-2" /> Filtrar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Disponibilidad</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                    <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="available">Disponibles</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="unavailable">No disponibles</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full border-primary/20">
                    <Filter className="h-4 w-4 mr-2" /> Ordenar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={sortOrder} onValueChange={setSortOrder}>
                    <DropdownMenuRadioItem value="nombre-asc">Nombre (A-Z)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="nombre-desc">Nombre (Z-A)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="precio-asc">Precio (menor a mayor)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="precio-desc">Precio (mayor a menor)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="duracion-asc">Duración (menor a mayor)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="duracion-desc">Duración (mayor a menor)</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={loadServices} variant="outline" className="rounded-full border-primary/20">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" /> Precio
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" /> Duración (min)
                    </div>
                  </TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Scissors className="h-12 w-12 mb-2 text-muted-foreground/50" />
                        <p>No se encontraron servicios</p>
                        <Button
                          variant="link"
                          onClick={handleAddService}
                          className="mt-2 text-pet-secondary hover:text-pet-secondary/80"
                        >
                          Agregar un nuevo servicio
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.map((service, index) => (
                    <motion.tr
                      key={service.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="group"
                    >
                      <TableCell className="font-medium">{service.nombre}</TableCell>
                      <TableCell className="max-w-xs truncate">{service.descripcion}</TableCell>
                      <TableCell>{formatCurrency(service.precio)}</TableCell>
                      <TableCell>{service.duracion}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            service.disponible
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }
                        >
                          {service.disponible ? "Disponible" : "No disponible"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditService(service)}
                            className="h-8 w-8 rounded-full hover:bg-pet-secondary/10 hover:text-pet-secondary"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(service)}
                            className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ServiceFormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        service={editingService}
        onSave={handleServiceSaved}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el servicio "{serviceToDelete?.nombre}" y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="rounded-full">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 rounded-full"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
