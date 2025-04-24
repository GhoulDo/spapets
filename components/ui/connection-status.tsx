"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { WifiOff } from "lucide-react"
import { checkBackendConnection } from "@/lib/api"
import { Button } from "@/components/ui/button"

export function ConnectionStatus() {
  const [status, setStatus] = useState<{
    checking: boolean
    connected: boolean
    message: string | null
    lastChecked: Date | null
  }>({
    checking: true,
    connected: false,
    message: null,
    lastChecked: null,
  })

  const checkConnection = async () => {
    setStatus((prev) => ({ ...prev, checking: true }))
    try {
      const result = await checkBackendConnection()
      setStatus({
        checking: false,
        connected: result.connected,
        message: result.connected ? null : "No se pudo conectar con el servidor. Verifica tu conexión a internet.",
        lastChecked: new Date(),
      })
    } catch (error) {
      setStatus({
        checking: false,
        connected: false,
        message: "Error al verificar la conexión con el servidor.",
        lastChecked: new Date(),
      })
    }
  }

  useEffect(() => {
    checkConnection()

    // Verificar la conexión cada 30 segundos
    const interval = setInterval(checkConnection, 30000)

    return () => clearInterval(interval)
  }, [])

  if (status.checking) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-700 mr-2"></div>
        <span className="text-sm">Verificando conexión...</span>
      </div>
    )
  }

  if (!status.connected) {
    return (
      <Alert variant="destructive" className="mb-4">
        <WifiOff className="h-4 w-4" />
        <AlertTitle>Sin conexión</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>{status.message || "No se pudo conectar con el servidor. Intente más tarde."}</p>
          <Button size="sm" variant="outline" onClick={checkConnection} className="self-end">
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}
