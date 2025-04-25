"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchCart, addToCart, updateCartItem as updateCartItemApi, removeFromCart as removeFromCartApi, clearCart as clearCartApi } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

// Definición de tipos
interface CartItem {
  productoId: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
  imagen?: string;
}

interface CartContextType {
  cartItems: CartItem[] | null;
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

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  // Verificar si el usuario es administrador
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  // Cargar el carrito al iniciar o cuando cambia el usuario
  useEffect(() => {
    if (isAuthenticated) {
      fetchCartItems();
    } else {
      setCartItems([]);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      setError(null);

      // Si es administrador, establecer un carrito vacío y no llamar a la API
      if (isAdmin) {
        console.log("Usuario es administrador. No cargando carrito.");
        setCartItems([]);
        setLoading(false);
        return;
      }

      const cartData = await fetchCart();
      setCartItems(cartData.items || []);
    } catch (error: any) {
      console.error("Error fetching cart:", error);
      setError(error.message || "Error al cargar el carrito");
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (product: any, quantity: number) => {
    // Si es administrador, mostrar mensaje y no hacer nada
    if (isAdmin) {
      console.log("Los administradores no pueden usar el carrito");
      return;
    }

    try {
      setLoading(true);
      await addToCart(product.id, quantity);
      await fetchCartItems(); // Recargar el carrito
    } catch (error: any) {
      console.error("Error adding item to cart:", error);
      setError(error.message || "Error al agregar producto al carrito");
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId: string) => {
    // Si es administrador, no hacer nada
    if (isAdmin) return;

    try {
      setLoading(true);
      await removeFromCartApi(productId);
      await fetchCartItems(); // Recargar el carrito
    } catch (error: any) {
      console.error("Error removing item from cart:", error);
      setError(error.message || "Error al eliminar producto del carrito");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    // Si es administrador, no hacer nada
    if (isAdmin) return;

    try {
      setLoading(true);
      if (quantity <= 0) {
        await removeFromCartApi(productId);
      } else {
        await updateCartItemApi(productId, quantity);
      }
      await fetchCartItems(); // Recargar el carrito
    } catch (error: any) {
      console.error("Error updating cart item quantity:", error);
      setError(error.message || "Error al actualizar cantidad del producto");
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    // Si es administrador, no hacer nada
    if (isAdmin) return;

    try {
      setLoading(true);
      await clearCartApi();
      setCartItems([]);
    } catch (error: any) {
      console.error("Error clearing cart:", error);
      setError(error.message || "Error al vaciar el carrito");
    } finally {
      setLoading(false);
    }
  };

  const refreshCart = async () => {
    // Si es administrador, simplemente establecer un carrito vacío
    if (isAdmin) {
      setCartItems([]);
      setLoading(false);
      return;
    }
    
    return fetchCartItems();
  };

  const getTotal = () => {
    if (!cartItems) return 0;
    return cartItems.reduce((total, item) => total + item.subtotal, 0);
  };

  const getItemCount = () => {
    if (!cartItems) return 0;
    return cartItems.reduce((count, item) => count + item.cantidad, 0);
  };

  const value = {
    cartItems,
    loading,
    error,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    refreshCart,
    getTotal,
    getItemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
