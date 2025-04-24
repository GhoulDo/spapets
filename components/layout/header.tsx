"use client"

import { useAuth } from "@/context/auth-context"
import { usePathname } from "next/navigation"
import { Bell, User, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export function Header() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const isAdmin = user?.role === "ADMIN"
  const isAdminRoute = pathname.includes("/admin")

  // Función para obtener el título de la página actual
  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard"
    if (pathname.includes("/mascotas")) return "Mis Mascotas"
    if (pathname.includes("/citas") && !isAdminRoute) return "Mis Citas"
    if (pathname.includes("/facturas") && !isAdminRoute) return "Mis Facturas"
    if (pathname.includes("/perfil")) return "Mi Perfil"

    // Rutas de administrador
    if (pathname.includes("/admin/clientes")) return "Gestión de Clientes"
    if (pathname.includes("/admin/servicios")) return "Gestión de Servicios"
    if (pathname.includes("/admin/productos")) return "Gestión de Productos"
    if (pathname.includes("/admin/citas")) return "Gestión de Citas"
    if (pathname.includes("/admin/facturas")) return "Gestión de Facturas"

    return "PetSPA"
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 md:px-6">
      <div className="flex items-center md:hidden">
        {isAdminRoute && (
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/dashboard">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
        )}
      </div>

      <div className="flex-1">
        <h1 className="text-lg font-semibold md:text-xl">
          {getPageTitle()}
          {isAdminRoute && (
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
              Modo Administrador
            </Badge>
          )}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full border border-gray-200">
              <User className="h-5 w-5" />
              <span className="sr-only">Perfil de usuario</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div>
                <div>{user?.username || "Usuario"}</div>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
                {isAdmin && (
                  <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">
                    Administrador
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/perfil">Perfil</Link>
            </DropdownMenuItem>
            {isAdmin && !isAdminRoute && (
              <DropdownMenuItem asChild>
                <Link href="/dashboard/admin/servicios">Modo Administrador</Link>
              </DropdownMenuItem>
            )}
            {isAdmin && isAdminRoute && (
              <DropdownMenuItem asChild>
                <Link href="/dashboard">Modo Cliente</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>Cerrar sesión</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
