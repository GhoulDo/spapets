"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertCircle, Scissors, Shield, Dog, Cat, PawPrintIcon as Paw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { checkBackendConnection } from "@/lib/api"
import { motion } from "framer-motion"

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, {
    message: "La contraseña debe tener al menos 6 caracteres",
  }),
})

export function LoginForm() {
  const { login } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<{
    checking: boolean
    connected: boolean
    message: string | null
  }>({
    checking: true,
    connected: false,
    message: null,
  })

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Verificar la conexión con el backend al cargar el componente
  useEffect(() => {
    const verifyConnection = async () => {
      try {
        const result = await checkBackendConnection()
        setConnectionStatus({
          checking: false,
          connected: result.connected,
          message: result.connected ? null : "No se pudo conectar con el servidor. Verifica tu conexión a internet.",
        })
      } catch (error) {
        console.error("Error verificando conexión:", error)
        setConnectionStatus({
          checking: false,
          connected: false,
          message: "Error al verificar la conexión con el servidor.",
        })
      }
    }

    verifyConnection()
  }, [])

  // Mejorar el manejo del login y la redirección

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true)
    setLoginError(null)

    try {
      const { user, isAdmin } = await login(values.email, values.password)
      console.log("Login exitoso:", user, "Es admin:", isAdmin, "Rol:", user.rol)

      // Mostrar un mensaje específico según el rol del usuario
      if (isAdmin) {
        toast({
          title: "¡Bienvenido, Administrador!",
          description: "Has iniciado sesión en el panel de administración de PetSPA",
          icon: <Shield className="h-5 w-5 text-green-600" />,
        })

        // Pequeño retraso para asegurar que el toast se muestre antes de la redirección
        setTimeout(() => {
          router.push("/dashboard/admin")
        }, 1000)
      } else {
        toast({
          title: "¡Bienvenido a PetSPA!",
          description: "Has iniciado sesión correctamente",
          icon: <Paw className="h-5 w-5 text-pet-primary" />,
        })

        // Pequeño retraso para asegurar que el toast se muestre antes de la redirección
        setTimeout(() => {
          router.push("/dashboard/cliente")
        }, 1000)
      }
    } catch (error: any) {
      console.error("Login error:", error)
      setLoginError(error.message || "Error de inicio de sesión. Intente nuevamente.")
      toast({
        title: "Error de inicio de sesión",
        description: error.message || "Credenciales incorrectas. Por favor, inténtelo nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pet-blue/10 to-pet-primary/10 p-4">
      <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="w-full shadow-lg border-pet-secondary/20 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-pet-primary via-pet-secondary to-pet-tertiary w-full"></div>
            <CardHeader className="space-y-1 flex flex-col items-center pt-8 pb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pet-primary to-pet-secondary flex items-center justify-center mb-4 shadow-md">
                <Paw className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl text-center text-pet-primary">PetSPA</CardTitle>
              <CardDescription className="text-center max-w-xs mx-auto">
                Tu centro de belleza y cuidado para mascotas. Ingresa tus credenciales para acceder.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-8">
              {connectionStatus.checking ? (
                <div className="flex justify-center py-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-pet-primary"></div>
                </div>
              ) : !connectionStatus.connected ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error de conexión</AlertTitle>
                  <AlertDescription>
                    {connectionStatus.message || "No se pudo conectar con el servidor. Intente más tarde."}
                  </AlertDescription>
                </Alert>
              ) : null}

              {loginError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error de inicio de sesión</AlertTitle>
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-pet-primary">Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="correo@ejemplo.com"
                            type="email"
                            {...field}
                            disabled={isLoading || !connectionStatus.connected}
                            autoComplete="email"
                            className="border-pet-secondary/30 focus-visible:ring-pet-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-pet-primary">Contraseña</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="******"
                            type="password"
                            {...field}
                            disabled={isLoading || !connectionStatus.connected}
                            autoComplete="current-password"
                            className="border-pet-secondary/30 focus-visible:ring-pet-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-pet-primary to-pet-secondary hover:from-pet-primary/90 hover:to-pet-secondary/90 text-white"
                    disabled={isLoading || !connectionStatus.connected}
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin mr-2">⟳</span> Iniciando sesión...
                      </>
                    ) : (
                      "Iniciar sesión"
                    )}
                  </Button>
                </form>
              </Form>
              <div className="text-center text-sm mt-6">
                ¿No tienes una cuenta?{" "}
                <Link href="/register" className="text-pet-primary hover:text-pet-primary/80 font-medium">
                  Regístrate
                </Link>
              </div>

              {/* Decoración de fondo */}
              <div className="flex justify-center mt-8 space-x-4">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, ease: "easeInOut" }}
                >
                  <Dog className="h-6 w-6 text-pet-primary/40" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, delay: 0.3, ease: "easeInOut" }}
                >
                  <Cat className="h-6 w-6 text-pet-secondary/40" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, delay: 0.6, ease: "easeInOut" }}
                >
                  <Scissors className="h-6 w-6 text-pet-tertiary/40" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
