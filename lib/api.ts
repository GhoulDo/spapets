import axios, { type AxiosError } from "axios"

const API_URL = "https://peluqueriacanina-api.onrender.com/api"

// Configuración de Axios para peticiones autenticadas
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 segundos
  withCredentials: false, // Cambiado a false para evitar problemas de CORS
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

// Interceptor para añadir el token de autenticación a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Aseguramos que las peticiones multipart/form-data no tengan Content-Type predefinido
    if (config.data instanceof FormData) {
      // Eliminamos el Content-Type para que el navegador lo establezca automáticamente con el boundary correcto
      delete config.headers["Content-Type"]
    }

    // Logs para depuración
    console.log(`Realizando petición a: ${config.url}`, {
      method: config.method,
      hasToken: !!token,
      headers: config.headers,
      data:
        config.data instanceof FormData
          ? `FormData: ${Array.from(config.data.entries())
              .map(([key, value]) => (typeof value === "string" ? `${key}: ${value}` : `${key}: [File]`))
              .join(", ")}`
          : config.data,
    })

    return config
  },
  (error) => {
    console.error("Error en la solicitud:", error)
    return Promise.reject(error)
  },
)

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    console.log(`Respuesta exitosa de ${response.config.url}:`, {
      status: response.status,
      hasData: !!response.data,
      data: response.data,
    })
    return response
  },
  (error: AxiosError) => {
    // Registrar detalles del error para depuración
    console.error("Error API:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      code: error.code,
      isAxiosError: error.isAxiosError,
      isNetworkError: !error.response && error.isAxiosError,
    })

    // Si es un error de CORS, lo indicamos específicamente
    if (error.message && error.message.includes("Network Error")) {
      console.error("Posible error de CORS o problema de red:", error.message)
    }

    // Manejar errores específicos
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      switch (error.response.status) {
        case 401:
          console.error("Error de autenticación: Token inválido o expirado")
          // Limpiar token y redirigir a login solo si no estamos ya en la página de login
          if (window.location.pathname !== "/" && window.location.pathname !== "/register") {
            localStorage.removeItem("token")
            window.location.href = "/"
          }
          break
        case 403:
          console.error("Error de autorización: No tienes permisos para esta acción")
          break
        case 404:
          console.error("Recurso no encontrado:", error.config?.url)
          break
        case 500:
          console.error("Error del servidor:", error.response.data)
          break
      }
    } else if (error.request) {
      // La solicitud se realizó pero no se recibió respuesta
      console.error(
        "No se recibió respuesta del servidor. Verifica que el backend esté funcionando o posible error de CORS",
      )
      console.error("Detalles de la solicitud:", error.request)
    } else {
      // Error al configurar la solicitud
      console.error("Error al configurar la solicitud:", error.message)
    }

    return Promise.reject(error)
  },
)

// Función para extraer mensajes de error
export const extractErrorMessage = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.response?.data?.error) {
    return error.response.data.error
  }
  if (error.response?.data?.mensaje) {
    return error.response.data.mensaje
  }
  if (typeof error.response?.data === "string") {
    return error.response.data
  }
  if (error.message) {
    return error.message
  }
  return "Ha ocurrido un error inesperado"
}

// Auth API
export const login = async (email: string, password: string) => {
  try {
    const response = await api.post("/auth/login", { email, password })
    return response.data
  } catch (error: any) {
    console.error("Error detallado de login:", error)

    // Mensajes de error específicos basados en el código de estado
    if (error.response) {
      switch (error.response.status) {
        case 401:
          throw new Error("Credenciales incorrectas. Verifica tu email y contraseña.")
        case 404:
          throw new Error("El usuario no existe. Verifica tu email o regístrate.")
        case 429:
          throw new Error("Demasiados intentos fallidos. Inténtalo más tarde.")
        default:
          throw new Error(extractErrorMessage(error) || "Error al iniciar sesión. Inténtalo de nuevo.")
      }
    }

    // Error de red o servidor no disponible
    if (error.code === "ECONNABORTED") {
      throw new Error("Tiempo de espera agotado. El servidor tarda en responder.")
    }

    if (!error.response) {
      throw new Error("No se pudo conectar con el servidor. Verifica tu conexión a internet.")
    }

    throw error
  }
}

