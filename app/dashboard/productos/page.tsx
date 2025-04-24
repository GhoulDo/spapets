"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Search, Filter, Plus, ShoppingBag, Tag, Package } from "lucide-react"
import { fetchProducts } from "@/lib/api"
import { useCart } from "@/context/cart-context"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

// Definición de interfaces necesarias
interface Producto {
  id: string
  nombre: string
  descripcion: string
  precio: number
  stock: number
  categoria?: string
  estado?: string
  imagen?: string
  disponible?: boolean
}

export default function ProductosPage() {
  const { toast } = useToast()
  const { addItem, getItemCount } = useCart()
  const [products, setProducts] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null)
  const [openProductDetails, setOpenProductDetails] = useState(false)

  // Filtros
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [categoryFilter, setCategoryFilter] = useState("todos")
  const [sortOrder, setSortOrder] = useState("nombre-asc")
  const [stockFilter, setStockFilter] = useState("todos")

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchProducts()

      // Encontrar el precio máximo para el slider
      const maxPrice = Math.max(...data.map((product: Producto) => product.precio), 1000)
      setPriceRange([0, maxPrice])

      setProducts(data)
    } catch (error) {
      console.error("Error loading products:", error)
      setError("No se pudieron cargar los productos. Intente nuevamente.")
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product: Producto, quantity = 1) => {
    addItem(product, quantity)
  }

  const handleViewDetails = (product: Producto) => {
    setSelectedProduct(product)
    setOpenProductDetails(true)
  }

  // Obtener categorías únicas
  const categories = ["todos", ...new Set(products.map((product) => product.categoria || "Sin categoría"))]

  // Aplicar filtros y ordenamiento
  const filteredProducts = products
    .filter(
      (product) =>
        (searchTerm === "" ||
          product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.descripcion && product.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))) &&
        product.precio >= priceRange[0] &&
        product.precio <= priceRange[1] &&
        (categoryFilter === "todos" || product.categoria === categoryFilter) &&
        (stockFilter === "todos" ||
          (stockFilter === "disponible" && product.stock > 0) ||
          (stockFilter === "agotado" && product.stock === 0)),
    )
    .sort((a, b) => {
      switch (sortOrder) {
        case "nombre-asc":
          return a.nombre.localeCompare(b.nombre)
        case "nombre-desc":
          return b.nombre.localeCompare(a.nombre)
        case "precio-asc":
          return a.precio - b.precio
        case "precio-desc":
          return b.precio - a.precio
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
        <h1 className="text-3xl font-bold text-gray-800">Productos</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard/carrito" className="flex items-center gap-1">
            <ShoppingCart className="h-4 w-4" />
            <span>Carrito ({getItemCount()})</span>
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Buscar productos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nombre-asc">Nombre (A-Z)</SelectItem>
              <SelectItem value="nombre-desc">Nombre (Z-A)</SelectItem>
              <SelectItem value="precio-asc">Precio (menor a mayor)</SelectItem>
              <SelectItem value="precio-desc">Precio (mayor a menor)</SelectItem>
            </SelectContent>
          </Select>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filtros</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
                <SheetDescription>Ajusta los filtros para encontrar los productos que buscas</SheetDescription>
              </SheetHeader>
              <div className="py-4 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Rango de precio</h3>
                  <div className="pt-4">
                    <Slider
                      defaultValue={priceRange}
                      min={0}
                      max={Math.max(...products.map((product) => product.precio), 1000)}
                      step={10}
                      onValueChange={setPriceRange}
                    />
                    <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Categoría</h3>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category === "todos" ? "Todas las categorías" : category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Disponibilidad</h3>
                  <Select value={stockFilter} onValueChange={setStockFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar disponibilidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los productos</SelectItem>
                      <SelectItem value="disponible">En stock</SelectItem>
                      <SelectItem value="agotado">Agotados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button
                    onClick={() => {
                      // Resetear filtros
                      setPriceRange([0, Math.max(...products.map((product) => product.precio), 1000)])
                      setCategoryFilter("todos")
                      setStockFilter("todos")
                    }}
                  >
                    Resetear filtros
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl font-medium mb-2">No se encontraron productos</p>
            <p className="text-muted-foreground mb-6">Intenta con otros filtros o términos de búsqueda</p>
            <Button
              onClick={() => {
                setSearchTerm("")
                setPriceRange([0, Math.max(...products.map((product) => product.precio), 1000)])
                setCategoryFilter("todos")
                setStockFilter("todos")
              }}
            >
              Limpiar filtros
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden flex flex-col">
              <div className="aspect-square bg-gray-100 relative">
                {product.imagen ? (
                  <img
                    src={product.imagen || "/placeholder.svg"}
                    alt={product.nombre}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=200&width=200"
                      e.currentTarget.onerror = null
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="h-16 w-16 text-gray-300" />
                  </div>
                )}
                {product.estado && (
                  <Badge
                    className={`absolute top-2 right-2 ${
                      product.estado === "ACTIVO" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                    variant="outline"
                  >
                    {product.estado}
                  </Badge>
                )}
              </div>
              <CardHeader className="p-4 pb-0">
                <CardTitle className="text-lg">{product.nombre}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {product.categoria || "Sin categoría"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.descripcion || "Sin descripción disponible"}
                </p>
                <div className="mt-2 flex justify-between items-center">
                  <p className="font-bold text-lg">${product.precio}</p>
                  <Badge
                    variant="outline"
                    className={product.stock > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                  >
                    {product.stock > 0 ? `Stock: ${product.stock}` : "Agotado"}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => handleViewDetails(product)}>
                  Detalles
                </Button>
                <Button className="flex-1" onClick={() => handleAddToCart(product)} disabled={product.stock <= 0}>
                  <Plus className="h-4 w-4 mr-1" /> Añadir
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de detalles del producto */}
      <Sheet open={openProductDetails} onOpenChange={setOpenProductDetails}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Detalles del producto</SheetTitle>
          </SheetHeader>
          {selectedProduct && (
            <div className="py-4 space-y-4">
              <div className="aspect-square bg-gray-100 rounded-md overflow-hidden">
                {selectedProduct.imagen ? (
                  <img
                    src={selectedProduct.imagen || "/placeholder.svg"}
                    alt={selectedProduct.nombre}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=300&width=300"
                      e.currentTarget.onerror = null
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="h-24 w-24 text-gray-300" />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold">{selectedProduct.nombre}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{selectedProduct.categoria || "Sin categoría"}</Badge>
                  {selectedProduct.estado && (
                    <Badge
                      variant="outline"
                      className={
                        selectedProduct.estado === "ACTIVO"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {selectedProduct.estado}
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-1">Descripción</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedProduct.descripcion || "Sin descripción disponible"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Precio</h4>
                  <p className="text-xl font-bold">${selectedProduct.precio}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Disponibilidad</h4>
                  <Badge
                    variant="outline"
                    className={
                      selectedProduct.stock > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }
                  >
                    {selectedProduct.stock > 0 ? `Stock: ${selectedProduct.stock}` : "Agotado"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setOpenProductDetails(false)}>
                  Cerrar
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    handleAddToCart(selectedProduct)
                    setOpenProductDetails(false)
                  }}
                  disabled={selectedProduct.stock <= 0}
                >
                  <Plus className="h-4 w-4 mr-1" /> Añadir al carrito
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
