"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Dog, Cat, Fish, Bird, Rabbit } from "lucide-react"
import { cn } from "@/lib/utils"

interface PetImageProps {
  pet: any
  className?: string
  width?: number
  height?: number
  priority?: boolean
  showPlaceholder?: boolean
}

export function PetImage({
  pet,
  className,
  width = 300,
  height = 300,
  priority = false,
  showPlaceholder = true,
}: PetImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    // Reiniciar estados cuando cambia la mascota
    setImageError(false)
    setIsLoading(true)

    const loadImage = async () => {
      // Si no tiene foto o ya hay un error, no hacemos nada
      if (!pet.tieneFoto && !pet.fotoUrl) {
        setIsLoading(false)
        return
      }

      try {
        // Si tenemos una URL directa en el objeto mascota, la usamos directamente
        if (pet.fotoUrl) {
          console.log("Usando URL directa de la mascota:", pet.fotoUrl)

          // Obtener el token para la petición
          const token = localStorage.getItem("token")
          if (!token) {
            console.error("No hay token disponible para cargar la imagen")
            setImageError(true)
            setIsLoading(false)
            return
          }

          // Hacer la petición GET a la URL de la foto con el token
          const response = await fetch(pet.fotoUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (!response.ok) {
            throw new Error(`Error al cargar la imagen: ${response.status}`)
          }

          const blob = await response.blob()
          const objectUrl = URL.createObjectURL(blob)
          setImageUrl(objectUrl)
          setIsLoading(false)
        } else if (pet.id) {
          // Si no tenemos URL pero tenemos ID, construimos la URL
          const token = localStorage.getItem("token")
          if (!token) {
            console.error("No hay token disponible para cargar la imagen")
            setImageError(true)
            setIsLoading(false)
            return
          }

          // URL de la imagen
          const url = `https://peluqueriacanina-api.onrender.com/api/mascotas/${pet.id}/foto`

          // Crear un objeto URL con la imagen obtenida
          const response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (!response.ok) {
            throw new Error(`Error al cargar la imagen: ${response.status}`)
          }

          const blob = await response.blob()
          const objectUrl = URL.createObjectURL(blob)
          setImageUrl(objectUrl)
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error cargando imagen de mascota:", error)
        setImageError(true)
        setIsLoading(false)
      }
    }

    loadImage()

    // Limpieza de URL de objeto al desmontar
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [pet.id, pet.tieneFoto, pet.fotoUrl])

  // Función para obtener el icono según el tipo de mascota
  const getPetIcon = () => {
    const iconProps = { className: "w-full h-full text-primary/30" }
    const tipo = pet.tipo?.toLowerCase() || ""

    if (tipo.includes("perro")) return <Dog {...iconProps} />
    if (tipo.includes("gato")) return <Cat {...iconProps} />
    if (tipo.includes("pez")) return <Fish {...iconProps} />
    if (tipo.includes("ave") || tipo.includes("pájaro")) return <Bird {...iconProps} />
    if (tipo.includes("conejo") || tipo.includes("roedor")) return <Rabbit {...iconProps} />

    // Por defecto, mostrar un perro
    return <Dog {...iconProps} />
  }

  return (
    <div className={cn("relative overflow-hidden bg-primary/5 rounded-lg", className)}>
      {/* Overlay de carga */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        </div>
      )}

      {/* Imagen real si existe */}
      {imageUrl ? (
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={`Foto de ${pet.nombre}`}
          width={width}
          height={height}
          className={cn(
            "object-cover w-full h-full transition-all duration-300",
            isLoading ? "scale-110 blur-sm" : "scale-100 blur-0",
          )}
          onLoadingComplete={() => setIsLoading(false)}
          onError={() => {
            setImageError(true)
            setIsLoading(false)
          }}
          priority={priority}
        />
      ) : showPlaceholder ? (
        <div className="w-full h-full flex items-center justify-center p-6">{getPetIcon()}</div>
      ) : null}

      {/* Nombre de la mascota como overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
        <h3 className="font-bold text-lg">{pet.nombre}</h3>
        <p className="text-xs opacity-90">{pet.raza}</p>
      </div>
    </div>
  )
}
