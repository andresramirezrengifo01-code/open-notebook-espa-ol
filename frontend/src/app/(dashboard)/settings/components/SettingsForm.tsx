'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { useSettings, useUpdateSettings } from '@/lib/hooks/use-settings'
import { useEffect, useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'

const settingsSchema = z.object({
  default_content_processing_engine_doc: z.enum(['auto', 'docling', 'simple']).optional(),
  default_content_processing_engine_url: z.enum(['auto', 'firecrawl', 'jina', 'simple']).optional(),
  default_embedding_option: z.enum(['ask', 'always', 'never']).optional(),
  auto_delete_files: z.enum(['yes', 'no']).optional(),
})

type SettingsFormData = z.infer<typeof settingsSchema>

export function SettingsForm() {
  const { data: settings, isLoading, error } = useSettings()
  const updateSettings = useUpdateSettings()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [hasResetForm, setHasResetForm] = useState(false)
  
  
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty }
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      default_content_processing_engine_doc: undefined,
      default_content_processing_engine_url: undefined,
      default_embedding_option: undefined,
      auto_delete_files: undefined,
    }
  })


  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  useEffect(() => {
    if (settings && settings.default_content_processing_engine_doc && !hasResetForm) {
      const formData = {
        default_content_processing_engine_doc: settings.default_content_processing_engine_doc as 'auto' | 'docling' | 'simple',
        default_content_processing_engine_url: settings.default_content_processing_engine_url as 'auto' | 'firecrawl' | 'jina' | 'simple',
        default_embedding_option: settings.default_embedding_option as 'ask' | 'always' | 'never',
        auto_delete_files: settings.auto_delete_files as 'yes' | 'no',
      }
      reset(formData)
      setHasResetForm(true)
    }
  }, [hasResetForm, reset, settings])

  const onSubmit = async (data: SettingsFormData) => {
    await updateSettings.mutateAsync(data)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error al cargar la configuración</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Ocurrió un error inesperado.'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Procesamiento de Contenido</CardTitle>
          <CardDescription>
            Configura cómo se procesan los documentos y URLs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="doc_engine">Motor de Procesamiento de Documentos</Label>
            <Controller
              name="default_content_processing_engine_doc"
              control={control}
              render={({ field }) => (
                <Select
                  key={field.value}
                  value={field.value || ''}
                  onValueChange={field.onChange}
                  disabled={field.disabled || isLoading}
                >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona el motor de procesamiento de documentos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (Recomendado)</SelectItem>
                      <SelectItem value="docling">Docling</SelectItem>
                      <SelectItem value="simple">Simple</SelectItem>
                    </SelectContent>
                  </Select>
              )}
            />
            <Collapsible open={expandedSections.doc} onOpenChange={() => toggleSection('doc')}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${expandedSections.doc ? 'rotate-180' : ''}`} />
                Ayúdame a elegir
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 text-sm text-muted-foreground space-y-2">
                <p>• <strong>Docling</strong> es un poco más lento pero más preciso, especialmente si los documentos contienen tablas e imágenes.</p>
                <p>• <strong>Simple</strong> extraerá cualquier contenido del documento sin formatearlo. Está bien para documentos simples, pero perderá calidad en los complejos.</p>
                <p>• <strong>Auto (recomendado)</strong> intentará procesar a través de docling y volverá a simple por defecto.</p>
              </CollapsibleContent>
            </Collapsible>
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="url_engine">Motor de Procesamiento de URLs</Label>
            <Controller
              name="default_content_processing_engine_url"
              control={control}
              render={({ field }) => (
                <Select
                  key={field.value}
                  value={field.value || ''}
                  onValueChange={field.onChange}
                  disabled={field.disabled || isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona el motor de procesamiento de URLs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (Recomendado)</SelectItem>
                    <SelectItem value="firecrawl">Firecrawl</SelectItem>
                    <SelectItem value="jina">Jina</SelectItem>
                    <SelectItem value="simple">Simple</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <Collapsible open={expandedSections.url} onOpenChange={() => toggleSection('url')}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${expandedSections.url ? 'rotate-180' : ''}`} />
                Ayúdame a elegir
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 text-sm text-muted-foreground space-y-2">
                <p>• <strong>Firecrawl</strong> es un servicio de pago (con nivel gratuito), y muy potente.</p>
                <p>• <strong>Jina</strong> es una buena opción también y también tiene un nivel gratuito.</p>
                <p>• <strong>Simple</strong> usará extracción HTTP básica y perderá contenido en sitios web basados en javascript.</p>
                <p>• <strong>Auto (recomendado)</strong> intentará usar firecrawl (si la clave API está presente). Luego, usará Jina hasta alcanzar el límite (o seguirá usando Jina si configuras la clave API). Volverá a simple cuando ninguna de las opciones anteriores sea posible.</p>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Embedding y Búsqueda</CardTitle>
          <CardDescription>
            Configura las opciones de búsqueda y embedding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="embedding">Opción de Embedding Predeterminada</Label>
            <Controller
              name="default_embedding_option"
              control={control}
              render={({ field }) => (
                <Select
                  key={field.value}
                  value={field.value || ''}
                  onValueChange={field.onChange}
                  disabled={field.disabled || isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona la opción de embedding" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ask">Preguntar</SelectItem>
                    <SelectItem value="always">Siempre</SelectItem>
                    <SelectItem value="never">Nunca</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <Collapsible open={expandedSections.embedding} onOpenChange={() => toggleSection('embedding')}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${expandedSections.embedding ? 'rotate-180' : ''}`} />
                Ayúdame a elegir
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 text-sm text-muted-foreground space-y-2">
                <p>Embeber el contenido facilitará que tú y tus agentes de IA lo encuentren. Si estás ejecutando un modelo de embedding local (Ollama, por ejemplo), no deberías preocuparte por el costo y simplemente embeber todo. Para proveedores en línea, es posible que quieras tener cuidado solo si procesas mucho contenido (como cientos de documentos al día).</p>
                <p>• Elige <strong>siempre</strong> si estás ejecutando un modelo de embedding local o si tu volumen de contenido no es muy grande</p>
                <p>• Elige <strong>preguntar</strong> si quieres decidir cada vez</p>
                <p>• Elige <strong>nunca</strong> si no te importa la búsqueda vectorial o no tienes un proveedor de embedding.</p>
                <p>Como referencia, text-embedding-3-small de OpenAI cuesta alrededor de 0.02 por 1 millón de tokens, que es aproximadamente 30 veces la página de Wikipedia de la Tierra. Con la API de Gemini, Text Embedding 004 es gratuito con un límite de tasa de 1500 solicitudes por minuto.</p>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Archivos</CardTitle>
          <CardDescription>
            Configura las opciones de manejo y almacenamiento de archivos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="auto_delete">Eliminar Archivos Automáticamente</Label>
            <Controller
              name="auto_delete_files"
              control={control}
              render={({ field }) => (
                <Select
                  key={field.value}
                  value={field.value || ''}
                  onValueChange={field.onChange}
                  disabled={field.disabled || isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona la opción de eliminación automática" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Sí</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <Collapsible open={expandedSections.files} onOpenChange={() => toggleSection('files')}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${expandedSections.files ? 'rotate-180' : ''}`} />
                Ayúdame a elegir
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 text-sm text-muted-foreground space-y-2">
                <p>Una vez que tus archivos se cargan y procesan, ya no son necesarios. La mayoría de los usuarios deberían permitir que Open Notebook elimine automáticamente los archivos cargados de la carpeta de carga. Elige <strong>no</strong>, SOLO si estás usando Notebook como la ubicación de almacenamiento principal para esos archivos (lo cual no deberías hacer en absoluto). Esta opción pronto quedará obsoleta en favor de descargar siempre los archivos.</p>
                <p>• Elige <strong>sí</strong> (recomendado) para eliminar automáticamente los archivos cargados después del procesamiento</p>
                <p>• Elige <strong>no</strong> solo si necesitas mantener los archivos originales en la carpeta de carga</p>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!isDirty || updateSettings.isPending}
        >
          {updateSettings.isPending ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>
    </form>
  )
}