export const registerUser = async (userData: any) => {
  try {
    const response = await api.post("/auth/register", userData)
    return response.data
  } catch (error: any) {
    console.error("Error detallado de registro:", error)

    if (error.response) {
      switch (error.response.status) {
        case 400:
          throw new Error("Datos de registro inválidos. Verifica la información proporcionada.")
        case 409:
          throw new Error("El email o nombre de usuario ya está en uso. Intenta con otro.")
        default:
          throw new Error(extractErrorMessage(error) || "Error al registrar usuario. Inténtalo de nuevo.")
      }
    }

    if (!error.response) {
      throw new Error("No se pudo conectar con el servidor. Verifica tu conexión a internet.")
    }

    throw error
  }
}

export const logout = async () => {
  try {
    await api.post("/auth/logout")
    localStorage.removeItem("token")
  } catch (error) {
    console.error("Error al cerrar sesión:", error)
    // Aún así, eliminamos el token local
    localStorage.removeItem("token")
  }
}

// Usuarios API
export const getUserProfile = async (userId: string) => {
  try {
    // Usamos la ruta documentada para obtener un usuario por ID
    const response = await api.get(`/usuarios/${userId}`)
    return response.data
  } catch (error) {
    console.error("Error obteniendo perfil de usuario:", error)
    throw error
  }
}

export const getAllUsers = async () => {
  try {
    const response = await api.get("/usuarios")
    return response.data
  } catch (error) {
    console.error("Error obteniendo usuarios:", error)
    throw error
  }
}

// Dashboard API
export const fetchDashboardStats = async () => {
  // Esta función puede necesitar ser adaptada según la API real
  try {
    // Obtener estadísticas de diferentes endpoints
    const [clientes, mascotas, citas, facturas] = await Promise.all([
      api.get("/clientes"),
      api.get("/mascotas"),
      api.get("/citas"),
      api.get("/facturas"),
    ])

    return {
      totalClientes: clientes.data.length,
      totalMascotas: mascotas.data.length,
      totalCitas: citas.data.length,
      totalFacturas: facturas.data.length,
    }
  } catch (error) {
    console.error("Error obteniendo estadísticas del dashboard:", error)
    throw error
  }
}

// Clients API
export const fetchClients = async () => {
  try {
    const response = await api.get("/clientes")
    return response.data
  } catch (error) {
    console.error("Error obteniendo clientes:", error)
    throw error
  }
}

export const fetchClientById = async (id: string) => {
  try {
    const response = await api.get(`/clientes/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error obteniendo cliente con ID ${id}:`, error)
    throw error
  }
}

export const createClient = async (clientData: any) => {
  try {
    const response = await api.post("/clientes", clientData)
    return response.data
  } catch (error) {
    console.error("Error creando cliente:", error)
    throw error
  }
}

export const updateClient = async (id: string, clientData: any) => {
  try {
    const response = await api.put(`/clientes/${id}`, clientData)
    return response.data
  } catch (error) {
    console.error(`Error actualizando cliente con ID ${id}:`, error)
    throw error
  }
}

export const deleteClient = async (id: string) => {
  try {
    const response = await api.delete(`/clientes/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error eliminando cliente con ID ${id}:`, error)
    throw error
  }
}

// Pets API
export const fetchPets = async () => {
  try {
    // Verificar que el token esté disponible
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No hay token disponible para obtener mascotas")
    }

    console.log("Obteniendo mascotas - token:", token.substring(0, 15) + "...")
    const response = await api.get("/mascotas")
    return response.data
  } catch (error) {
    console.error("Error detallado obteniendo mascotas:", error)
    throw error
  }
}

export const fetchPetById = async (id: string) => {
  try {
    const response = await api.get(`/mascotas/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error obteniendo mascota con ID ${id}:`, error)
    throw error
  }
}

