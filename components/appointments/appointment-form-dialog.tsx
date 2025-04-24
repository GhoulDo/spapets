"use client"

import { useState } from "react"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createAppointment, updateAppointment, validateAppointmentAvailability } from "@/lib/api"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { TimePickerDemo } from "@/components/ui/time-picker"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const appointmentSchema = z.object({
  mascotaId: z.string().min(1, {
    message: "Seleccione una mascota",
  }),
  servicioId: z.string().min(1, {
    message: "Seleccione un servicio",
  }),
  fecha: z.date({
    required_error: "Seleccione una fecha",
  }),
  hora: z.string().min(1, {
    message: "Seleccione una hora",
  }),
})

interface AppointmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: any
  pets: any[]
  services: any[]
  onSave: (appointment: any) => void
}

export function AppointmentFormDialog({
  open,
  onOpenChange,
  appointment,
  pets,
  services,
  onSave,
}: AppointmentFormDialogProps) {
  const { toast } = useToast()
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      mascotaId: "",
      servicioId: "",
      fecha: new Date(),
      hora: "10:00",
    },
  })

  const isSubmitting = form.formState.isSubmitting

  useEffect(() => {
    if (appointment) {
      const [year, month, day] = appointment.fecha.split("-").map(Number)
      const date = new Date(year, month - 1, day)

      form.reset({
        mascotaId: appointment.mascota.id,
        servicioId: appointment.servicio.id,
        fecha: date,
        hora: appointment.hora,
      })
    } else {
      form.reset({
        mascotaId: "",
        servicioId: "",
        fecha: new Date(),
        hora: "10:00",
      })
    }
    setValidationError(null)
  }, [appointment, form])

  // Función para validar disponibilidad antes de enviar
  const validateAvailability = async (values: z.infer<typeof appointmentSchema>) => {
    try {
      // Solo validamos si es una nueva cita o si cambiaron fecha/hora
      if (
        !appointment ||
        appointment.fecha !== format(values.fecha, "yyyy-MM-dd") ||
        appointment.hora !== values.hora
      ) {
        const formattedDate = format(values.fecha, "yyyy-MM-dd")
        await validateAppointmentAvailability(values.mascotaId, values.servicioId, formattedDate, values.hora)
      }
      return true
    } catch (error: any) {
      setValidationError(error.message || "Esta hora no está disponible. Por favor, selecciona otro horario.")
      return false
    }
  }

  const onSubmit = async (values: z.infer<typeof appointmentSchema>) => {
    try {
      setIsLoading(true)
      setValidationError(null)

      // Validar disponibilidad
      const isAvailable = await validateAvailability(values)
      if (!isAvailable) {
        setIsLoading(false)
        return
      }

      // Format date to YYYY-MM-DD
      const formattedDate = format(values.fecha, "yyyy-MM-dd")

      // Adaptamos el formato según la documentación
      const appointmentData = {
        mascota: {
          id: values.mascotaId,
        },
        servicio: {
          id: values.servicioId,
        },
        fecha: formattedDate,
        hora: values.hora,
        estado: appointment?.estado || "PENDIENTE",
      }

      let savedAppointment
      if (appointment) {
        // Update existing appointment
        savedAppointment = await updateAppointment(appointment.id, appointmentData)
      } else {
        // Create new appointment
        savedAppointment = await createAppointment(appointmentData)
      }
      onSave(savedAppointment)
    } catch (error: any) {
      console.error("Error saving appointment:", error)
      setValidationError(error.message || "No se pudo guardar la cita. Intente nuevamente.")
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la cita. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Debugging para ver si los servicios están llegando correctamente
  useEffect(() => {
    console.log("Servicios disponibles:", services)
  }, [services])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="appointment-form-description">
        <DialogHeader>
          <DialogTitle>{appointment ? "Editar Cita" : "Agendar Cita"}</DialogTitle>
          <p id="appointment-form-description" className="text-sm text-muted-foreground">
            {appointment ? "Modifica los detalles de tu cita" : "Completa el formulario para agendar una nueva cita"}
          </p>
        </DialogHeader>

        {validationError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error de validación</AlertTitle>
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="mascotaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mascota</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar mascota" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pets.length === 0 ? (
                        <SelectItem value="sin-mascotas" disabled>
                          No tienes mascotas registradas
                        </SelectItem>
                      ) : (
                        pets.map((pet) => (
                          <SelectItem key={pet.id} value={pet.id}>
                            {pet.nombre} ({pet.tipo})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="servicioId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Servicio</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar servicio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {!services || services.length === 0 ? (
                        <SelectItem value="sin-servicios" disabled>
                          No hay servicios disponibles
                        </SelectItem>
                      ) : (
                        services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.nombre} - €{service.precio.toFixed(2)} ({service.duracion} min)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fecha"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hora"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Hora</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value || <span>Seleccionar hora</span>}
                            <Clock className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-4" align="start">
                        <TimePickerDemo
                          setHour={(hour) => {
                            field.onChange(hour)
                          }}
                          hour={field.value}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting || isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-700 hover:bg-green-800" disabled={isSubmitting || isLoading}>
                {isSubmitting || isLoading ? "Guardando..." : appointment ? "Actualizar" : "Agendar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
