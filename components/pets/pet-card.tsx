"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Dog, Edit, MoreVertical, Trash, Loader2, Heart } from "lucide-react"
import { deletePet } from "@/lib/api"
import { PetImage } from "@/components/ui/pet-image"
import { cn } from "@/lib/utils"

interface PetCardProps {
  pet: any
  onEdit: () => void
  onDelete: (id: string) => void
}

export function PetCard({ pet, onEdit, onDelete }: PetCardProps) {
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deletePet(pet.id)
      onDelete(pet.id)
      toast({
        title: "Mascota eliminada",
        description: `${pet.nombre} ha sido eliminado correctamente.`,
      })
    } catch (error) {
      console.error("Error deleting pet:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la mascota. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  // Determinar la clase de color según el tipo de mascota
  const getPetTypeClass = () => {
    const tipo = pet.tipo?.toLowerCase() || ""
    if (tipo.includes("perro")) return "dog"
    if (tipo.includes("gato")) return "cat"
    if (tipo.includes("ave") || tipo.includes("pájaro")) return "bird"
    if (tipo.includes("pez")) return "fish"
    if (tipo.includes("roedor") || tipo.includes("conejo")) return "rodent"
    return ""
  }

  const typeClass = getPetTypeClass()

  return (
    <>
      <Card className={cn("pet-card group", typeClass)}>
        {/* Imagen de la mascota */}
        <div className="relative h-48 overflow-hidden rounded-t-xl">
          <PetImage pet={pet} className="h-48" priority={false} />

          {/* Botón de favorito */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-2 right-2 rounded-full bg-white/80 backdrop-blur-sm transition-all",
              isLiked ? "text-pet-primary" : "text-muted-foreground",
            )}
            onClick={() => setIsLiked(!isLiked)}
          >
            <Heart className={cn("h-5 w-5", isLiked ? "fill-pet-primary" : "")} />
          </Button>
        </div>

        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-primary">{pet.nombre}</h3>
              <p className="text-muted-foreground text-sm">{pet.raza}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                  <Edit className="h-4 w-4 mr-2" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash className="h-4 w-4 mr-2" /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center text-sm">
              <span className="bg-primary/10 text-primary rounded-full p-1 mr-2">
                <Dog className="h-4 w-4" />
              </span>
              <span className="font-medium">Edad:</span>
              <span className="ml-auto">
                {pet.edad} {pet.edad === 1 ? "año" : "años"}
              </span>
            </div>

            {pet.descripcion && (
              <div className="text-sm text-muted-foreground mt-2 italic bg-muted/50 p-2 rounded-lg">
                "{pet.descripcion.substring(0, 100)}
                {pet.descripcion.length > 100 ? "..." : ""}"
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <Badge
            variant="outline"
            className={cn(
              "rounded-full",
              typeClass === "dog"
                ? "bg-dog/10 text-dog border-dog/20"
                : typeClass === "cat"
                  ? "bg-cat/10 text-cat border-cat/20"
                  : typeClass === "bird"
                    ? "bg-bird/10 text-bird border-bird/20"
                    : typeClass === "fish"
                      ? "bg-fish/10 text-fish border-fish/20"
                      : typeClass === "rodent"
                        ? "bg-rodent/10 text-rodent border-rodent/20"
                        : "bg-primary/10 text-primary border-primary/20",
            )}
          >
            {pet.tipo}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="rounded-full border-primary/20 hover:bg-primary/10 hover:text-primary"
          >
            <Edit className="h-4 w-4 mr-2" /> Editar
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente a {pet.nombre} y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="rounded-full">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 rounded-full"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando...
                </>
              ) : (
                <>
                  <Trash className="mr-2 h-4 w-4" /> Eliminar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
