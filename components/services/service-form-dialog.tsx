"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createService, updateService } from "@/lib/api"
import { Scissors, Clock, DollarSign, Check } from "lucide-react"

const serviceSchema = z.object({
  nombre: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres",
  }),
  descripcion: z.string().min(5, {
    message: "La descripción debe tener al menos 5 caracteres",
  }),
  precio: z.coerce.number().min(0, {
    message: "El precio debe ser mayor o igual a 0",
  }),
  duracion: z.coerce
    .number()
    .min(5, {
      message: "La duración debe ser al menos 5 minutos",
    })
    .max(240, {
      message: "La duración debe ser menor o igual a 240 minutos",
    }),
  disponible: z.boolean().default(true),
})

interface ServiceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: any
  onSave: (service: any) => void
}

export function ServiceFormDialog({ open, onOpenChange, service, onSave }: ServiceFormDialogProps) {
  const { toast } = useToast()

  const form = useForm<z.infer<typeof serviceSchema>>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      precio: 0,
      duracion: 30,
      disponible: true,
    },
  })

  const isSubmitting = form.formState.isSubmitting

  useEffect(() => {
    if (service) {
      form.reset({
        nombre: service.nombre,
        descripcion: service.descripcion,
        precio: service.precio,
        duracion: service.duracion,
        disponible: service.disponible,
      })
    } else {
      form.reset({
        nombre: "",
        descripcion: "",
        precio: 0,
        duracion: 30,
        disponible: true,
      })
    }
  }, [service, form])

  const onSubmit = async (values: z.infer<typeof serviceSchema>) => {
    try {
      let savedService
      if (service) {
        // Update existing service
        savedService = await updateService(service.id, values)
      } else {
        // Create new service
        savedService = await createService(values)
      }
      onSave(savedService)
    } catch (error) {
      console.error("Error saving service:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el servicio. Intente nuevamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-bold text-pet-secondary">
            <Scissors className="h-5 w-5 mr-2" />
            {service ? "Editar Servicio" : "Nuevo Servicio"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del servicio</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Corte de pelo completo"
                      {...field}
                      className="rounded-lg focus-visible:ring-pet-secondary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe el servicio en detalle..."
                      {...field}
                      rows={3}
                      className="rounded-lg resize-none focus-visible:ring-pet-secondary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="precio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-pet-secondary" /> Precio (€)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        className="rounded-lg focus-visible:ring-pet-secondary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duracion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-pet-secondary" /> Duración (minutos)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="5"
                        max="240"
                        {...field}
                        className="rounded-lg focus-visible:ring-pet-secondary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="disponible"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="flex items-center">
                      <Check className="h-4 w-4 mr-1 text-pet-secondary" /> Disponible
                    </FormLabel>
                    <FormDescription>Marcar si el servicio está disponible para reservas</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-pet-secondary"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="rounded-full"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-full bg-pet-secondary hover:bg-pet-secondary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Guardando..." : service ? "Actualizar" : "Guardar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
