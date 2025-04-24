"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error capturado:", error, errorInfo)
    this.setState({ errorInfo })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = "/"
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="w-full max-w-md">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>¡Algo salió mal!</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-2">Se ha producido un error en la aplicación:</p>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                  {this.state.error?.message || "Error desconocido"}
                </p>
              </AlertDescription>
            </Alert>
            <div className="flex gap-2 justify-center">
              <Button onClick={this.handleReload} className="flex items-center gap-1">
                <RefreshCw className="h-4 w-4" /> Recargar página
              </Button>
              <Button variant="outline" onClick={this.handleGoHome}>
                Ir al inicio
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