// Función para crear mascota según la documentación de la API
export const createPet = async (petData: any, photo?: File) => {
  try {
    console.log("Creando mascota con datos:", petData, "y foto:", !!photo)

    // Si hay una foto, usamos FormData
    if (photo) {
      const formData = new FormData()

      // Añadimos los datos de la mascota directamente como campos individuales
      // en lugar de como un JSON string, para mayor compatibilidad
      Object.entries(petData).forEach(([key, value]) => {
        formData.append(key, value as string)
      })

      // Añadimos la foto
      formData.append("foto", photo, photo.name)

      console.log("Enviando FormData con foto:", {
        petData,
        hasPhoto: !!photo,
        photoName: photo.name,
        photoType: photo.type,
        photoSize: photo.size,
        formDataEntries: Array.from(formData.entries()).map(([key, value]) =>
          key === "foto" ? `${key}: [File: ${photo.name}, ${photo.type}]` : `${key}: ${value}`,
        ),
      })

      // Usamos el endpoint estándar con FormData
      const response = await api.post("/mascotas", formData, {
        headers: {
          // No establecemos Content-Type para que axios lo configure automáticamente con el boundary correcto
        },
      })
      return response.data
    } else {
      // Si no hay foto, enviamos JSON directamente
      console.log("Enviando datos de mascota sin foto:", petData)
      const response = await api.post("/mascotas", petData)
      return response.data
    }
  } catch (error) {
    console.error("Error creando mascota:", error)
    throw error
  }
}

export const updatePet = async (id: string, petData: any) => {
  try {
    const response = await api.put(`/mascotas/${id}`, petData)
    return response.data
  } catch (error) {
    console.error(`Error actualizando mascota con ID ${id}:`, error)
    throw error
  }
}

export const deletePet = async (id: string) => {
  try {
    const response = await api.delete(`/mascotas/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error eliminando mascota con ID ${id}:`, error)
    throw error
  }
}

// Función para subir foto de mascota según la documentación
export const uploadPetPhoto = async (id: string, photo: File) => {
  try {
    const formData = new FormData()
    formData.append("foto", photo, photo.name)

    console.log(`Subiendo foto para mascota ${id}:`, {
      photoName: photo.name,
      photoSize: photo.size,
      photoType: photo.type,
      formDataEntries: Array.from(formData.entries()).map(([key]) => key),
    })

    const response = await api.post(`/mascotas/${id}/foto`, formData, {
      headers: {
        // No establecemos Content-Type para que axios lo configure automáticamente
      },
    })
    return response.data
  } catch (error) {
    console.error(`Error subiendo foto para mascota con ID ${id}:`, error)
    throw error
  }
}

export const getPetPhoto = async (id: string) => {
  try {
    const response = await api.get(`/mascotas/${id}/foto`, {
      responseType: "blob",
    })
    return response.data
  } catch (error) {
    console.error(`Error obteniendo foto de mascota con ID ${id}:`, error)
    throw error
  }
}

// Services API
export const fetchServices = async () => {
  try {
    const response = await api.get("/servicios")
    return response.data
  } catch (error) {
    console.error("Error obteniendo servicios:", error)
    throw error
  }
}

export const fetchServiceById = async (id: string) => {
  try {
    const response = await api.get(`/servicios/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error obteniendo servicio con ID ${id}:`, error)
    throw error
  }
}

export const createService = async (serviceData: any) => {
  try {
    const response = await api.post("/servicios", serviceData)
    return response.data
  } catch (error) {
    console.error("Error creando servicio:", error)
    throw error
  }
}

export const updateService = async (id: string, serviceData: any) => {
  try {
    const response = await api.put(`/servicios/${id}`, serviceData)
    return response.data
  } catch (error) {
    console.error(`Error actualizando servicio con ID ${id}:`, error)
    throw error
  }
}

export const updateServicePartially = async (id: string, serviceData: any) => {
  try {
    const response = await api.patch(`/servicios/${id}`, serviceData)
    return response.data
  } catch (error) {
    console.error(`Error actualizando parcialmente servicio con ID ${id}:`, error)
    throw error
  }
}

export const deleteService = async (id: string) => {
  try {
    const response = await api.delete(`/servicios/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error eliminando servicio con ID ${id}:`, error)
    throw error
  }
}

// Products API
export const fetchProducts = async () => {
  try {
    const response = await api.get("/productos")
    return response.data
  } catch (error) {
    console.error("Error obteniendo productos:", error)
    throw error
  }
}

export const fetchProductById = async (id: string) => {
  try {
    const response = await api.get(`/productos/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error obteniendo producto con ID ${id}:`, error)
    throw error
  }
}

