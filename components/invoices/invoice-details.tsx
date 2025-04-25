"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FileDown, Loader2 } from "lucide-react"
import { useState } from "react"
import { printInvoice } from "@/lib/pdf-generator"
import { toast } from "@/components/ui/use-toast"

// Definimos la interfaz para el objeto invoice
interface InvoiceDetail {
  id: string;
  productoId?: string;
  servicioId?: string;
  productoNombre?: string;
  servicioNombre?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface Cliente {
  id: string;
  username?: string;
  email?: string;
  telefono?: string;
  nombre?: string;
}

// Actualizar la interfaz para permitir un número opcional
interface Invoice {
  id: string;
  numero?: number; // Ahora es opcional para adaptarse a los datos que obtenemos
  fecha: string;
  estado: string;
  total: number;
  cliente?: Cliente;
  detalles?: InvoiceDetail[];
  metodoPago?: string;
  direccionEntrega?: string;
  notas?: string;
}

export function InvoiceDetails({ invoice }: { invoice: Invoice }) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      
      // Preparar los datos para el PDF
      const datosPDF = {
        numero: invoice.numero || invoice.id,
        fecha: invoice.fecha,
        cliente: {
          nombre: invoice.cliente?.nombre || invoice.cliente?.username || 'Cliente',
          email: invoice.cliente?.email
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
      
      // Usar la nueva función de impresión
      printInvoice(datosPDF);
      
      toast({
        title: "PDF generado",
        description: "La factura se ha abierto para imprimir o guardar como PDF"
      });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold">Factura #{invoice.numero || 'N/A'}</h3>
          <p className="text-sm text-muted-foreground">Fecha: {formatDate(invoice.fecha)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={invoice.estado === "PAGADA" ? "default" : "outline"}
            className={invoice.estado === "PAGADA" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
          >
            {invoice.estado}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generando...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-1" /> Descargar PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Información del Cliente</h4>
            {invoice.cliente ? (
              <div>
                <p>Cliente: {invoice.cliente.nombre || invoice.cliente.username}</p>
                {invoice.cliente.email && <p>Email: {invoice.cliente.email}</p>}
                {invoice.cliente.telefono && <p>Teléfono: {invoice.cliente.telefono}</p>}
              </div>
            ) : (
              <p className="text-muted-foreground">No hay información del cliente disponible</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Información del Pago</h4>
            <p>Estado: {invoice.estado}</p>
            {invoice.metodoPago && <p>Método de pago: {invoice.metodoPago}</p>}
            {invoice.direccionEntrega && <p>Dirección de entrega: {invoice.direccionEntrega}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <h4 className="text-sm font-medium mb-3">Items facturados</h4>
          <div className="space-y-3">
            {invoice.detalles && invoice.detalles.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">Producto/Servicio</th>
                      <th className="text-center p-2">Cantidad</th>
                      <th className="text-right p-2">Precio</th>
                      <th className="text-right p-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.detalles.map((detalle, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{detalle.productoNombre || detalle.servicioNombre || "Item"}</td>
                        <td className="text-center p-2">{detalle.cantidad}</td>
                        <td className="text-right p-2">{formatCurrency(detalle.precioUnitario)}</td>
                        <td className="text-right p-2">{formatCurrency(detalle.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground">No hay detalles disponibles</p>
            )}
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between items-center py-2">
            <span className="font-medium">Total</span>
            <span className="text-xl font-bold">{formatCurrency(invoice.total)}</span>
          </div>
        </CardContent>
      </Card>

      {invoice.notas && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Notas</h4>
            <p>{invoice.notas}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
