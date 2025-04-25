"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, RefreshCw, Search, Filter, Dog, Cat, Bird, Rabbit } from "lucide-react"
import { fetchPets } from "@/lib/api"
import { PetCard } from "@/components/pets/pet-card"
import { PetFormDialog } from "@/components/pets/pet-form-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

// Definir la interfaz para mascotas
interface Pet {
  id: string
  nombre: string
  tipo: string
  raza: string
  edad: number
  descripcion?: string
  cliente?: any
  fotoUrl?: string
  tieneFoto?: boolean
}

export default function PetsPage() {
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [pets, setPets] = useState<Pet[]>([])
  const [filteredPets, setFilteredPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openForm, setOpenForm] = useState(false)
  const [editingPet, setEditingPet] = useState<Pet | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("todos")
  const [sortOrder, setSortOrder] = useState("nombre-asc")

  useEffect(() => {
    // Solo cargar mascotas si el usuario está autenticado
    if (isAuthenticated) {
      loadPets()
    }
  }, [isAuthenticated])

  useEffect(() => {
    filterAndSortPets()
  }, [pets, searchTerm, activeTab, sortOrder])

  const loadPets = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Iniciando carga de mascotas...")

      // Verificar que el token esté disponible
      const token = localStorage.getItem("token")
      if (!token) {
        setError("No se encontró el token de autenticación. Por favor, inicie sesión nuevamente.")
        setLoading(false)
        return
      }

      console.log("Token disponible para petición de mascotas:", token.substring(0, 15) + "...")

      const data = await fetchPets()
      console.log("Mascotas cargadas:", data)
      setPets(data || [])
      setFilteredPets(data || [])
    } catch (error: any) {
      console.error("Error loading pets:", error)
      setError(error.message || "No se pudieron cargar las mascotas. Intente nuevamente.")
      toast({
        title: "Error",
        description: "No se pudieron cargar las mascotas. Intente nuevamente.",
        variant: "destructive",
      })
      // Establecer un array vacío para evitar errores
      setPets([])
      setFilteredPets([])
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortPets = () => {
    let result = [...pets]

    // Filtrar por término de búsqueda
    if (searchTerm.trim() !== "") {
      result = result.filter(
        (pet) =>
          (pet.nombre?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (pet.raza?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (pet.tipo?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
      )
    }

    // Filtrar por tipo de mascota
    if (activeTab !== "todos") {
      result = result.filter((pet) => (pet.tipo?.toLowerCase() || "").includes(activeTab.toLowerCase()))
    }

    // Ordenar
    result.sort((a, b) => {
      switch (sortOrder) {
        case "nombre-asc":
          return (a.nombre || "").localeCompare(b.nombre || "")
        case "nombre-desc":
          return (b.nombre || "").localeCompare(a.nombre || "")
        case "edad-asc":
          return (a.edad || 0) - (b.edad || 0)
        case "edad-desc":
          return (b.edad || 0) - (a.edad || 0)
        default:
          return 0
      }
    })

    setFilteredPets(result)
  }

  const handleAddPet = () => {
    setEditingPet(null)
    setOpenForm(true)
  }

  const handleEditPet = (pet: Pet) => {
    setEditingPet(pet)
    setOpenForm(true)
  }

  const handlePetSaved = (newPet: Pet) => {
    if (editingPet) {
      setPets(pets.map((p) => (p.id === newPet.id ? newPet : p)))
    } else {
      setPets([...pets, newPet])
    }
    setOpenForm(false)
    toast({
      title: "Éxito",
      description: editingPet ? "Mascota actualizada correctamente" : "Mascota agregada correctamente",
    })
    // Recargar las mascotas para asegurar datos actualizados
    loadPets()
  }

  const handlePetDeleted = (petId: string) => {
    setPets(pets.filter((p) => p.id !== petId))
    setFilteredPets(filteredPets.filter((p) => p.id !== petId))
    toast({
      title: "Éxito",
      description: "Mascota eliminada correctamente",
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
      <div className="relative bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl p-6 mb-8 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 z-10 relative">
          <div>
            <h1 className="text-3xl font-bold text-primary">Mis Mascotas</h1>
            <p className="text-muted-foreground">Administra tus compañeros peludos, escamosos y emplumados</p>
          </div>
          <Button onClick={handleAddPet} className="rounded-full bg-primary hover:bg-primary/90">
            <PlusCircle className="h-4 w-4 mr-2" /> Agregar Mascota
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

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Barra de filtros y búsqueda */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 w-full md:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar mascotas..."
            className="pl-8 rounded-full border-primary/20 focus-visible:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
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
                <DropdownMenuRadioItem value="edad-asc">Edad (menor a mayor)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="edad-desc">Edad (mayor a menor)</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={loadPets} variant="outline" className="rounded-full border-primary/20">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Pestañas de filtro por tipo */}
      <Tabs defaultValue="todos" value={activeTab} onValueChange={setActiveTab} className="custom-tabs">
        <TabsList className="bg-muted/50 p-1 rounded-full">
          <TabsTrigger value="todos" className="custom-tabs-trigger">
            Todos
          </TabsTrigger>
          <TabsTrigger value="perro" className="custom-tabs-trigger">
            <Dog className="h-4 w-4 mr-1" /> Perros
          </TabsTrigger>
          <TabsTrigger value="gato" className="custom-tabs-trigger">
            <Cat className="h-4 w-4 mr-1" /> Gatos
          </TabsTrigger>
          <TabsTrigger value="ave" className="custom-tabs-trigger">
            <Bird className="h-4 w-4 mr-1" /> Aves
          </TabsTrigger>
          <TabsTrigger value="roedor" className="custom-tabs-trigger">
            <Rabbit className="h-4 w-4 mr-1" /> Otros
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredPets.length === 0 ? (
        <Card className="border-dashed border-2 border-primary/20 bg-primary/5 rounded-xl">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-bounce-slow">
              <Dog className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-primary mb-2">No tienes mascotas registradas</h3>
            <p className="text-muted-foreground mb-4 text-center max-w-md">
              Agrega tu primera mascota para poder agendar citas y llevar un registro de sus servicios.
            </p>
            <Button onClick={handleAddPet} className="rounded-full bg-primary hover:bg-primary/90">
              <PlusCircle className="h-4 w-4 mr-2" /> Agregar Mascota
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPets.map((pet, index) => (
            <motion.div
              key={pet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <PetCard pet={pet} onEdit={() => handleEditPet(pet)} onDelete={handlePetDeleted} />
            </motion.div>
          ))}
        </div>
      )}

      <PetFormDialog open={openForm} onOpenChange={setOpenForm} pet={editingPet} onSave={handlePetSaved} />
    </div>
  )
}
