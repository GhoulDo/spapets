"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Eye, RefreshCw, UserPlus } from "lucide-react"
import { fetchClients } from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

// Definir la interfaz para el cliente
interface Cliente {
  id: string;
  username: string;
  email: string;
  telefono?: string;
  direccion?: string;
}

export default function AdminClientsPage() {
  const { toast } = useToast()
  const [clients, setClients] = useState<Cliente[]>([])
  const [filteredClients, setFilteredClients] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    filterClients()
  }, [clients, searchTerm])

  const loadClients = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Cargando clientes...")

      // Verificar que el token esté disponible
      const token = localStorage.getItem("token")
      if (!token) {
        setError("No se encontró el token de autenticación. Por favor, inicie sesión nuevamente.")
        setLoading(false)
        return
      }

      const data = await fetchClients()
      console.log(`Se encontraron ${data.length} clientes`)
      setClients(data)
      setFilteredClients(data)
    } catch (error: any) {
      console.error("Error loading clients:", error)
      setError(error.message || "No se pudieron cargar los clientes. Intente nuevamente.")
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterClients = () => {
    if (!searchTerm) {
      setFilteredClients(clients)
      return
    }

    const filtered = clients.filter(
      (client) =>
        client.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.telefono && client.telefono.includes(searchTerm)),
    )
    setFilteredClients(filtered)
  }

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
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Clientes</h1>
        <div className="flex gap-2">
          <Button onClick={loadClients} variant="outline" className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4" /> Actualizar
          </Button>
          <Button className="bg-green-700 hover:bg-green-800">
            <UserPlus className="h-4 w-4 mr-2" /> Nuevo Cliente
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
          <CardDescription>Administra los clientes de la peluquería</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar clientes..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No se encontraron clientes
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.username}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.telefono || "-"}</TableCell>
                      <TableCell>{client.direccion || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
