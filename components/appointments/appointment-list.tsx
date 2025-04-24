"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Edit, Search, Trash } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { deleteAppointment } from "@/lib/api"
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

interface AppointmentListProps {
  appointments: any[]
  onEdit: (appointment: any) => void
  onDelete: (appointmentId: string) => void
}

export function AppointmentList({ appointments, onEdit, onDelete }: AppointmentListProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [appointmentToDelete, setAppointmentToDelete] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (appointment) => {
    setAppointmentToDelete(appointment)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!appointmentToDelete) return

    setIsDeleting(true)
    try {
      await deleteAppointment(appointmentToDelete.id)
      onDelete(appointmentToDelete.id)
    } catch (error) {
      console.error("Error deleting appointment:", error)
      toast({
        title: "Error",
        description: "No se pudo cancelar la cita. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setAppointmentToDelete(null)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDIENTE":
        return <Badge variant="warning">Pendiente</Badge>
      case "CONFIRMADA":
        return <Badge variant="default">Confirmada</Badge>
      case "COMPLETADA":
        return <Badge variant="success">Completada</Badge>
      case "CANCELADA":
        return <Badge variant="destructive">Cancelada</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredAppointments = appointments.filter(
    (appointment) =>
      appointment.mascota.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.servicio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.fecha.includes(searchTerm) ||
      appointment.estado.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <>
      <div className="flex items-center mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Buscar citas..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Mascota</TableHead>
              <TableHead>Servicio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No se encontraron citas
                </TableCell>
              </TableRow>
            ) : (
              filteredAppointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>{formatDate(appointment.fecha)}</TableCell>
                  <TableCell>{appointment.hora}</TableCell>
                  <TableCell>{appointment.mascota.nombre}</TableCell>
                  <TableCell>{appointment.servicio.nombre}</TableCell>
                  <TableCell>{getStatusBadge(appointment.estado)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(appointment)}
                        disabled={["COMPLETADA", "CANCELADA"].includes(appointment.estado)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(appointment)}
                        disabled={["COMPLETADA", "CANCELADA"].includes(appointment.estado)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará la cita del {appointmentToDelete && formatDate(appointmentToDelete.fecha)} a las{" "}
              {appointmentToDelete?.hora} y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>No</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Cancelando..." : "Sí, cancelar cita"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
