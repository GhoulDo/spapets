"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { getUserProfile, updateUserProfile } from "@/lib/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

// Definir el esquema para el formulario de perfil
const profileSchema = z.object({
  username: z.string().min(3, {
    message: "El nombre de usuario debe tener al menos 3 caracteres",
  }),
  email: z.string().email({
    message: "Debe ser un email válido",
  }),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  nombre: z.string().optional(),
})

// Definir el esquema para el cambio de contraseña
const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, {
      message: "La contraseña actual debe tener al menos 6 caracteres",
    }),
    password: z.string().min(6, {
      message: "La nueva contraseña debe tener al menos 6 caracteres",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializar el formulario de perfil
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      email: "",
      telefono: "",
      direccion: "",
      nombre: ""
    }
  });

  // Inicializar el formulario de contraseña
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Usar exclusivamente getUserProfile que obtiene los datos de /auth/me
        console.log("Obteniendo datos del perfil desde el endpoint /auth/me");
        const userData = await getUserProfile();
        
        if (userData) {
          console.log("Datos del perfil obtenidos:", {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            // Datos sensibles omitidos del log
          });
          
          setProfileData(userData);
          
          // Resetear el formulario con los datos recibidos
          profileForm.reset({
            username: userData.username || "",
            email: userData.email || "",
            telefono: userData.telefono || "",
            direccion: userData.direccion || "",
            nombre: userData.nombre || ""
          });
        } else {
          throw new Error("No se recibieron datos del perfil");
        }
      } catch (error: any) {
        console.error("Error cargando perfil:", error);
        setError(error.message || "No se pudo cargar la información del perfil");
        toast({
          title: "Error",
          description: "No se pudo cargar la información del perfil. Intente nuevamente.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [toast, profileForm]);

  const onProfileSubmit = async (data: ProfileFormValues) => {
    try {
      setIsUpdatingProfile(true);
      setError(null);
      
      // Usar el formato correcto para updateUserProfile según el backend
      // Solo enviamos los campos que se están actualizando
      const updateData = {
        username: data.username,
        email: data.email,
        telefono: data.telefono || undefined, 
        direccion: data.direccion || undefined,
        nombre: data.nombre || undefined
      };
      
      await updateUserProfile(updateData);
      
      toast({
        title: "Perfil actualizado",
        description: "La información de tu perfil ha sido actualizada correctamente.",
      });
      
      // Actualizar el perfil local y en el contexto de autenticación
      setProfileData({ ...profileData, ...data });
      await refreshUser(); // Actualizar los datos del usuario en el contexto
      
    } catch (error: any) {
      console.error("Error actualizando perfil:", error);
      setError(error.message || "No se pudo actualizar la información del perfil");
      toast({
        title: "Error",
        description: "No se pudo actualizar la información del perfil. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    try {
      setIsUpdatingPassword(true);
      setError(null);
      
      // Formato para actualizar la contraseña
      const passwordUpdateData = {
        currentPassword: data.currentPassword,
        password: data.password
      };
      
      // Usar la misma función updateUserProfile pero solo con los campos de contraseña
      await updateUserProfile(passwordUpdateData);
      
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada correctamente.",
      });
      
      // Limpiar formulario
      passwordForm.reset();
    } catch (error: any) {
      console.error("Error actualizando contraseña:", error);
      setError(error.message || "No se pudo actualizar la contraseña");
      toast({
        title: "Error",
        description: "No se pudo actualizar la contraseña. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mi Perfil</h1>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Información Personal</TabsTrigger>
          <TabsTrigger value="password">Cambiar Contraseña</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Actualiza tu información personal y datos de contacto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de Usuario</FormLabel>
                        <FormControl>
                          <Input placeholder="Tu nombre de usuario" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo Electrónico</FormLabel>
                        <FormControl>
                          <Input placeholder="correo@ejemplo.com" {...field} readOnly />
                        </FormControl>
                        <FormDescription>
                          El correo electrónico no se puede cambiar.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Tu nombre completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="Tu número de teléfono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="direccion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Input placeholder="Tu dirección" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={isUpdatingProfile}>
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Actualizando...
                      </>
                    ) : (
                      "Actualizar Perfil"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Cambiar Contraseña</CardTitle>
              <CardDescription>
                Actualiza tu contraseña de acceso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña Actual</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nueva Contraseña</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={isUpdatingPassword}>
                    {isUpdatingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Actualizando...
                      </>
                    ) : (
                      "Cambiar Contraseña"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
