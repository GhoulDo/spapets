"use client"

import { ApiStatus } from "@/components/diagnostics/api-status"
import { ImageUploadTest } from "@/components/diagnostics/image-upload-test"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DiagnosticPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Herramientas de Diagnóstico</h1>
      <p className="text-gray-600">Esta página contiene herramientas para diagnosticar problemas con la aplicación.</p>

      <Tabs defaultValue="api">
        <TabsList>
          <TabsTrigger value="api">Estado de la API</TabsTrigger>
          <TabsTrigger value="upload">Prueba de Subida</TabsTrigger>
        </TabsList>
        <TabsContent value="api" className="mt-4">
          <ApiStatus />
        </TabsContent>
        <TabsContent value="upload" className="mt-4">
          <ImageUploadTest />
        </TabsContent>
      </Tabs>
    </div>
  )
}
