import { Dog, Cat, Bird, Rabbit, Fish } from "lucide-react"

interface PetIconProps {
  tipo: string
  className?: string
}

export function PetIcon({ tipo, className = "h-5 w-5" }: PetIconProps) {
  const tipoLower = tipo.toLowerCase()

  if (tipoLower.includes("perro")) {
    return <Dog className={className} />
  }

  if (tipoLower.includes("gato")) {
    return <Cat className={className} />
  }

  if (tipoLower.includes("ave") || tipoLower.includes("pájaro")) {
    return <Bird className={className} />
  }

  if (tipoLower.includes("roedor") || tipoLower.includes("conejo")) {
    return <Rabbit className={className} />
  }

  if (tipoLower.includes("pez") || tipoLower.includes("acuático")) {
    return <Fish className={className} />
  }

  // Icono predeterminado
  return <Dog className={className} />
}
