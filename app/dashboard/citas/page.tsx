"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, RefreshCw } from "lucide-react"
import { fetchClientAppointments, fetchPets, fetchServices } from "@/lib/api"
import { AppointmentList } from "@/components/appointments/appointment-list"
import { AppointmentFormDialog } from "@/components/appointments/appointment-form-dialog"
import { AppointmentCalendar } from "@/components/appointments/appointment-calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function AppointmentsPage() {
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<any[]>([])
  const [pets, setPets] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openForm, setOpenForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Cargando datos para la página de citas...")

      // Verificar que el token esté disponible
      const token = localStorage.getItem("token")
      if (!token) {
        setError("No se encontró el token de autenticación. Por favor, inicie sesión nuevamente.")
        setLoading(false)
        return
      }

      // Cargar datos en paralelo
      const [appointmentsData, petsData, servicesData] = await Promise.all([
        fetchClientAppointments().catch((err) => {
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
      ])

      console.log("Datos cargados:", {
        appointments: appointmentsData.length,
        pets: petsData.length,
        services: servicesData.length,
      })

      setAppointments(appointmentsData)
      setPets(petsData)
      setServices(servicesData)
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

  const handleAddAppointment = () => {
    if (pets.length === 0) {
      toast({
        title: "No hay mascotas",
        description: "Debes registrar al menos una mascota antes de agendar una cita.",
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

  const handleEditAppointment = (appointment) => {
    setEditingAppointment(appointment)
    setOpenForm(true)
  }

  const handleAppointmentSaved = (savedAppointment) => {
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

  const handleAppointmentDeleted = (appointmentId) => {
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
        <h1 className="text-3xl font-bold text-gray-800">Mis Citas</h1>
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
          <CardTitle>Gestión de Citas</CardTitle>
          <CardDescription>Administra tus citas en la peluquería</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list">
            <TabsList className="mb-4">
              <TabsTrigger value="list">Lista</TabsTrigger>
              <TabsTrigger value="calendar">Calendario</TabsTrigger>
            </TabsList>
            <TabsContent value="list">
              {appointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No tienes citas programadas</div>
              ) : (
                <AppointmentList
                  appointments={appointments}
                  onEdit={handleEditAppointment}
                  onDelete={handleAppointmentDeleted}
                />
              )}
            </TabsContent>
            <TabsContent value="calendar">
              <AppointmentCalendar
                appointments={appointments}
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
