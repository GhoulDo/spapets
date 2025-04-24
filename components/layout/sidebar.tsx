"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import {
  Calendar,
  Dog,
  FileText,
  Home,
  LogOut,
  Menu,
  Scissors,
  Settings,
  ShoppingBag,
  User,
  Users,
  X,
  Shield,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout, isAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const [adminMenuOpen, setAdminMenuOpen] = useState(true)
  const [clientMenuOpen, setClientMenuOpen] = useState(true)
  const [collapsed, setCollapsed] = useState(false)

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Guardar el estado de colapso en localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebar-collapsed")
    if (savedCollapsed) {
      setCollapsed(savedCollapsed === "true")
    }
  }, [])

  const toggleCollapsed = () => {
    const newState = !collapsed
    setCollapsed(newState)
    localStorage.setItem("sidebar-collapsed", String(newState))
  }

  return (
    <>
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar backdrop for mobile */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out md:translate-x-0 shadow-lg",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700 justify-between">
            <Link
              href="/dashboard"
              className={cn("flex items-center gap-2 font-semibold", collapsed && "justify-center")}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary text-white">
                <Scissors className="h-5 w-5" />
              </div>
              {!collapsed && (
                <>
                  <span className="text-xl">PetSPA</span>
                  {isAdmin && (
                    <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/20">
                      Admin
                    </Badge>
                  )}
                </>
              )}
            </Link>

            {/* Collapse button - only visible on desktop */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="px-4 space-y-1">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <NavItem
                        href="/dashboard"
                        icon={Home}
                        label={collapsed ? "" : "Dashboard"}
                        active={pathname === "/dashboard"}
                        collapsed={collapsed}
                      />
                    </div>
                  </TooltipTrigger>
                  {collapsed && <TooltipContent side="right">Dashboard</TooltipContent>}
                </Tooltip>
              </TooltipProvider>

              {isAdmin ? (
                <div className="mt-2 space-y-1">
                  {collapsed ? (
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="flex items-center justify-center w-full p-2 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => !collapsed && setAdminMenuOpen(!adminMenuOpen)}
                          >
                            <Shield className="h-5 w-5 text-primary" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Administración</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <Collapsible open={adminMenuOpen} onOpenChange={setAdminMenuOpen}>
                      <CollapsibleTrigger asChild>
                        <button className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
                          <Shield className="h-5 w-5 mr-3 text-primary" />
                          <span>Administración</span>
                          {adminMenuOpen ? (
                            <ChevronUp className="ml-auto h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="ml-auto h-5 w-5 text-gray-500" />
                          )}
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-4 space-y-1 mt-1 animate-slide-down">
                        <NavItem
                          href="/dashboard/admin/clientes"
                          icon={Users}
                          label="Clientes"
                          active={pathname.includes("/admin/clientes")}
                          collapsed={collapsed}
                        />
                        <NavItem
                          href="/dashboard/admin/servicios"
                          icon={Scissors}
                          label="Servicios"
                          active={pathname.includes("/admin/servicios")}
                          collapsed={collapsed}
                        />
                        <NavItem
                          href="/dashboard/admin/productos"
                          icon={ShoppingBag}
                          label="Productos"
                          active={pathname.includes("/admin/productos")}
                          collapsed={collapsed}
                        />
                        <NavItem
                          href="/dashboard/admin/citas"
                          icon={Calendar}
                          label="Citas"
                          active={pathname.includes("/admin/citas")}
                          collapsed={collapsed}
                        />
                        <NavItem
                          href="/dashboard/admin/facturas"
                          icon={FileText}
                          label="Facturas"
                          active={pathname.includes("/admin/facturas")}
                          collapsed={collapsed}
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {collapsed && (
                    <div className="space-y-1 mt-2">
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <NavItem
                                href="/dashboard/admin/clientes"
                                icon={Users}
                                label=""
                                active={pathname.includes("/admin/clientes")}
                                collapsed={true}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right">Clientes</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <NavItem
                                href="/dashboard/admin/servicios"
                                icon={Scissors}
                                label=""
                                active={pathname.includes("/admin/servicios")}
                                collapsed={true}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right">Servicios</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <NavItem
                                href="/dashboard/admin/productos"
                                icon={ShoppingBag}
                                label=""
                                active={pathname.includes("/admin/productos")}
                                collapsed={true}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right">Productos</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <NavItem
                                href="/dashboard/admin/citas"
                                icon={Calendar}
                                label=""
                                active={pathname.includes("/admin/citas")}
                                collapsed={true}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right">Citas</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <NavItem
                                href="/dashboard/admin/facturas"
                                icon={FileText}
                                label=""
                                active={pathname.includes("/admin/facturas")}
                                collapsed={true}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right">Facturas</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2 space-y-1">
                  {collapsed ? (
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="flex items-center justify-center w-full p-2 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Sparkles className="h-5 w-5 text-primary" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Mis Servicios</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <Collapsible open={clientMenuOpen} onOpenChange={setClientMenuOpen}>
                      <CollapsibleTrigger asChild>
                        <button className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
                          <Sparkles className="h-5 w-5 mr-3 text-primary" />
                          <span>Mis Servicios</span>
                          {clientMenuOpen ? (
                            <ChevronUp className="ml-auto h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="ml-auto h-5 w-5 text-gray-500" />
                          )}
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-4 space-y-1 mt-1 animate-slide-down">
                        <NavItem
                          href="/dashboard/mascotas"
                          icon={Dog}
                          label="Mis Mascotas"
                          active={pathname.includes("/mascotas") && !pathname.includes("/admin")}
                          collapsed={collapsed}
                        />
                        <NavItem
                          href="/dashboard/citas"
                          icon={Calendar}
                          label="Mis Citas"
                          active={pathname.includes("/citas") && !pathname.includes("/admin")}
                          collapsed={collapsed}
                        />
                        <NavItem
                          href="/dashboard/facturas"
                          icon={FileText}
                          label="Mis Facturas"
                          active={pathname.includes("/facturas") && !pathname.includes("/admin")}
                          collapsed={collapsed}
                        />
                        <NavItem
                          href="/dashboard/productos"
                          icon={ShoppingBag}
                          label="Productos"
                          active={pathname.includes("/productos") && !pathname.includes("/admin")}
                          collapsed={collapsed}
                        />
                        <NavItem
                          href="/dashboard/carrito"
                          icon={ShoppingCart}
                          label="Carrito"
                          active={pathname.includes("/carrito")}
                          collapsed={collapsed}
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {collapsed && (
                    <div className="space-y-1 mt-2">
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <NavItem
                                href="/dashboard/mascotas"
                                icon={Dog}
                                label=""
                                active={pathname.includes("/mascotas") && !pathname.includes("/admin")}
                                collapsed={true}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right">Mis Mascotas</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <NavItem
                                href="/dashboard/citas"
                                icon={Calendar}
                                label=""
                                active={pathname.includes("/citas") && !pathname.includes("/admin")}
                                collapsed={true}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right">Mis Citas</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <NavItem
                                href="/dashboard/facturas"
                                icon={FileText}
                                label=""
                                active={pathname.includes("/facturas") && !pathname.includes("/admin")}
                                collapsed={true}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right">Mis Facturas</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <NavItem
                                href="/dashboard/productos"
                                icon={ShoppingBag}
                                label=""
                                active={pathname.includes("/productos") && !pathname.includes("/admin")}
                                collapsed={true}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right">Productos</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <NavItem
                                href="/dashboard/carrito"
                                icon={ShoppingCart}
                                label=""
                                active={pathname.includes("/carrito")}
                                collapsed={true}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right">Carrito</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              )}
            </nav>
          </ScrollArea>

          {/* User section */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            {collapsed ? (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex mt-2 gap-1">
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" asChild className="h-8 w-8">
                          <Link href="/dashboard/perfil">
                            <Settings className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Perfil</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={logout} className="h-8 w-8">
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Salir</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{user?.username || "Usuario"}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href="/dashboard/perfil">
                      <Settings className="h-4 w-4 mr-1" /> Perfil
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={logout}>
                    <LogOut className="h-4 w-4 mr-1" /> Salir
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

interface NavItemProps {
  href: string
  icon: React.ElementType
  label: string
  active?: boolean
  collapsed?: boolean
}

function NavItem({ href, icon: Icon, label, active, collapsed }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        collapsed && "justify-center px-2",
        active
          ? "bg-primary/10 text-primary"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
      )}
    >
      <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-gray-500 dark:text-gray-400")} />
      {!collapsed && label}
    </Link>
  )
}
