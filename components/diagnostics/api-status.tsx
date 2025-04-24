"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, RefreshCw, Loader2 } from "lucide-react"
import { checkBackendConnection } from "@/lib/api"

export function ApiStatus() {
  const [status, setStatus] = useState<{
    checking: boolean
    connected: boolean
    message: string | null
    lastChecked: Date | null
    details: any
  }>({
    checking: true,
    connected: false,
    message: null,
    lastChecked: null,
    details: null,
  })

  const checkConnection = async () => {
    setStatus((prev) => ({ ...prev, checking: true }))
    try {
      const result = await checkBackendConnection()
      setStatus({
        checking: false,
        connected: result.connected,
        message: result.connected
          ? "Conexión establecida correctamente con el servidor."
          : "No se pudo conectar con el servidor. Verifica tu conexión a internet.",
        lastChecked: new Date(),
        details: result,
      })
    } catch (error) {
      setStatus({
        checking: false,
        connected: false,
        message: "Error al verificar la conexión con el servidor.",
        lastChecked: new Date(),
        details: error,
      })
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status.checking ? (
            <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
          ) : status.connected ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          Estado de la API
        </CardTitle>
        <CardDescription>Diagnóstico de conexión con el servidor de PetSPA</CardDescription>
      </CardHeader>
      <CardContent>
        {status.checking ? (
          <Alert className="bg-yellow-50 border-yellow-200">
            <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
            <AlertTitle>Verificando conexión...</AlertTitle>
            <AlertDescription>Estamos comprobando la conexión con el servidor de PetSPA.</AlertDescription>
          </Alert>
        ) : status.connected ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Conexión establecida</AlertTitle>
            <AlertDescription>
              {status.message}
              <div className="mt-2 text-xs text-gray-500">
                Última verificación: {status.lastChecked?.toLocaleTimeString()}
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error de conexión</AlertTitle>
            <AlertDescription>
              {status.message}
              <div className="mt-2 text-xs">Última verificación: {status.lastChecked?.toLocaleTimeString()}</div>
              {status.details && (
                <div className="mt-2 text-xs bg-red-50 p-2 rounded">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(status.details, null, 2)}</pre>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={checkConnection} variant="outline" className="w-full" disabled={status.checking}>
          {status.checking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" /> Verificar conexión
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
