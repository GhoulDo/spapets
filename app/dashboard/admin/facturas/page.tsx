"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Eye, MoreHorizontal, FileDown, Search, Filter, CheckCircle, Loader2, RefreshCw, Plus } from "lucide-react"
import { fetchInvoices, downloadInvoicePdf, setInvoiceAsPaid } from "@/lib/api"
import { printInvoice } from "@/lib/pdf-generator"
import { InvoiceDetails } from "@/components/invoices/invoice-details"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"

// Definimos las interfaces para los datos
interface Cliente {
  id: string;
  username: string;
  email?: string;
  telefono?: string;
}

interface DetalleFactura {
  id: string;
  productoId?: string;
  servicioId?: string;
  productoNombre?: string;
  servicioNombre?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface Factura {
  id: string;
  numero: number;
  fecha: string;
  estado: string;
  total: number;
  cliente?: Cliente;
  detalles?: DetalleFactura[];
  metodoPago?: string;
  direccionEntrega?: string;
  notas?: string;
}

export default function AdminInvoicesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedInvoice, setSelectedInvoice] = useState<Factura | null>(null)
  const [openDetails, setOpenDetails] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null)
  const [processingPayment, setProcessingPayment] = useState<string | null>(null)

  // Filtros
  const [statusFilter, setStatusFilter] = useState("todos")
  const [dateFilter, setDateFilter] = useState<Date | null>(null)
  const [sortOrder, setSortOrder] = useState("fecha-desc")

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchInvoices()
      setInvoices(data)
    } catch (error: any) {
      console.error("Error loading invoices:", error)
      setError("No se pudieron cargar las facturas. Intente nuevamente.")
      toast({
        title: "Error",
        description: "No se pudieron cargar las facturas. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPdf = async (invoiceId: string, invoice: Factura) => {
    try {
      setDownloadingInvoice(invoiceId);

      // Intenta usar el nuevo método primero
      try {
        // Preparar datos para el PDF
        const datosPDF = {
          numero: invoice.numero || invoice.id,
          fecha: invoice.fecha,
          cliente: {
            nombre: invoice.cliente?.username || 'Cliente',
            email: invoice.cliente?.email,
          },
          productos: (invoice.detalles || []).map(detalle => ({
            nombre: detalle.productoNombre || detalle.servicioNombre || 'Producto/Servicio',
            cantidad: detalle.cantidad,
            precioUnitario: detalle.precioUnitario,
            subtotal: detalle.subtotal,
          })),
          total: invoice.total,
          metodoPago: invoice.metodoPago || 'No especificado',
          direccionEntrega: invoice.direccionEntrega,
        };

        // Generar el PDF
        await printInvoice(datosPDF);
        toast({
          title: "Éxito",
          description: "La factura se ha abierto para imprimir o guardar como PDF",
        });
        return;
      } catch (error) {
        console.error("Error usando el generador de PDF local:", error);
        // Si falla, intentar con el método del servidor
      }

      // Método de respaldo: usar el endpoint del servidor
      await downloadInvoicePdf(invoiceId);
      toast({
        title: "Éxito",
        description: "La factura se ha descargado correctamente.",
      });
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast({
        title: "Error",
        description: "No se pudo descargar la factura. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setDownloadingInvoice(null);
    }
  }

  const handleViewDetails = (invoice: Factura) => {
    setSelectedInvoice(invoice)
    setOpenDetails(true)
  }

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      setProcessingPayment(invoiceId)
      setError(null)

      // Llamar a la API para marcar la factura como pagada
      const updatedInvoice = await setInvoiceAsPaid(invoiceId)

      // Actualizar la lista de facturas
      setInvoices((prevInvoices) =>
        prevInvoices.map((invoice) => (invoice.id === invoiceId ? { ...invoice, estado: "PAGADA" } : invoice)),
      )
      toast({
        title: "Éxito",
        description: "La factura ha sido marcada como pagada.",
      })
    } catch (error) {
      console.error("Error marking invoice as paid:", error)
      toast({
        title: "Error",
        description: "No se pudo marcar la factura como pagada. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setProcessingPayment(null)
    }
  }

  // Aplicar filtros y ordenamiento
  const filteredInvoices = invoices
    .filter((invoice) => {
      // Filtro de búsqueda
      const searchMatch =
        searchTerm === "" ||
        invoice.numero.toString().includes(searchTerm) ||
        (invoice.cliente && invoice.cliente.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (invoice.notas && invoice.notas.toLowerCase().includes(searchTerm.toLowerCase()))

      // Filtro de estado
      const statusMatch = statusFilter === "todos" || invoice.estado === statusFilter

      // Filtro de fecha
      const dateMatch = !dateFilter || new Date(invoice.fecha).toDateString() === new Date(dateFilter).toDateString()

      return searchMatch && statusMatch && dateMatch
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case "fecha-asc":
          return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
        case "fecha-desc":
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        case "numero-asc":
          return a.numero - b.numero
        case "numero-desc":
          return b.numero - a.numero
        case "total-asc":
          return a.total - b.total
        case "total-desc":
          return b.total - a.total
        default:
          return 0
      }
    })

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
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Facturas</h1>
        <div className="flex gap-2">
          <Button onClick={loadInvoices} variant="outline" className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4" /> Actualizar
          </Button>
          <Button variant="default" className="flex items-center gap-1" asChild>
            <a href="/dashboard/admin/facturar-cita">
              <Plus className="h-4 w-4" /> Facturar Cita
            </a>
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
          <CardTitle>Gestión de Facturas</CardTitle>
          <CardDescription>Administra todas las facturas de la peluquería</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar por número o cliente..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="PAGADA">Pagadas</SelectItem>
                  <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                </SelectContent>
              </Select>
              <DatePicker
                date={dateFilter}
                setDate={setDateFilter}
                placeholder="Filtrar por fecha"
                className="w-[180px]"
              />
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fecha-desc">Fecha (reciente)</SelectItem>
                  <SelectItem value="fecha-asc">Fecha (antigua)</SelectItem>
                  <SelectItem value="numero-desc">Número (mayor)</SelectItem>
                  <SelectItem value="numero-asc">Número (menor)</SelectItem>
                  <SelectItem value="total-desc">Total (mayor)</SelectItem>
                  <SelectItem value="total-asc">Total (menor)</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("todos")
                  setDateFilter(null)
                  setSortOrder("fecha-desc")
                }}
                title="Limpiar filtros"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No se encontraron facturas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.numero}</TableCell>
                      <TableCell>{invoice.cliente?.username || "N/A"}</TableCell>
                      <TableCell>{formatDate(invoice.fecha)}</TableCell>
                      <TableCell>{formatCurrency(invoice.total)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={invoice.estado === "PAGADA" ? 
                            "bg-green-100 text-green-800" : 
                            "bg-yellow-100 text-yellow-800"}
                        >
                          {invoice.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Abrir menú">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(invoice)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDownloadPdf(invoice.id, invoice)}
                              disabled={downloadingInvoice === invoice.id}
                            >
                              {downloadingInvoice === invoice.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Descargando...
                                </>
                              ) : (
                                <>
                                  <FileDown className="mr-2 h-4 w-4" />
                                  Descargar PDF
                                </>
                              )}
                            </DropdownMenuItem>
                            {invoice.estado === "PENDIENTE" && (
                              <DropdownMenuItem
                                onClick={() => handleMarkAsPaid(invoice.id)}
                                disabled={processingPayment === invoice.id}
                              >
                                {processingPayment === invoice.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Procesando...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Marcar como pagada
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Dialog open={openDetails} onOpenChange={setOpenDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalles de Factura</DialogTitle>
          </DialogHeader>
          {selectedInvoice && <InvoiceDetails invoice={selectedInvoice} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