export const createProduct = async (productData: any) => {
  try {
    const response = await api.post("/productos", productData)
    return response.data
  } catch (error) {
    console.error("Error creando producto:", error)
    throw error
  }
}

export const updateProduct = async (id: string, productData: any) => {
  try {
    const response = await api.put(`/productos/${id}`, productData)
    return response.data
  } catch (error) {
    console.error(`Error actualizando producto con ID ${id}:`, error)
    throw error
  }
}

export const deleteProduct = async (id: string) => {
  try {
    const response = await api.delete(`/productos/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error eliminando producto con ID ${id}:`, error)
    throw error
  }
}

// Appointments API
export const fetchAppointments = async (filters = {}) => {
  try {
    const response = await api.get("/citas", { params: filters })
    return response.data
  } catch (error) {
    console.error("Error obteniendo citas:", error)
    throw error
  }
}

export const fetchClientAppointments = async () => {
  try {
    // Verificar que el token esté disponible
    const token = localStorage.getItem("token")
    if (!token) {
      console.error("No hay token disponible para obtener citas")
      return []
    }

    // Primero obtenemos las mascotas del cliente
    console.log("Obteniendo mascotas para buscar citas...")
    const mascotas = await fetchPets().catch((error) => {
      console.error("Error al obtener mascotas para citas:", error)
      return []
    })

    if (!mascotas || mascotas.length === 0) {
      console.log("No se encontraron mascotas para el cliente")
      return []
    }

    console.log(`Se encontraron ${mascotas.length} mascotas, obteniendo citas...`)

    // Luego obtenemos las citas para cada mascota
    const mascotaIds = mascotas.map((mascota: any) => mascota.id)
    const citasPromises = mascotaIds.map((mascotaId: string) => {
      console.log(`Obteniendo citas para mascota ${mascotaId}...`)
      return api.get(`/citas/mascota/${mascotaId}`).catch((error) => {
        console.error(`Error obteniendo citas para mascota ${mascotaId}:`, error)
        return { data: [] } // Devolver un array vacío en caso de error
      })
    })

    const responses = await Promise.all(citasPromises)
    // Combinamos todas las citas en un solo array
    const citas = responses.flatMap((response) => response.data)
    console.log(`Se encontraron ${citas.length} citas en total`)

    return citas
  } catch (error) {
    console.error("Error obteniendo citas del cliente:", error)
    // Devolver un array vacío en lugar de lanzar un error
    return []
  }
}

export const fetchAppointmentById = async (id: string) => {
  try {
    const response = await api.get(`/citas/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error obteniendo cita con ID ${id}:`, error)
    throw error
  }
}

export const fetchAppointmentsByDate = async (date: string) => {
  try {
    const response = await api.get(`/citas/fecha/${date}`)
    return response.data
  } catch (error) {
    console.error(`Error obteniendo citas para la fecha ${date}:`, error)
    throw error
  }
}

export const fetchTodayAppointments = async () => {
  try {
    const response = await api.get("/citas/hoy")
    return response.data
  } catch (error) {
    console.error("Error obteniendo citas de hoy:", error)
    throw error
  }
}

export const fetchOrganizedAppointments = async (filters = {}) => {
  try {
    const response = await api.get("/citas/organizadas", { params: filters })
    return response.data
  } catch (error) {
    console.error("Error obteniendo citas organizadas:", error)
    throw error
  }
}

export const createAppointment = async (appointmentData: any) => {
  try {
    const response = await api.post("/citas", appointmentData)
    return response.data
  } catch (error: any) {
    console.error("Error creando cita:", error)

    if (error.response?.status === 409) {
      throw new Error("Ya existe una cita para esta fecha y hora. Por favor, selecciona otro horario.")
    }

    throw error
  }
}

export const updateAppointment = async (id: string, appointmentData: any) => {
  try {
    const response = await api.put(`/citas/${id}`, appointmentData)
    return response.data
  } catch (error: any) {
    console.error(`Error actualizando cita con ID ${id}:`, error)

    if (error.response?.status === 409) {
      throw new Error("Ya existe una cita para esta fecha y hora. Por favor, selecciona otro horario.")
    }

    throw error
  }
}

export const deleteAppointment = async (id: string) => {
  try {
    const response = await api.delete(`/citas/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error eliminando cita con ID ${id}:`, error)
    throw error
  }
}

