"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, ArrowLeft, FileText, Loader2, RefreshCw } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getResumenCompra, confirmarCompra } from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { generateInvoicePDF, printInvoice } from "@/lib/pdf-generator"

// Definiciones de interfaces para corregir errores de tipo
interface CartItem {
  productoId: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
  imagen?: string;
}

interface CartData {
  clienteId: string;
  items: CartItem[];
  total: number;
}

export default function CarritoPage() {
  // Usar cartItems en lugar de cart para evitar conflicto con CartContextType
  const {
    cartItems,
    loading: cartLoading,
    error: cartError,
    removeItem,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount,
    refreshCart,
  } = useCart()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "summary" | "confirmation">("cart")
  const [checkoutSummary, setCheckoutSummary] = useState<any>(null)
  const [metodoPago, setMetodoPago] = useState<string>("EFECTIVO")
  const [direccionEntrega, setDireccionEntrega] = useState<string>("")

  // Efecto para asegurar que el carrito se carga correctamente al inicio
  useEffect(() => {
    if (!cartLoading && !cartItems) {
      refreshCart().catch(err => {
        console.error("Error al cargar el carrito:", err);
        setError("No se pudo cargar el carrito. Intente nuevamente.");
      });
    }
  }, [cartLoading, cartItems, refreshCart]);

  // Función para obtener el resumen de checkout
  const handleGetCheckoutSummary = async () => {
    // Verificar que el carrito esté cargado y tenga ítems
    if (!cartItems || cartItems.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Añade productos a tu carrito antes de finalizar la compra.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Primero refrescamos el carrito para asegurarnos de tener la información más actualizada
      await refreshCart()

      // Obtenemos el resumen de checkout
      const resumen = await getResumenCompra()
      setCheckoutSummary(resumen)

      // Avanzamos al paso de resumen
      setCheckoutStep("summary")
    } catch (error: any) {
      console.error("Error al obtener resumen de checkout:", error)
      setError(error.message || "No se pudo obtener el resumen de compra. Intente nuevamente.")
      toast({
        title: "Error",
        description: "No se pudo obtener el resumen de compra. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Función para confirmar la compra
  const handleConfirmCheckout = async () => {
    try {
      setLoading(true)
      setError(null)

      // Verificamos que haya stock disponible
      if (checkoutSummary && !checkoutSummary.stockDisponible) {
        setError("No hay suficiente stock para algunos productos. Por favor, revise su carrito.")
        toast({
          title: "Error de stock",
          description: "No hay suficiente stock para algunos productos. Por favor, revise su carrito.",
          variant: "destructive",
        })
        return
      }

      // Preparamos los datos para la API
      const checkoutData = {
        metodoPago,
        direccionEntrega: direccionEntrega.trim() || undefined,
      }

      console.log("Enviando datos para confirmar compra:", checkoutData)

      // Llamamos a la API para confirmar la compra
      const factura = await confirmarCompra(checkoutData)

      console.log("Compra confirmada, factura generada:", factura)

      // Preparar los datos para el PDF
      const datosPDF = {
        numero: factura.numero || factura.id,
        fecha: factura.fecha || new Date().toISOString(),
        cliente: {
          nombre: checkoutSummary.clienteNombre,
          email: checkoutSummary.clienteEmail
        },
        productos: checkoutSummary.items.map((item: any) => ({
          nombre: item.nombre,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.subtotal
        })),
        total: checkoutSummary.total,
        metodoPago,
        direccionEntrega: direccionEntrega.trim() || undefined
      };

      try {
        // Mostrar la ventana de impresión para guardar o imprimir el PDF
        // Pasamos true para activar descarga directa
        printInvoice(datosPDF, true);
        
        toast({
          title: "Factura generada",
          description: "Se ha abierto una ventana para guardar o imprimir su factura",
        });
      } catch (pdfError) {
        console.error("Error al generar el PDF de la factura:", pdfError);
        // Continuamos con el flujo aunque falle la generación del PDF
      }

      // Limpiamos el carrito después de la compra exitosa
      await clearCart()

      toast({
        title: "Compra realizada",
        description: `Tu compra ha sido procesada correctamente. Factura #${factura.numero || factura.id} generada.`,
      })

      // Avanzamos al paso de confirmación
      setCheckoutStep("confirmation")

      // Esperamos un momento antes de redirigir para que el usuario vea el mensaje
      setTimeout(() => {
        // Redirigimos a la página de facturas
        router.push("/dashboard/facturas")
      }, 3000)
    } catch (error: any) {
      console.error("Error al procesar la compra:", error)
      setError(error.message || "No se pudo procesar la compra. Intente nuevamente.")
      toast({
        title: "Error",
        description: "No se pudo procesar la compra. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Función para volver al carrito desde el resumen
  const handleBackToCart = () => {
    setCheckoutStep("cart")
    setCheckoutSummary(null)
  }

  // Renderizar el paso de carrito
  const renderCartStep = () => {
    // Si el carrito está cargando, mostrar un indicador de carga
    if (cartLoading) {
      return (
        <div className="flex h-full items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
        </div>
      );
    }
    
    // Si el carrito no existe o hay un error, mostrar mensaje apropiado
    if (!cartItems || cartError) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-xl font-medium mb-2">No se pudo cargar el carrito</p>
            <p className="text-muted-foreground mb-6">{cartError || "Hubo un problema al cargar tu carrito de compras."}</p>
            <Button onClick={refreshCart}>
              <RefreshCw className="h-4 w-4 mr-2" /> Intentar nuevamente
            </Button>
          </CardContent>
        </Card>
      );
    }
    
    // Si el carrito está vacío
    if (cartItems.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl font-medium mb-2">Tu carrito está vacío</p>
            <p className="text-muted-foreground mb-6">Añade productos a tu carrito para continuar.</p>
            <Button asChild>
              <Link href="/dashboard/productos">Ver productos</Link>
            </Button>
          </CardContent>
        </Card>
      );
    }
    
    // Si el carrito tiene productos
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Productos en tu carrito</CardTitle>
              <CardDescription>Tienes {cartItems.length} productos en tu carrito</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.map((item: CartItem) => (
                <div key={item.productoId} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-md flex items-center justify-center">
                      {item.imagen ? (
                        <img
                          src={item.imagen || "/placeholder.svg"}
                          alt={item.nombre}
                          className="w-full h-full object-cover rounded-md"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=64&width=64"
                            e.currentTarget.onerror = null
                          }}
                        />
                      ) : (
                        <ShoppingCart className="h-8 w-8 text-primary/50" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{item.nombre}</h3>
                      <p className="text-sm text-muted-foreground">${item.precioUnitario} por unidad</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-r-none"
                        onClick={() => updateQuantity(item.productoId, item.cantidad - 1)}
                        disabled={cartLoading || item.cantidad <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={item.cantidad}
                        onChange={(e) => updateQuantity(item.productoId, Number.parseInt(e.target.value) || 1)}
                        className="h-8 w-12 rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        min="1"
                        disabled={cartLoading}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-l-none"
                        onClick={() => updateQuantity(item.productoId, item.cantidad + 1)}
                        disabled={cartLoading}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="w-20 text-right font-medium">${item.subtotal.toFixed(2)}</div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      onClick={() => removeItem(item.productoId)}
                      disabled={cartLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={clearCart} disabled={cartLoading}>
                Vaciar carrito
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Resumen de compra</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${getTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Impuestos</span>
                <span>Incluidos</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${getTotal().toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={handleGetCheckoutSummary}
                disabled={loading || cartLoading || cartItems.length === 0}
              >
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" /> Proceder al checkout
                  </div>
                )}
              </Button>
            </CardFooter>
          </Card>

          <div className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Información importante</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-start gap-1">
                    <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>Se generará una factura automáticamente al finalizar la compra.</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>Podrás descargar tu factura desde la sección "Mis Facturas".</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar el paso de resumen
  const renderSummaryStep = () => {
    if (!checkoutSummary) return null

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumen de tu compra</CardTitle>
            <CardDescription>Revisa los detalles antes de confirmar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Información del cliente</h3>
              <div className="bg-muted p-3 rounded-md">
                <p>
                  <span className="font-medium">Nombre:</span> {checkoutSummary.clienteNombre}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {checkoutSummary.clienteEmail}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Productos</h3>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">Producto</th>
                      <th className="text-center p-2">Cantidad</th>
                      <th className="text-right p-2">Precio</th>
                      <th className="text-right p-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkoutSummary.items.map((item: CartItem, index: number) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{item.nombre}</td>
                        <td className="text-center p-2">{item.cantidad}</td>
                        <td className="text-right p-2">${item.precioUnitario.toFixed(2)}</td>
                        <td className="text-right p-2">${item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted">
                    <tr>
                      <td colSpan={3} className="text-right p-2 font-medium">
                        Total:
                      </td>
                      <td className="text-right p-2 font-bold">${checkoutSummary.total.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {!checkoutSummary.stockDisponible && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error de stock</AlertTitle>
                <AlertDescription>
                  No hay suficiente stock para algunos productos. Por favor, revise su carrito.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Información de pago</h3>

              <div className="space-y-2">
                <label htmlFor="metodoPago" className="text-sm font-medium">
                  Método de pago
                </label>
                <Select value={metodoPago} onValueChange={setMetodoPago}>
                  <SelectTrigger id="metodoPago">
                    <SelectValue placeholder="Seleccionar método de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                    <SelectItem value="TARJETA">Tarjeta de crédito/débito</SelectItem>
                    <SelectItem value="TRANSFERENCIA">Transferencia bancaria</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="direccionEntrega" className="text-sm font-medium">
                  Dirección de entrega (opcional)
                </label>
                <Input
                  id="direccionEntrega"
                  placeholder="Ingrese dirección de entrega"
                  value={direccionEntrega}
                  onChange={(e) => setDireccionEntrega(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleBackToCart} disabled={loading}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver al carrito
            </Button>
            <Button onClick={handleConfirmCheckout} disabled={loading || !checkoutSummary.stockDisponible}>
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando...
                </div>
              ) : (
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" /> Confirmar compra
                </div>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Renderizar el paso de confirmación
  const renderConfirmationStep = () => {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">¡Compra realizada con éxito!</h2>
          <p className="text-center text-muted-foreground mb-6">
            Tu compra ha sido procesada correctamente. Se ha generado una factura que puedes consultar en tu historial.
          </p>
          <p className="text-center text-muted-foreground mb-6">
            Serás redirigido a la página de facturas en unos segundos...
          </p>
          <Button asChild>
            <Link href="/dashboard/facturas">Ver mis facturas</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Mi Carrito</h1>
        {checkoutStep === "cart" && (
          <Button variant="outline" asChild>
            <Link href="/dashboard/productos" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Seguir comprando
            </Link>
          </Button>
        )}
      </div>

      {(error || cartError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || cartError}</AlertDescription>
        </Alert>
      )}

      {checkoutStep === "cart" && renderCartStep()}
      {checkoutStep === "summary" && renderSummaryStep()}
      {checkoutStep === "confirmation" && renderConfirmationStep()}
    </div>
  )
}
