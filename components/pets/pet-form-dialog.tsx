"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createPet, updatePet, uploadPetPhoto } from "@/lib/api"
import { ImageUpload } from "@/components/ui/image-upload"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, Info } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface PetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pet: any
  onSave: (pet: any) => void
}

export function PetFormDialog({ open, onOpenChange, pet, onSave }: PetFormDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<any>(null)
  const [showDiagnostics, setShowDiagnostics] = useState(false)

  const petSchema = z.object({
    nombre: z.string().min(2, {
      message: "El nombre debe tener al menos 2 caracteres",
    }),
    tipo: z.string().min(1, {
      message: "Seleccione un tipo de mascota",
    }),
    raza: z.string().min(1, {
      message: "La raza es requerida",
    }),
    edad: z.coerce
      .number()
      .min(0, {
        message: "La edad debe ser mayor o igual a 0",
      })
      .max(30, {
        message: "La edad debe ser menor o igual a 30",
      }),
    descripcion: z.string().optional(),
  })

  const form = useForm<z.infer<typeof petSchema>>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      nombre: "",
      tipo: "",
      raza: "",
      edad: 0,
      descripcion: "",
    },
  })

  useEffect(() => {
    if (pet) {
      form.reset({
        nombre: pet.nombre,
        tipo: pet.tipo,
        raza: pet.raza,
        edad: pet.edad,
        descripcion: pet.descripcion || "",
      })
      if (pet.foto) {
        setPhotoPreview(pet.foto)
      } else {
        setPhotoPreview(null)
      }
    } else {
      form.reset({
        nombre: "",
        tipo: "",
        raza: "",
        edad: 0,
        descripcion: "",
      })
      setPhotoPreview(null)
    }
    setPhoto(null)
    setError(null)
    setErrorDetails(null)
    setShowDiagnostics(false)
  }, [pet, form])

  const handlePhotoChange = (file: File) => {
    // Verificar el tipo de archivo
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Formato no soportado",
        description: "Por favor, sube una imagen en formato JPG, PNG, GIF o WebP.",
        variant: "destructive",
      })
      return
    }

    // Verificar el tamaño del archivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo demasiado grande",
        description: "La imagen no debe superar los 5MB.",
        variant: "destructive",
      })
      return
    }

    setPhoto(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const onSubmit = async (values: z.infer<typeof petSchema>) => {
    setIsSubmitting(true)
    setError(null)
    setErrorDetails(null)

    try {
      console.log("Enviando formulario de mascota:", values)
      let savedPet

      if (pet) {
        // Update existing pet
        savedPet = await updatePet(pet.id, values)
        if (photo) {
          console.log("Subiendo foto para mascota existente:", pet.id)
          await uploadPetPhoto(pet.id, photo)
          // Refresh pet data to get updated photo URL
          savedPet = { ...savedPet, foto: URL.createObjectURL(photo) }
        }
      } else {
        // Create new pet
        console.log("Creando nueva mascota con foto:", !!photo)
        savedPet = await createPet(values, photo)
      }

      onSave(savedPet)
    } catch (error: any) {
      console.error("Error saving pet:", error)
      setError(error.message || "No se pudo guardar la mascota. Intente nuevamente.")

      // Guardar detalles del error para diagnóstico
      setErrorDetails({
        message: error.message,
        response: error.response?.data || null,
        status: error.response?.status || null,
        stack: error.stack || null,
      })

      toast({
        title: "Error",
        description: "No se pudo guardar la mascota. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-center font-bold text-green-700">
            {pet ? "Editar Mascota" : "Agregar Mascota"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}

              {errorDetails && (
                <Collapsible className="mt-2">
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full mt-2 text-xs">
                      <Info className="h-3 w-3 mr-1" />
                      {showDiagnostics ? "Ocultar detalles técnicos" : "Mostrar detalles técnicos"}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 text-xs bg-red-50 p-2 rounded">
                      <pre className="whitespace-pre-wrap overflow-auto max-h-40">
                        {JSON.stringify(errorDetails, null, 2)}
                      </pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex justify-center mb-4">
              <div className="flex flex-col items-center">
                <ImageUpload
                  value={photoPreview}
                  onChange={handlePhotoChange}
                  className="h-40 w-40 rounded-full shadow-md"
                />
                <p className="text-xs text-gray-500 mt-2">Formatos: JPG, PNG, GIF, WebP (máx. 5MB)</p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre de la mascota" {...field} className="focus-visible:ring-green-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="focus-visible:ring-green-500">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Perro">Perro</SelectItem>
                        <SelectItem value="Gato">Gato</SelectItem>
                        <SelectItem value="Ave">Ave</SelectItem>
                        <SelectItem value="Roedor">Roedor</SelectItem>
                        <SelectItem value="Reptil">Reptil</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="edad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Edad (años)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="30" {...field} className="focus-visible:ring-green-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="raza"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Raza</FormLabel>
                  <FormControl>
                    <Input placeholder="Raza de la mascota" {...field} className="focus-visible:ring-green-500" />
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
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Cuéntanos sobre tu mascota..."
                      {...field}
                      className="focus-visible:ring-green-500"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="border-green-200 hover:bg-green-50"
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-700 hover:bg-green-800" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {pet ? "Actualizando..." : "Guardando..."}
                  </>
                ) : pet ? (
                  "Actualizar"
                ) : (
                  "Guardar"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
