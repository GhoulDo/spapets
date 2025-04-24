"use client"

import { useState } from "react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { es } from "date-fns/locale"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface AppointmentCalendarProps {
  appointments: any[]
  onAppointmentClick: (appointment: any) => void
  onDateSelect: () => void
}

export function AppointmentCalendar({ appointments, onAppointmentClick, onDateSelect }: AppointmentCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const appointmentsByDate = appointments.reduce((acc, appointment) => {
    const [year, month, day] = appointment.fecha.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    const dateStr = format(date, "yyyy-MM-dd")

    if (!acc[dateStr]) {
      acc[dateStr] = []
    }
    acc[dateStr].push(appointment)
    return acc
  }, {})

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDIENTE":
        return "bg-yellow-500"
      case "CONFIRMADA":
        return "bg-blue-500"
      case "COMPLETADA":
        return "bg-green-500"
      case "CANCELADA":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        <CalendarComponent
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          locale={es}
          className="rounded-md border"
          modifiers={{
            appointment: (date) => {
              const dateStr = format(date, "yyyy-MM-dd")
              return !!appointmentsByDate[dateStr]
            },
          }}
          modifiersStyles={{
            appointment: {
              fontWeight: "bold",
              textDecoration: "underline",
              color: "var(--primary)",
            },
          }}
        />
      </div>
      <div>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">
              {selectedDate ? format(selectedDate, "PPPP", { locale: es }) : "Seleccione una fecha"}
            </h3>
            <div className="space-y-2">
              {selectedDate &&
                (appointmentsByDate[format(selectedDate, "yyyy-MM-dd")] || []).map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-2 border rounded-md cursor-pointer hover:bg-gray-50"
                    onClick={() => onAppointmentClick(appointment)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(appointment.estado)}`}></div>
                      <span className="font-medium">{appointment.hora}</span>
                    </div>
                    <div className="mt-1">
                      <p className="text-sm">
                        <span className="font-medium">{appointment.mascota.nombre}</span> -{" "}
                        {appointment.servicio.nombre}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {appointment.estado}
                      </Badge>
                    </div>
                  </div>
                ))}
              {selectedDate &&
                (!appointmentsByDate[format(selectedDate, "yyyy-MM-dd")] ||
                  appointmentsByDate[format(selectedDate, "yyyy-MM-dd")].length === 0) && (
                  <p className="text-sm text-gray-500">No hay citas para este día</p>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
