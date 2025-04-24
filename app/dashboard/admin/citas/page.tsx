"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, Search, RefreshCw, Calendar, List } from "lucide-react"
import { fetchAppointments, fetchPets, fetchServices, fetchClients } from "@/lib/api"
import { AppointmentList } from "@/components/appointments/appointment-list"
import { AppointmentFormDialog } from "@/components/appointments/appointment-form-dialog"
import { AppointmentCalendar } from "@/components/appointments/appointment-calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"

// Definir interfaces para los tipos de datos
interface Cliente {
  id: string;
  username: string;
  email: string;
  telefono?: string;
}

interface Mascota {
  id: string;
  nombre: string;
  tipo: string;
  raza: string;
}

interface Servicio {
  id: string;
  nombre: string;
  duracion: number;
  precio: number;
}

interface Cita {
  id: string;
  fecha: string;
  hora: string;
  estado: string;
  cliente: Cliente;
  mascota: Mascota;
  servicio: Servicio;
  facturada?: boolean;
}

export default function AdminAppointmentsPage() {
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<Cita[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Cita[]>([])
  const [pets, setPets] = useState<Mascota[]>([])
  const [services, setServices] = useState<Servicio[]>([])
  const [clients, setClients] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openForm, setOpenForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Cita | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("TODOS")
  const [dateFilter, setDateFilter] = useState("TODOS")

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterAppointments()
  }, [appointments, searchTerm, statusFilter, dateFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Cargando datos para la página de administración de citas...")

      // Verificar que el token esté disponible
      const token = localStorage.getItem("token")
      if (!token) {
        setError("No se encontró el token de autenticación. Por favor, inicie sesión nuevamente.")
        setLoading(false)
        return
      }

      // Cargar datos en paralelo
      const [appointmentsData, petsData, servicesData, clientsData] = await Promise.all([
        fetchAppointments().catch((err) => {
          console.error("Error al cargar citas:", err)
          return []
        }),
        fetchPets().catch((err) => {
          console.error("Error al cargar mascotas:", err)
          return []
        }),
        fetchServices().catch((err) => {
          console.error("Error al cargar servicios:", err)
          return []
        }),
        fetchClients().catch((err) => {
          console.error("Error al cargar clientes:", err)
          return []
        }),
      ])

      console.log("Datos cargados:", {
        appointments: appointmentsData.length,
        pets: petsData.length,
        services: servicesData.length,
        clients: clientsData.length,
      })

      setAppointments(appointmentsData)
      setFilteredAppointments(appointmentsData)
      setPets(petsData)
      setServices(servicesData)
      setClients(clientsData)
    } catch (error: any) {
      console.error("Error loading data:", error)
      setError(error.message || "No se pudieron cargar los datos. Intente nuevamente.")
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterAppointments = () => {
    let filtered = [...appointments]

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (appointment) =>
          appointment.mascota.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          appointment.servicio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (appointment.cliente?.username &&
            appointment.cliente.username.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Filtrar por estado
    if (statusFilter !== "TODOS") {
      filtered = filtered.filter((appointment) => appointment.estado === statusFilter)
    }

    // Filtrar por fecha
    if (dateFilter !== "TODOS") {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)

      const todayStr = format(today, "yyyy-MM-dd")
      const tomorrowStr = format(tomorrow, "yyyy-MM-dd")

      switch (dateFilter) {
        case "HOY":
          filtered = filtered.filter((appointment) => appointment.fecha === todayStr)
          break
        case "MAÑANA":
          filtered = filtered.filter((appointment) => appointment.fecha === tomorrowStr)
          break
        case "SEMANA":
          filtered = filtered.filter((appointment) => {
            const appointmentDate = new Date(appointment.fecha)
            return appointmentDate >= today && appointmentDate <= nextWeek
          })
          break
      }
    }

    setFilteredAppointments(filtered)
  }

  const handleAddAppointment = () => {
    if (pets.length === 0) {
      toast({
        title: "No hay mascotas",
        description: "No hay mascotas registradas en el sistema.",
        variant: "destructive",
      })
      return
    }

    if (services.length === 0) {
      toast({
        title: "No hay servicios",
        description: "No hay servicios disponibles para agendar una cita.",
        variant: "destructive",
      })
      return
    }

    setEditingAppointment(null)
    setOpenForm(true)
  }

  const handleEditAppointment = (appointment: Cita) => {
    setEditingAppointment(appointment)
    setOpenForm(true)
  }

  const handleAppointmentSaved = (savedAppointment: Cita) => {
    if (editingAppointment) {
      setAppointments(appointments.map((a) => (a.id === savedAppointment.id ? savedAppointment : a)))
    } else {
      setAppointments([...appointments, savedAppointment])
    }
    setOpenForm(false)
    toast({
      title: "Éxito",
      description: editingAppointment ? "Cita actualizada correctamente" : "Cita agendada correctamente",
    })

    // Recargar datos para asegurar que todo esté actualizado
    loadData()
  }

  const handleAppointmentDeleted = (appointmentId: string) => {
    setAppointments(appointments.filter((a) => a.id !== appointmentId))
    toast({
      title: "Éxito",
      description: "Cita cancelada correctamente",
    })
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Citas</h1>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4" /> Actualizar
          </Button>
          <Button onClick={handleAddAppointment} className="bg-green-700 hover:bg-green-800">
            <PlusCircle className="h-4 w-4 mr-2" /> Agendar Cita
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Citas</CardTitle>
          <CardDescription>Administra todas las citas de la peluquería</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar por mascota, servicio o cliente..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los estados</SelectItem>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="CONFIRMADA">Confirmada</SelectItem>
                  <SelectItem value="COMPLETADA">Completada</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todas las fechas</SelectItem>
                  <SelectItem value="HOY">Hoy</SelectItem>
                  <SelectItem value="MAÑANA">Mañana</SelectItem>
                  <SelectItem value="SEMANA">Próxima semana</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="list">
            <TabsList className="mb-4">
              <TabsTrigger value="list" className="flex items-center gap-1">
                <List className="h-4 w-4" /> Lista
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Calendario
              </TabsTrigger>
            </TabsList>
            <TabsContent value="list">
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron citas con los filtros seleccionados
                </div>
              ) : (
                <AppointmentList
                  appointments={filteredAppointments}
                  onEdit={handleEditAppointment}
                  onDelete={handleAppointmentDeleted}
                />
              )}
            </TabsContent>
            <TabsContent value="calendar">
              <AppointmentCalendar
                appointments={filteredAppointments}
                onAppointmentClick={handleEditAppointment}
                onDateSelect={handleAddAppointment}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AppointmentFormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        appointment={editingAppointment}
        pets={pets}
        services={services}
        onSave={handleAppointmentSaved}
      />
    </div>
  )
}
