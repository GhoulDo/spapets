"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ImageUpload } from "@/components/ui/image-upload"
import { Loader2, Upload, CheckCircle, AlertCircle } from "lucide-react"
import axios from "axios"

export function ImageUploadTest() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [result, setResult] = useState<any>(null)

  const handleFileChange = (file: File) => {
    setFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    setStatus("idle")
    setResult(null)
  }

  const handleTest = async () => {
    if (!file) return

    setStatus("loading")
    setResult(null)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No hay token disponible")
      }

      const formData = new FormData()
      formData.append(
        "mascota",
        JSON.stringify({
          nombre: "Test",
          tipo: "Perro",
          raza: "Test",
          edad: 1,
        }),
      )
      formData.append("foto", file, file.name)

      // Mostrar lo que estamos enviando
      console.log("Enviando FormData:", {
        token: token.substring(0, 15) + "...",
        file: {
          name: file.name,
          type: file.type,
          size: file.size,
        },
        formData: Array.from(formData.entries()).map(([key, value]) =>
          key === "foto" ? `${key}: [File: ${file.name}, ${file.type}]` : `${key}: ${value}`,
        ),
      })

      const response = await axios.post("https://peluqueriacanina-api.onrender.com/api/mascotas/con-foto", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          // No establecer Content-Type para que axios lo configure automáticamente
        },
      })

      setStatus("success")
      setResult({
        status: response.status,
        data: response.data,
      })
    } catch (error: any) {
      console.error("Error en prueba de subida:", error)
      setStatus("error")
      setResult({
        message: error.message,
        response: error.response?.data || null,
        status: error.response?.status || null,
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prueba de Subida de Imágenes</CardTitle>
        <CardDescription>Herramienta de diagnóstico para probar la subida de imágenes al servidor</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <ImageUpload value={preview} onChange={handleFileChange} className="h-40 w-40 rounded-md" />
        </div>

        {status === "loading" && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
            <AlertTitle>Enviando imagen...</AlertTitle>
            <AlertDescription>Estamos enviando la imagen al servidor para probar la funcionalidad.</AlertDescription>
          </Alert>
        )}

        {status === "success" && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>¡Imagen subida correctamente!</AlertTitle>
            <AlertDescription>
              <p>La imagen se ha subido correctamente al servidor.</p>
              {result && (
                <div className="mt-2 text-xs bg-green-50 p-2 rounded">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {status === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error al subir la imagen</AlertTitle>
            <AlertDescription>
              <p>No se pudo subir la imagen al servidor.</p>
              {result && (
                <div className="mt-2 text-xs bg-red-50 p-2 rounded">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleTest}
          disabled={!file || status === "loading"}
          className="w-full bg-green-700 hover:bg-green-800"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" /> Probar Subida
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
