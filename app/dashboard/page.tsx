"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

export default function DashboardPage() {
  const { user, isAdmin, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Solo ejecutar una vez cuando el componente se monta y los datos están listos
    if (!loading && user) {
      console.log("Dashboard: Usuario cargado", user, "Es admin:", isAdmin, "Roles:", user?.roles)
      
      // Usar un timeout para asegurarnos de que la redirección se ejecute solo una vez
      // y después de que el componente esté completamente montado
      const redirectTimeout = setTimeout(() => {
        if (isAdmin) {
          console.log("Redirigiendo a dashboard admin (una sola vez)")
          router.replace("/dashboard/admin") // Usar replace en lugar de push para no añadir a la historia
        } else {
          console.log("Redirigiendo a dashboard cliente (una sola vez)")
          router.replace("/dashboard/cliente") // Usar replace en lugar de push para no añadir a la historia
        }
      }, 100)
      
      // Limpiar el timeout si el componente se desmonta
      return () => clearTimeout(redirectTimeout)
    }
  }, [user, isAdmin, loading]) // Eliminar pathname y router de las dependencias

  return (
    <div className="flex h-full items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  )
}
