"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

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
}

interface Invoice {
  id: string;
  numero: number;
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
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold">Factura #{invoice.numero}</h3>
          <p className="text-sm text-muted-foreground">Fecha: {formatDate(invoice.fecha)}</p>
        </div>
        {/* Usamos "outline" en lugar de "success" o "warning" para corregir el error */}
        <Badge variant={invoice.estado === "PAGADA" ? "default" : "outline"} 
               className={invoice.estado === "PAGADA" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
          {invoice.estado}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-medium mb-2">Cliente</h4>
            <p>{invoice.cliente?.username || "N/A"}</p>
            <p className="text-sm text-muted-foreground">{invoice.cliente?.email || "N/A"}</p>
            {invoice.cliente?.telefono && <p className="text-sm text-muted-foreground">{invoice.cliente.telefono}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-medium mb-2">Detalles de pago</h4>
            <p>Método: {invoice.metodoPago || "No especificado"}</p>
            {invoice.direccionEntrega && (
              <p className="text-sm text-muted-foreground">Dirección: {invoice.direccionEntrega}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <h4 className="text-sm font-medium mb-3">Items facturados</h4>
          <div className="space-y-3">
            {invoice.detalles?.map((detalle, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <div>
                  <p className="font-medium">
                    {detalle.productoNombre || detalle.servicioNombre || "Producto/Servicio"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(detalle.precioUnitario)} x {detalle.cantidad}
                  </p>
                </div>
                <p className="font-medium">{formatCurrency(detalle.subtotal)}</p>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between items-center py-2">
            <p className="font-medium">Total</p>
            <p className="text-xl font-bold">{formatCurrency(invoice.total)}</p>
          </div>
        </CardContent>
      </Card>

      {invoice.notas && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-medium mb-2">Notas</h4>
            <p className="text-sm text-muted-foreground">{invoice.notas}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
