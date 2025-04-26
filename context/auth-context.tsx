"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api"; // Importamos la instancia API
import { 
  login as apiLogin, 
  logout as apiLogout, 
  getUserProfile, 
  extractErrorMessage  // Importamos la función extractErrorMessage
} from "@/lib/api";

interface User {
  id: string;
  username: string;
  email: string;
  rol: string;
  roles?: string[]; // Añadimos soporte para el array de roles
  telefono?: string; // Añadir propiedad opcional para teléfono
  direccion?: string; // Añadir propiedad opcional para dirección
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ user: User; isAdmin: boolean }>;
  logout: () => void;
  isAdmin: boolean;
  refreshUser: () => Promise<void>; // Añadir el método refreshUser al contexto para actualizar los datos del usuario
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Función para decodificar el token JWT (implementación mejorada)
function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Error decodificando token JWT:", e);
    return null;
  }
}

// Función para verificar si un usuario es administrador
function checkIsAdmin(user: User | null): boolean {
  if (!user) return false;

  // Verificar si el usuario tiene el rol ROLE_ADMIN en el array de roles
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.includes("ROLE_ADMIN");
  }

  // Verificar si el rol es ROLE_ADMIN o ADMIN
  return user.rol === "ROLE_ADMIN" || user.rol === "ADMIN";
}

// Cuando necesitemos usar getAllUsers, podemos implementarlo directamente
const getAllUsers = async () => {
  try {
    const response = await api.get("/usuarios");
    return response.data;
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Verificar autenticación al cargar la aplicación
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);

        const token = localStorage.getItem("token");
        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Intentar obtener los datos del usuario desde localStorage
        const userData = localStorage.getItem("user");
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            setIsAuthenticated(true);
          } catch (e) {
            console.error("Error parsing user data from localStorage:", e);
            // Si hay error al parsear, limpiar localStorage
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            setIsAuthenticated(false);
          }
        } else {
          // Si no hay datos en localStorage, intentar obtener con el token
          try {
            // Usar el nuevo endpoint implementado
            const userData = await getUserProfile();
            
            if (userData) {
              setUser(userData);
              setIsAuthenticated(true);
              
              // Guardar datos en localStorage
              localStorage.setItem("user", JSON.stringify(userData));
            } else {
              throw new Error("No se recibieron datos de usuario");
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            // Token inválido o expirado
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          setLoading(true);
          setError(null);

          // Intentamos decodificar el token para obtener información del usuario
          const decodedToken = parseJwt(token);

          if (decodedToken) {
            // Extraemos la información del usuario del token
            const userData = {
              id: decodedToken.id || decodedToken.sub,
              username: decodedToken.username || decodedToken.name || decodedToken.sub?.split("@")[0],
              email: decodedToken.email || decodedToken.sub,
              rol: decodedToken.rol || "",
              roles: decodedToken.roles || [], // Guardamos el array de roles
            };

            setUser(userData);

            // Verificar si el usuario es administrador
            const userIsAdmin = checkIsAdmin(userData);
            setIsAdmin(userIsAdmin);

            console.log("Usuario autenticado:", userData, "Es admin:", userIsAdmin, "Roles:", userData.roles);
          } else {
            // Si no podemos decodificar el token, usamos el nuevo endpoint /auth/me
            try {
              console.log("No se pudo decodificar el token, obteniendo datos desde /auth/me");
              const userData = await getUserProfile();
              
              if (userData) {
                setUser(userData);
                const userIsAdmin = checkIsAdmin(userData);
                setIsAdmin(userIsAdmin);
                console.log("Usuario obtenido de API:", userData, "Es admin:", userIsAdmin);
              } else {
                throw new Error("No se recibieron datos de usuario");
              }
            } catch (apiError) {
              console.error("Error al obtener perfil de usuario:", apiError);
              throw new Error("No se pudo obtener información del usuario");
            }
          }
        } catch (error: any) {
          console.error("Error fetching user profile:", error);
          setError(extractErrorMessage(error));
          localStorage.removeItem("token");
          toast({
            title: "Error de autenticación",
            description: "Tu sesión ha expirado o es inválida. Por favor, inicia sesión nuevamente.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [toast]);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await apiLogin(email, password);

      // Guardamos el token en localStorage
      localStorage.setItem("token", response.token);
      console.log("Token guardado:", response.token.substring(0, 20) + "...");

      // Intentamos decodificar el token para obtener información del usuario
      const decodedToken = parseJwt(response.token);
      console.log("Token decodificado:", decodedToken);

      let userData: User;

      if (decodedToken) {
        // Extraemos la información del usuario del token
        userData = {
          id: decodedToken.id || decodedToken.sub || email,
          username: decodedToken.username || decodedToken.name || email.split("@")[0],
          email: decodedToken.email || email,
          rol: decodedToken.rol || "",
          roles: decodedToken.roles || [], // Guardamos el array de roles
        };

        console.log("Información de usuario extraída del token:", userData);
      } else {
        // Si no podemos obtener la información del usuario del token,
        // creamos un usuario básico con la información que tenemos
        userData = {
          id: email,
          username: email.split("@")[0],
          email: email,
          rol: "CLIENTE",
        };

        console.log("Creando usuario básico:", userData);
      }

      // Verificar explícitamente si el usuario es administrador
      const userIsAdmin = checkIsAdmin(userData);
      console.log("¿El usuario es administrador?", userIsAdmin, "Roles:", userData.roles);

      // Actualizar el estado
      setUser(userData);
      setIsAdmin(userIsAdmin);

      return { user: userData, isAdmin: userIsAdmin };
    } catch (error: any) {
      console.error("Login error:", error);
      setError(extractErrorMessage(error));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      localStorage.removeItem("token");
      setUser(null);
      setIsAdmin(false);
      // Opcional: redirigir a la página de inicio de sesión
      window.location.href = "/";
    }
  };

  // Añadir método para refrescar el usuario
  const refreshUser = async () => {
    try {
      if (isAuthenticated) {
        const userData = await getUserProfile();
        if (userData) {
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.error("Error al refrescar datos del usuario:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        error,
        login,
        logout,
        isAdmin,
        refreshUser, // Añadir refreshUser al contexto
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