export const validateAppointmentAvailability = async (
  mascotaId: string,
  servicioId: string,
  fecha: string,
  hora: string,
) => {
  try {
    const response = await api.get("/citas/validar", {
      params: {
        mascotaId,
        servicioId,
        fecha,
        hora,
      },
    })
    return response.data
  } catch (error) {
    console.error("Error validando disponibilidad de cita:", error)
    throw error
  }
}

// ==================== CARRITO DE COMPRAS API ====================

// Obtener contenido del carrito
export async function getCarrito() {
  try {
    // Verificar que el token exista antes de hacer la petición
    const token = localStorage.getItem("token")
    if (!token) {
      console.error("No hay token disponible para obtener el carrito")
      throw new Error("No se encontró el token de autenticación")
    }

    // Verificar que estemos haciendo la petición con el token correctamente
    console.log("Obteniendo carrito con token:", token.substring(0, 15) + "...")
    
    // Hacer la petición explícitamente con el token en los headers
    const response = await api.get("/carrito", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    console.log("Carrito obtenido con éxito:", response.data)
    return response.data
  } catch (error: any) {
    console.error("Error obteniendo carrito:", error)
    
    // Agregar más información de diagnóstico
    if (error.response) {
      console.error("Detalles del error:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      })
      
      // Si es un error 403, probablemente sea un problema con el rol del usuario
      if (error.response.status === 403) {
        console.error("Error de autorización: No tienes permisos para esta acción")
        // Devolver un carrito vacío en lugar de lanzar error para una mejor experiencia de usuario
        return { items: [] }
      }
    }
    
    // Manejar otros tipos de errores, pero devolver un carrito vacío para no romper la UI
    return { items: [] }
  }
}

export async function agregarProductoCarrito(productoId: string, cantidad: number) {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No se encontró el token de autenticación")
    }
    
    const response = await api.post(
      "/carrito/agregar", 
      { productoId, cantidad },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    return response.data
  } catch (error: any) {
    console.error("Error añadiendo producto al carrito:", error)
    if (error.response && error.response.status === 403) {
      throw new Error("No tienes permisos para añadir productos al carrito")
    }
    throw error
  }
}

export async function actualizarProductoCarrito(productoId: string, cantidad: number) {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No se encontró el token de autenticación")
    }
    
    const response = await api.put(
      "/carrito/actualizar", 
      { productoId, cantidad },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    return response.data
  } catch (error: any) {
    console.error("Error actualizando producto en el carrito:", error)
    if (error.response && error.response.status === 403) {
      throw new Error("No tienes permisos para actualizar productos en el carrito")
    }
    throw error
  }
}

