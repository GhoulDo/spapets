"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Upload, X } from "lucide-react"
import Image from "next/image"

interface ImageUploadProps {
  value: string | null
  onChange: (file: File) => void
  className?: string
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onChange(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      onChange(e.target.files[0])
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Crear un archivo vacío para simular la eliminación
    const emptyFile = new File([""], "empty.png", { type: "image/png" })
    onChange(emptyFile)
  }

  return (
    <div
      className={`relative ${className || "h-40 w-40"} ${
        dragActive ? "border-green-500 bg-green-50" : "border-gray-300 bg-gray-50"
      } border-2 border-dashed rounded-md flex items-center justify-center overflow-hidden transition-colors duration-200`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {value ? (
        <div className="relative w-full h-full">
          <Image src={value || "/placeholder.svg"} alt="Uploaded image" fill className="object-cover" />
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <label htmlFor="image-upload" className="cursor-pointer">
              <Button type="button" variant="secondary" size="sm" className="bg-white hover:bg-gray-100">
                <Camera className="h-4 w-4 mr-2" /> Cambiar
              </Button>
            </label>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              className="bg-white text-red-500 hover:bg-red-50 border border-red-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <label
          htmlFor="image-upload"
          className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-4"
        >
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-2">
            <Upload className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-sm text-center text-gray-600 font-medium">
            Arrastra una imagen o haz clic para seleccionar
          </p>
          <p className="text-xs text-center text-gray-500 mt-1">Foto de tu mascota</p>
        </label>
      )}
      <input id="image-upload" type="file" accept="image/*" onChange={handleChange} className="hidden" />
    </div>
  )
}
