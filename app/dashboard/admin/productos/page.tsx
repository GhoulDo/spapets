"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Search, Edit, Trash, ShoppingBag, DollarSign, Package, Filter } from "lucide-react"
import { fetchProducts, deleteProduct } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import { ProductFormDialog } from "@/components/products/product-form-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion } from "framer-motion"

// Definir interfaces para los datos
interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria?: string;
  disponible?: boolean;
}

export default function ProductsPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Producto[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [openForm, setOpenForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null)
  const [productToDelete, setProductToDelete] = useState<Producto | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sortOrder, setSortOrder] = useState("nombre-asc")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    filterAndSortProducts()
  }, [products, searchTerm, sortOrder, categoryFilter, stockFilter])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await fetchProducts()
      setProducts(data)
      setFilteredProducts(data)
    } catch (error) {
      console.error("Error loading products:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortProducts = () => {
    let result = [...products]

    // Filtrar por término de búsqueda
    if (searchTerm.trim() !== "") {
      result = result.filter(
        (product) =>
          product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.categoria?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtrar por categoría
    if (categoryFilter !== "all") {
      result = result.filter((product) => product.categoria === categoryFilter)
    }

    // Filtrar por stock
    if (stockFilter !== "all") {
      if (stockFilter === "inStock") {
        result = result.filter((product) => product.stock > 0)
      } else if (stockFilter === "outOfStock") {
        result = result.filter((product) => product.stock === 0)
      } else if (stockFilter === "lowStock") {
        result = result.filter((product) => product.stock > 0 && product.stock <= 5)
      }
    }

    // Ordenar
    result.sort((a, b) => {
      switch (sortOrder) {
        case "nombre-asc":
          return a.nombre.localeCompare(b.nombre)
        case "nombre-desc":
          return b.nombre.localeCompare(a.nombre)
        case "precio-asc":
          return a.precio - b.precio
        case "precio-desc":
          return b.precio - a.precio
        case "stock-asc":
          return a.stock - b.stock
        case "stock-desc":
          return b.stock - a.stock
        default:
          return 0
      }
    })

    setFilteredProducts(result)
  }

  const handleAddProduct = () => {
    setEditingProduct(null)
    setOpenForm(true)
  }

  const handleEditProduct = (product: Producto) => {
    setEditingProduct(product)
    setOpenForm(true)
  }

  const handleDeleteClick = (product: Producto) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return

    setIsDeleting(true)
    try {
      await deleteProduct(productToDelete.id)
      setProducts(products.filter((p) => p.id !== productToDelete.id))
      toast({
        title: "Éxito",
        description: "Producto eliminado correctamente",
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }

  const handleProductSaved = (savedProduct: Producto) => {
    if (editingProduct) {
      setProducts(products.map((p) => (p.id === savedProduct.id ? savedProduct : p)))
    } else {
      setProducts([...products, savedProduct])
    }
    setOpenForm(false)
    toast({
      title: "Éxito",
      description: editingProduct ? "Producto actualizado correctamente" : "Producto creado correctamente",
    })
  }

  // Obtener categorías únicas para el filtro
  const categories = [...new Set(products.map((product) => product.categoria))].filter((category): category is string => Boolean(category))

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado con ilustración */}
      <div className="relative bg-gradient-to-r from-pet-tertiary/20 to-pet-blue/20 rounded-xl p-6 mb-8 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 z-10 relative">
          <div>
            <h1 className="text-3xl font-bold text-pet-tertiary">Gestión de Productos</h1>
            <p className="text-muted-foreground">Administra los productos disponibles en tu peluquería canina</p>
          </div>
          <Button onClick={handleAddProduct} className="rounded-full bg-pet-tertiary hover:bg-pet-tertiary/90">
            <PlusCircle className="h-4 w-4 mr-2" /> Nuevo Producto
          </Button>
        </div>

        {/* Decoración de fondo */}
        <div className="absolute right-0 bottom-0 opacity-20 w-40 h-40">
          <ShoppingBag className="h-full w-full" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Productos</CardTitle>
          <CardDescription>Administra los productos disponibles en la peluquería</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 w-full md:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar productos..."
                className="pl-8 rounded-full border-primary/20 focus-visible:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full border-primary/20">
                    <Filter className="h-4 w-4 mr-2" /> Categoría
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filtrar por categoría</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={categoryFilter} onValueChange={setCategoryFilter}>
                    <DropdownMenuRadioItem value="all">Todas las categorías</DropdownMenuRadioItem>
                    {categories.map((category) => (
                      <DropdownMenuRadioItem key={category} value={category!}>
                        {category}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full border-primary/20">
                    <Filter className="h-4 w-4 mr-2" /> Stock
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filtrar por stock</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={stockFilter} onValueChange={setStockFilter}>
                    <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="inStock">En stock</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="outOfStock">Sin stock</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="lowStock">Stock bajo (≤ 5)</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full border-primary/20">
                    <Filter className="h-4 w-4 mr-2" /> Ordenar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={sortOrder} onValueChange={setSortOrder}>
                    <DropdownMenuRadioItem value="nombre-asc">Nombre (A-Z)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="nombre-desc">Nombre (Z-A)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="precio-asc">Precio (menor a mayor)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="precio-desc">Precio (mayor a menor)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="stock-asc">Stock (menor a mayor)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="stock-desc">Stock (mayor a menor)</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={loadProducts} variant="outline" className="rounded-full border-primary/20">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" /> Precio
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      <Package className="h-4 w-4 mr-1" /> Stock
                    </div>
                  </TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <ShoppingBag className="h-12 w-12 mb-2 text-muted-foreground/50" />
                        <p>No se encontraron productos</p>
                        <Button
                          variant="link"
                          onClick={handleAddProduct}
                          className="mt-2 text-pet-tertiary hover:text-pet-tertiary/80"
                        >
                          Agregar un nuevo producto
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product, index) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="group"
                    >
                      <TableCell className="font-medium">{product.nombre}</TableCell>
                      <TableCell className="max-w-xs truncate">{product.descripcion}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-muted/50">
                          {product.categoria || "Sin categoría"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(product.precio)}</TableCell>
                      <TableCell>
                        <span
                          className={
                            product.stock === 0
                              ? "text-red-500 font-medium"
                              : product.stock <= 5
                                ? "text-amber-500 font-medium"
                                : ""
                          }
                        >
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            product.stock > 0 && product.disponible
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : product.stock === 0
                                ? "bg-red-100 text-red-800 hover:bg-red-200"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }
                        >
                          {product.stock > 0 && product.disponible
                            ? "Disponible"
                            : product.stock === 0
                              ? "Sin stock"
                              : "No disponible"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditProduct(product)}
                            className="h-8 w-8 rounded-full hover:bg-pet-tertiary/10 hover:text-pet-tertiary"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(product)}
                            className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ProductFormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        product={editingProduct}
        onSave={handleProductSaved}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el producto "{productToDelete?.nombre}" y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="rounded-full">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 rounded-full"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
