"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, FileDown, RefreshCw, Search, Filter, Loader2, AlertCircle } from "lucide-react"
import { fetchClientInvoicesByDiagnostic, downloadInvoicePdf } from "@/lib/api"
import { printInvoice } from "@/lib/pdf-generator"
import { formatDate, formatCurrency } from "@/lib/utils"
import { InvoiceDetails } from "@/components/invoices/invoice-details"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Definición de interfaces necesarias
interface Cliente {
  id: string;
  username?: string;
  nombre?: string;
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
  numero?: number;
  fecha: string;
  estado: string;
  total: number;
  cliente?: Cliente;
  detalles?: DetalleFactura[];
  detalles_count?: number;
  metodoPago?: string;
  direccionEntrega?: string;
  notas?: string;
}

export default function ClientInvoicesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Factura | null>(null)
  const [openDetails, setOpenDetails] = useState(false)
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null)
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null)

  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [sortOrder, setSortOrder] = useState("fecha-desc")

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      setDiagnosticInfo(null);

      // Verificar que el token esté disponible
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No se encontró el token de autenticación. Por favor, inicie sesión nuevamente.");
        setLoading(false);
        return;
      }

      console.log("Cargando facturas del cliente usando endpoint de diagnóstico...");
      
      // Usar la nueva función que implementamos
      const data = await fetchClientInvoicesByDiagnostic();
      
      if (data && Array.isArray(data)) {
        console.log(`Se recibieron ${data.length} facturas del servidor`);
        
        // Adaptar el formato de respuesta si es necesario
        const formattedInvoices = data.map(invoice => ({
          id: invoice.id,
          numero: invoice.numero || parseInt(invoice.id.substring(0, 6), 16) % 10000, // Generar un número si no viene
          fecha: invoice.fecha,
          estado: invoice.estado,
          total: invoice.total,
          cliente: invoice.cliente,
          detalles_count: invoice.detalles_count || 0
        }));
        
        setInvoices(formattedInvoices);
        
        // Guardar información diagnóstica
        setDiagnosticInfo({
          invoicesFound: data.length,
          sampleInvoice: data.length > 0 ? data[0] : null,
          timestamp: new Date().toISOString()
        });
      } else {
        console.error("La respuesta no es un array o está vacía:", data);
        setInvoices([]);
        setError("No se pudieron cargar las facturas. La respuesta del servidor no es válida.");
      }
    } catch (error: any) {
      console.error("Error loading invoices:", error);
      setError(error.message || "No se pudieron cargar las facturas. Intente nuevamente.");
      toast({
        title: "Error",
        description: "No se pudieron cargar las facturas. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
          fecha: invoice.fecha || new Date().toISOString(),
          cliente: {
            nombre: invoice.cliente?.nombre || invoice.cliente?.username || 'Cliente',
            email: invoice.cliente?.email || 'No disponible'
          },
          productos: (invoice.detalles || []).map(detalle => ({
            nombre: detalle.productoNombre || detalle.servicioNombre || 'Producto/Servicio',
            cantidad: detalle.cantidad,
            precioUnitario: detalle.precioUnitario,
            subtotal: detalle.subtotal
          })),
          total: invoice.total,
          metodoPago: invoice.metodoPago || 'No especificado',
          direccionEntrega: invoice.direccionEntrega
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

  // Aplicar filtros y ordenamiento
  const filteredInvoices = invoices
    .filter((invoice) => {
      // Filtro de búsqueda
      const searchMatch =
        searchTerm === "" ||
        (invoice.numero?.toString() || "").includes(searchTerm) ||
        (invoice.notas && invoice.notas.toLowerCase().includes(searchTerm.toLowerCase()))

      // Filtro de estado
      const statusMatch = statusFilter === "todos" || invoice.estado === statusFilter

      return searchMatch && statusMatch
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case "fecha-asc":
          return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
        case "fecha-desc":
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        case "numero-asc":
          return (a.numero || 0) - (b.numero || 0)
        case "numero-desc":
          return (b.numero || 0) - (a.numero || 0)
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
        <h1 className="text-3xl font-bold text-gray-800">Mis Facturas</h1>
        <Button onClick={loadInvoices} variant="outline" className="flex items-center gap-1">
          <RefreshCw className="h-4 w-4" /> Actualizar
        </Button>
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
          <CardTitle>Mis Facturas</CardTitle>
          <CardDescription>Consulta el historial de tus facturas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar por número o notas..."
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
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No tienes facturas registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.numero || "-"}</TableCell>
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
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(invoice)}>
                            <Eye className="h-4 w-4 mr-1" /> Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadPdf(invoice.id, invoice)}
                            disabled={downloadingInvoice === invoice.id}
                          >
                            {downloadingInvoice === invoice.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Descargando...
                              </>
                            ) : (
                              <>
                                <FileDown className="h-4 w-4 mr-1" /> PDF
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Información diagnóstica para depurar */}
          {diagnosticInfo && (
            <div className="mt-8 w-full text-xs text-muted-foreground border-t pt-4">
              <details>
                <summary className="cursor-pointer font-medium">Información diagnóstica (para desarrolladores)</summary>
                <pre className="mt-2 p-4 bg-muted rounded-md overflow-auto max-h-60 whitespace-pre-wrap">
                  {JSON.stringify(diagnosticInfo, null, 2)}
                </pre>
              </details>
            </div>
          )}
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
