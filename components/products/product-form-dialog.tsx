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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createProduct, updateProduct } from "@/lib/api"

const productSchema = z.object({
  nombre: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres",
  }),
  descripcion: z.string().min(5, {
    message: "La descripción debe tener al menos 5 caracteres",
  }),
  precio: z.coerce.number().min(0, {
    message: "El precio debe ser mayor o igual a 0",
  }),
  stock: z.coerce.number().min(0, {
    message: "El stock debe ser mayor o igual a 0",
  }),
  categoria: z.string().min(1, {
    message: "La categoría es requerida",
  }),
  disponible: z.boolean().default(true),
})

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
  onSave: (product: any) => void
}

export function ProductFormDialog({ open, onOpenChange, product, onSave }: ProductFormDialogProps) {
  const { toast } = useToast()

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      precio: 0,
      stock: 0,
      categoria: "",
      disponible: true,
    },
  })

  const isSubmitting = form.formState.isSubmitting

  useEffect(() => {
    if (product) {
      form.reset({
        nombre: product.nombre,
        descripcion: product.descripcion,
        precio: product.precio,
        stock: product.stock,
        categoria: product.categoria || "Otros",
        disponible: product.disponible,
      })
    } else {
      form.reset({
        nombre: "",
        descripcion: "",
        precio: 0,
        stock: 0,
        categoria: "",
        disponible: true,
      })
    }
  }, [product, form])

  const onSubmit = async (values: z.infer<typeof productSchema>) => {
    try {
      let savedProduct
      if (product) {
        // Update existing product
        savedProduct = await updateProduct(product.id, values)
      } else {
        // Create new product
        savedProduct = await createProduct(values)
      }
      onSave(savedProduct)
    } catch (error) {
      console.error("Error saving product:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el producto. Intente nuevamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{product ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del producto" {...field} />
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
                    <Textarea placeholder="Descripción del producto" {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="precio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio (€)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Champús">Champús</SelectItem>
                      <SelectItem value="Acondicionadores">Acondicionadores</SelectItem>
                      <SelectItem value="Cepillos">Cepillos</SelectItem>
                      <SelectItem value="Accesorios">Accesorios</SelectItem>
                      <SelectItem value="Alimentos">Alimentos</SelectItem>
                      <SelectItem value="Otros">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="disponible"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Disponible</FormLabel>
                    <FormDescription>Marcar si el producto está disponible para la venta</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-700 hover:bg-green-800" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : product ? "Actualizar" : "Guardar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
