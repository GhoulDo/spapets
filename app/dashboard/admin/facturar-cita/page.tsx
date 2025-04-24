"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Minus, CreditCard, Loader2, CheckCircle } from "lucide-react"
import { fetchAppointments, fetchProducts, invoiceAppointment } from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Definición de interfaces para corregir errores de tipo
interface Cliente {
  id: string;
  username: string;
  email?: string;
  telefono?: string;
}

interface Mascota {
  id: string;
  nombre: string;
  tipo: string;
  raza?: string;
}

interface Servicio {
  id: string;
  nombre: string;
  duracion: number;
  precio: number;
  descripcion?: string;
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

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria?: string;
  disponible?: boolean;
}

interface ProductoSeleccionado {
  id: string;
  cantidad: number;
}

export default function FacturarCitaPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Cita[]>([])
  const [products, setProducts] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAppointment, setSelectedAppointment] = useState<Cita | null>(null)
  const [openInvoiceDialog, setOpenInvoiceDialog] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<ProductoSeleccionado[]>([])
  const [processingInvoice, setProcessingInvoice] = useState(false)

  // Cargar citas y productos al iniciar
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Cargar citas completadas pero no facturadas
        const appointmentsData = await fetchAppointments({ estado: "COMPLETADA" })
        const filteredAppointments = appointmentsData.filter((appointment: Cita) => !appointment.facturada)
        setAppointments(filteredAppointments)

        // Cargar productos
        const productsData = await fetchProducts()
        setProducts(productsData)
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

    loadData()
  }, [toast])

  // Filtrar citas según el término de búsqueda
  const filteredAppointments = appointments.filter((appointment) => {
    const searchString = searchTerm.toLowerCase()
    return (
      appointment.mascota.nombre.toLowerCase().includes(searchString) ||
      appointment.servicio.nombre.toLowerCase().includes(searchString) ||
      appointment.cliente.username.toLowerCase().includes(searchString) ||
      format(new Date(appointment.fecha), "dd/MM/yyyy").includes(searchString)
    )
  })

  // Manejar la selección de una cita para facturar
  const handleSelectAppointment = (appointment: Cita) => {
    setSelectedAppointment(appointment)
    setSelectedProducts([])
    setOpenInvoiceDialog(true)
  }

  // Añadir un producto a la factura
  const handleAddProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const existingProduct = prev.find((p) => p.id === productId)
      if (existingProduct) {
        return prev.map((p) => (p.id === productId ? { ...p, cantidad: p.cantidad + 1 } : p))
      } else {
        return [...prev, { id: productId, cantidad: 1 }]
      }
    })
  }

  // Eliminar un producto de la factura
  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId))
  }

  // Actualizar la cantidad de un producto
  const handleUpdateQuantity = (productId: string, cantidad: number) => {
    if (cantidad <= 0) {
      handleRemoveProduct(productId)
      return
    }

    setSelectedProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, cantidad } : p)))
  }

  // Generar la factura
  const handleGenerateInvoice = async () => {
    if (!selectedAppointment) return

    try {
      setProcessingInvoice(true)
      setError(null)

      // Preparar los datos para la API
      const productosIds = selectedProducts.map((p) => p.id)
      const cantidades = selectedProducts.map((p) => p.cantidad)

      // Llamar a la API para generar la factura
      const factura = await invoiceAppointment(
        selectedAppointment.id,
        productosIds.length > 0 ? { productosIds, cantidades } : undefined,
      )

      console.log("Factura generada:", factura)

      toast({
        title: "Factura generada",
        description: `La factura #${factura.numero || factura.id} ha sido generada correctamente.`,
      })

      // Cerrar el diálogo y actualizar la lista de citas
      setOpenInvoiceDialog(false)

      // Actualizar la lista de citas (eliminar la cita facturada)
      setAppointments((prev) => prev.filter((a) => a.id !== selectedAppointment.id))

      // Limpiar la selección
      setSelectedAppointment(null)
      setSelectedProducts([])

      // Redirigir a la página de facturas después de un breve retraso
      setTimeout(() => {
        router.push("/dashboard/admin/facturas")
      }, 1500)
    } catch (error: any) {
      console.error("Error generating invoice:", error)
      setError(error.message || "No se pudo generar la factura. Intente nuevamente.")
      toast({
        title: "Error",
        description: "No se pudo generar la factura. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setProcessingInvoice(false)
    }
  }

  // Calcular el total de la factura
  const calculateTotal = () => {
    let total = selectedAppointment ? selectedAppointment.servicio.precio : 0

    selectedProducts.forEach((selectedProduct) => {
      const product = products.find((p) => p.id === selectedProduct.id)
      if (product) {
        total += product.precio * selectedProduct.cantidad
      }
    })

    return total
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
        <h1 className="text-3xl font-bold text-gray-800">Facturar Citas</h1>
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
          <CardTitle>Citas Completadas</CardTitle>
          <CardDescription>Selecciona una cita para facturar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar por cliente, mascota o servicio..."
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
                  <TableHead>Cliente</TableHead>
                  <TableHead>Mascota</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No hay citas completadas pendientes de facturar
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        {format(new Date(appointment.fecha), "dd/MM/yyyy", { locale: es })}
                        <div className="text-xs text-muted-foreground">{appointment.hora}</div>
                      </TableCell>
                      <TableCell>{appointment.cliente.username}</TableCell>
                      <TableCell>{appointment.mascota.nombre}</TableCell>
                      <TableCell>{appointment.servicio.nombre}</TableCell>
                      <TableCell>${appointment.servicio.precio.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className="bg-green-100 text-green-800"
                        >
                          Completada
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="default" size="sm" onClick={() => handleSelectAppointment(appointment)}>
                          <CreditCard className="h-4 w-4 mr-1" /> Facturar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo para facturar cita */}
      <Dialog open={openInvoiceDialog} onOpenChange={setOpenInvoiceDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Facturar Cita</DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Información de la Cita</h3>
                  <div className="bg-muted p-3 rounded-md">
                    <p>
                      <span className="font-medium">Cliente:</span> {selectedAppointment.cliente.username}
                    </p>
                    <p>
                      <span className="font-medium">Mascota:</span> {selectedAppointment.mascota.nombre}
                    </p>
                    <p>
                      <span className="font-medium">Fecha:</span>{" "}
                      {format(new Date(selectedAppointment.fecha), "dd/MM/yyyy", { locale: es })}
                    </p>
                    <p>
                      <span className="font-medium">Hora:</span> {selectedAppointment.hora}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Servicio</h3>
                  <div className="bg-muted p-3 rounded-md">
                    <p>
                      <span className="font-medium">Nombre:</span> {selectedAppointment.servicio.nombre}
                    </p>
                    <p>
                      <span className="font-medium">Duración:</span> {selectedAppointment.servicio.duracion} minutos
                    </p>
                    <p>
                      <span className="font-medium">Precio:</span> ${selectedAppointment.servicio.precio.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Productos Utilizados</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            No hay productos añadidos
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedProducts.map((selectedProduct) => {
                          const product = products.find((p) => p.id === selectedProduct.id)
                          if (!product) return null

                          return (
                            <TableRow key={product.id}>
                              <TableCell>{product.nombre}</TableCell>
                              <TableCell>${product.precio.toFixed(2)}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-6 w-6 rounded-r-none"
                                    onClick={() => handleUpdateQuantity(product.id, selectedProduct.cantidad - 1)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <Input
                                    type="number"
                                    value={selectedProduct.cantidad}
                                    onChange={(e) =>
                                      handleUpdateQuantity(product.id, Number.parseInt(e.target.value) || 1)
                                    }
                                    className="h-6 w-10 rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    min="1"
                                  />
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-6 w-6 rounded-l-none"
                                    onClick={() => handleUpdateQuantity(product.id, selectedProduct.cantidad + 1)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>${(product.precio * selectedProduct.cantidad).toFixed(2)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                  onClick={() => handleRemoveProduct(product.id)}
                                >
                                  Eliminar
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Añadir Producto</h3>
                <Select onValueChange={handleAddProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.nombre} - ${product.precio.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-muted p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total a facturar:</span>
                  <span className="text-xl font-bold">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenInvoiceDialog(false)} disabled={processingInvoice}>
              Cancelar
            </Button>
            <Button onClick={handleGenerateInvoice} disabled={processingInvoice}>
              {processingInvoice ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando...
                </div>
              ) : (
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" /> Generar Factura
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
