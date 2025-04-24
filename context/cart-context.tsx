import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/context/auth-context'
import {
  addToCart,
  fetchCart,
  getCarrito,
  removeFromCart,
  updateCartItem,
  clearCart as clearCartAPI,
} from '@/lib/api'

// Definición de interfaces para el carrito
interface CartItem {
  id: string;
  productoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  addItem: (product: any, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

interface CartProviderProps {
  children: React.ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<CartState>({ items: [], loading: true, error: null })
  const { isAuthenticated, user } = useAuth()
  const { toast } = useToast()

  const loadCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [], loading: false, error: null })
      return
    }

    try {
      setCart((prev) => ({ ...prev, loading: true, error: null }))
      
      // Verificar si el usuario está autenticado y tiene token
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No se encontró token de autenticación")
      }
      
      // Intentar obtener el carrito
      const data = await fetchCart()
      
      // Asegurarse de que data.items exista, si no usar un array vacío
      const items = data?.items || []
      
      setCart({ items, loading: false, error: null })
    } catch (error: any) {
      console.error("Error loading cart:", error)
      // No mostrar el error en la UI si es un error 403 (probablemente el usuario no tenga permisos)
      // pero mantener un carrito vacío
      setCart({ items: [], loading: false, error: error.message })
    }
  }, [isAuthenticated])

  // Cargar el carrito cuando el usuario está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      loadCart()
    } else {
      // Si no está autenticado, inicializar con un carrito vacío
      setCart({ items: [], loading: false, error: null })
    }
  }, [isAuthenticated, loadCart])

  const addItem = useCallback(async (product: any, quantity: number) => {
    try {
      setCart((prev) => ({ ...prev, loading: true, error: null }))
      await addToCart(product.id, quantity)
      await loadCart() // Recargar el carrito completo
      toast({
        title: "Producto añadido",
        description: `${product.nombre || product.name} añadido al carrito`,
      })
    } catch (error: any) {
      console.error("Error adding item to cart:", error)
      setCart((prev) => ({ ...prev, loading: false, error: error.message }))
      toast({
        title: "Error",
        description: error.message || "No se pudo añadir el producto al carrito",
        variant: "destructive",
      })
    }
  }, [loadCart, toast])

  const removeItem = useCallback(async (productId: string) => {
    try {
      setCart((prev) => ({ ...prev, loading: true, error: null }))
      await removeFromCart(productId)
      await loadCart() // Recargar el carrito completo
      toast({
        title: "Producto eliminado",
        description: "Producto eliminado del carrito",
      })
    } catch (error: any) {
      console.error("Error removing item from cart:", error)
      setCart((prev) => ({ ...prev, loading: false, error: error.message }))
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el producto del carrito",
        variant: "destructive",
      })
    }
  }, [loadCart, toast])

  // Función para actualizar la cantidad de un producto ya en el carrito
  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      return removeItem(productId)
    }

    try {
      setCart((prev) => ({ ...prev, loading: true, error: null }))
      await updateCartItem(productId, quantity)
      await loadCart() // Recargar el carrito completo
    } catch (error: any) {
      console.error("Error updating quantity:", error)
      setCart((prev) => ({ ...prev, loading: false, error: error.message }))
      
      // Mostrar toast con el error
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la cantidad del producto",
        variant: "destructive",
      })
    }
  }, [loadCart, removeItem, toast])

  const clearCartItems = useCallback(async () => {
    try {
      setCart((prev) => ({ ...prev, loading: true, error: null }))
      await clearCartAPI()
      setCart({ items: [], loading: false, error: null })
      toast({
        title: "Carrito vacío",
        description: "Se han eliminado todos los productos del carrito",
      })
    } catch (error: any) {
      console.error("Error clearing cart:", error)
      setCart((prev) => ({ ...prev, loading: false, error: error.message }))
      toast({
        title: "Error",
        description: error.message || "No se pudo vaciar el carrito",
        variant: "destructive",
      })
    }
  }, [toast])

  const getTotal = useCallback(() => {
    return cart.items.reduce((total, item) => total + item.precio * item.cantidad, 0)
  }, [cart.items])

  const getItemCount = useCallback(() => {
    return cart.items.reduce((count, item) => count + item.cantidad, 0)
  }, [cart.items])

  return (
    <CartContext.Provider
      value={{
        items: cart.items,
        loading: cart.loading,
        error: cart.error,
        addItem,
        removeItem,
        updateQuantity,
        clearCart: clearCartItems,
        refreshCart: loadCart,
        getTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