export async function eliminarProductoCarrito(productoId: string) {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No se encontró el token de autenticación")
    }
    
    const response = await api.delete(`/carrito/eliminar/${productoId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  } catch (error: any) {
    console.error("Error eliminando producto del carrito:", error)
    if (error.response && error.response.status === 403) {
      throw new Error("No tienes permisos para eliminar productos del carrito")
    }
    throw error
  }
}

export async function vaciarCarrito() {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No se encontró el token de autenticación")
    }
    
    const response = await api.delete("/carrito/vaciar", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  } catch (error: any) {
    console.error("Error vaciando el carrito:", error)
    if (error.response && error.response.status === 403) {
      throw new Error("No tienes permisos para vaciar el carrito")
    }
    throw error
  }
}

// Funciones para el Carrito
export async function fetchCart() {
  try {
    const data = await getCarrito();
    return data;
  } catch (error) {
    console.error("Error en fetchCart:", error);
    // Devolver un carrito vacío en caso de error para prevenir fallos en la UI
    return { items: [] };
  }
}

export async function addToCart(productoId: string, cantidad: number) {
  return agregarProductoCarrito(productoId, cantidad);
}

export async function updateCartItem(productoId: string, cantidad: number) {
  return actualizarProductoCarrito(productoId, cantidad);
}

export async function removeFromCart(productoId: string) {
  return eliminarProductoCarrito(productoId);
}

export async function clearCart() {
  return vaciarCarrito();
}

// ==================== CHECKOUT API ====================

// Obtener resumen de compra
export const getResumenCompra = async () => {
  try {
    const response = await api.get("/checkout/resumen")
    return response.data
  } catch (error) {
    console.error("Error obteniendo resumen de compra:", error)
    throw error
  }
}

// Confirmar compra
export const confirmarCompra = async (datos: { direccionEntrega?: string; metodoPago?: string }) => {
  try {
    const response = await api.post("/checkout/confirmar", datos)
    return response.data
  } catch (error) {
    console.error("Error confirmando compra:", error)
    throw error
  }
}

// ==================== FACTURACIÓN API ====================

// Obtener todas las facturas
export const fetchInvoices = async () => {
  try {
    const response = await api.get("/facturas")
    return response.data
  } catch (error) {
    console.error("Error obteniendo facturas:", error)
    throw error
  }
}

// Obtener facturas del cliente actual
export const fetchClientInvoices = async () => {
  try {
    // Verificar que el token esté disponible
    const token = localStorage.getItem("token")
    if (!token) {
      console.error("No hay token disponible para obtener facturas")
      return []
    }

    console.log("Obteniendo facturas del cliente...")
    // Obtenemos las facturas del cliente
    const response = await api.get("/facturas")
    console.log(`Se encontraron ${response.data.length} facturas`)
    return response.data
  } catch (error) {
    console.error("Error obteniendo facturas del cliente:", error)
    // Devolver un array vacío en lugar de lanzar un error
    return []
  }
}

// Obtener una factura por ID
export const fetchInvoiceById = async (id: string) => {
  try {
    const response = await api.get(`/facturas/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error obteniendo factura con ID ${id}:`, error)
    throw error
  }
}

// Crear una nueva factura manualmente
export const createInvoiceManually = async (invoiceData: any) => {
  try {
    const response = await api.post("/facturas", invoiceData)
    return response.data
  } catch (error) {
    console.error("Error creando factura:", error)
    throw error
  }
}

// Obtener el total de una factura
export const getInvoiceTotal = async (id: string) => {
  try {
    const response = await api.get(`/facturas/${id}/total`)
    return response.data
  } catch (error) {
    console.error(`Error calculando total de factura con ID ${id}:`, error)
    throw error
  }
}

// ==================== DETALLES DE FACTURA API ====================

// Obtener todos los detalles de una factura
export const getInvoiceDetails = async (invoiceId: string) => {
  try {
    const response = await api.get(`/facturas/${invoiceId}/detalles`)
    return response.data
  } catch (error) {
    console.error(`Error obteniendo detalles de factura con ID ${invoiceId}:`, error)
    throw error
  }
}

// Obtener un detalle específico
export const getInvoiceDetailById = async (invoiceId: string, detailId: string) => {
  try {
    const response = await api.get(`/facturas/${invoiceId}/detalles/${detailId}`)
    return response.data
  } catch (error) {
    console.error(`Error obteniendo detalle ${detailId} de factura ${invoiceId}:`, error)
    throw error
  }
}

// Agregar un detalle a una factura
export const addInvoiceDetail = async (invoiceId: string, detailData: any) => {
  try {
    const response = await api.post(`/facturas/${invoiceId}/detalles`, detailData)
    return response.data
  } catch (error) {
    console.error(`Error creando detalle para factura ${invoiceId}:`, error)
    throw error
  }
}

// Modificar un detalle existente
export const editInvoiceDetail = async (invoiceId: string, detailId: string, detailData: any) => {
  try {
    const response = await api.put(`/facturas/${invoiceId}/detalles/${detailId}`, detailData)
    return response.data
  } catch (error) {
    console.error(`Error actualizando detalle ${detailId} de factura ${invoiceId}:`, error)
    throw error
  }
}

// Eliminar un detalle de factura
export const removeInvoiceDetail = async (invoiceId: string, detailId: string) => {
  try {
    const response = await api.delete(`/facturas/${invoiceId}/detalles/${detailId}`)
    return response.data
  } catch (error) {
    console.error(`Error eliminando detalle ${detailId} de factura ${invoiceId}:`, error)
    throw error
  }
}

// ==================== FACTURACIÓN UNIFICADA API ====================

// Facturar una cita (crear factura a partir de una cita) - ADMIN
export const invoiceAppointment = async (
  citaId: string,
  productosData?: { productosIds: string[]; cantidades: number[] },
) => {
  try {
    const response = await api.post(`/facturacion-unificada/facturar-cita/${citaId}`, productosData || {})
    return response.data
  } catch (error) {
    console.error(`Error facturando cita con ID ${citaId}:`, error)
    throw error
  }
}

// Agregar productos a una factura existente - ADMIN/CLIENTE
export const addProductsToExistingInvoice = async (
  facturaId: string,
  productosData: { productosIds: string[]; cantidades: number[] },
) => {
  try {
    const response = await api.put(`/facturacion-unificada/agregar-productos/${facturaId}`, productosData)
    return response.data
  } catch (error) {
    console.error(`Error agregando productos a factura con ID ${facturaId}:`, error)
    throw error
  }
}

// Marcar una factura como pagada - ADMIN
export const setInvoiceAsPaid = async (facturaId: string) => {
  try {
    const response = await api.put(`/facturacion-unificada/pagar/${facturaId}`)
    return response.data
  } catch (error) {
    console.error(`Error marcando factura con ID ${facturaId} como pagada:`, error)
    throw error
  }
}

// Obtener facturas de un cliente - ADMIN/CLIENTE
export const getInvoicesForClient = async (clienteId: string) => {
  try {
    const response = await api.get(`/facturacion-unificada/cliente/${clienteId}`)
    return response.data
  } catch (error) {
    console.error(`Error obteniendo facturas del cliente con ID ${clienteId}:`, error)
    throw error
  }
}

// Generar factura a partir de productos (sin cita)
export const generarFactura = async (productosIds: string[], cantidades: number[]) => {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No se encontró el token de autenticación")
    }

    console.log("Generando factura con datos:", { productosIds, cantidades })

    // Usar el endpoint correcto según la documentación
    const response = await api.post("/facturacion-unificada/generar-factura", {
      productosIds,
      cantidades,
    })

    console.log("Respuesta de generación de factura:", response.data)
    return response.data
  } catch (error: any) {
    console.error("Error detallado al generar factura:", error)

    // Mejorar el manejo de errores para proporcionar mensajes más específicos
    if (error.response) {
      switch (error.response.status) {
        case 400:
          throw new Error("Datos de factura inválidos. Verifica la información proporcionada.")
        case 401:
          throw new Error("No autorizado. Por favor, inicia sesión nuevamente.")
        case 404:
          throw new Error("Recurso no encontrado. Verifica que los productos existan.")
        case 409:
          throw new Error("No hay suficiente stock para algunos productos. Verifica la disponibilidad.")
        case 500:
          throw new Error("Error del servidor. Intenta nuevamente más tarde.")
        default:
          throw new Error(extractErrorMessage(error) || "Error al generar factura. Inténtalo de nuevo.")
      }
    }

    if (error.code === "ECONNABORTED") {
      throw new Error("Tiempo de espera agotado. El servidor tarda en responder.")
    }

    if (!error.response) {
      throw new Error("No se pudo conectar con el servidor. Verifica tu conexión a internet.")
    }

    throw error
  }
}

// Función para descargar una factura en formato PDF
export async function downloadInvoicePdf(facturaId: string) {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No se encontró el token de autenticación")
    }

    const response = await api.get(`/facturas/${facturaId}/pdf`, {
      responseType: "blob",
    })

    // Crear un blob con el PDF
    const blob = new Blob([response.data], { type: "application/pdf" })

    // Crear una URL para el blob
    const url = window.URL.createObjectURL(blob)

    // Crear un enlace temporal
    const a = document.createElement("a")
    a.style.display = "none"
    a.href = url
    a.download = `factura-${facturaId}.pdf`

    // Añadir el enlace al documento y hacer clic en él
    document.body.appendChild(a)
    a.click()

    // Limpiar
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error: any) {
    console.error("Error downloading invoice PDF:", error)
    throw error
  }
}

// Función para verificar la conexión con el backend
export const checkBackendConnection = async () => {
  try {
    const response = await api.get("/health", { timeout: 5000 })
    return {
      connected: true,
      status: response.status,
      data: response.data,
    }
  } catch (error: any) {
    console.error("Error verificando conexión con el backend:", error)
    return {
      connected: false,
      error: extractErrorMessage(error),
    }
  }
}

