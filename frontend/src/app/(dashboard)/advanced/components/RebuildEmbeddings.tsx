'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Loader2, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { embeddingApi } from '@/lib/api/embedding'
import type { RebuildEmbeddingsRequest, RebuildStatusResponse } from '@/lib/api/embedding'

export function RebuildEmbeddings() {
  const [mode, setMode] = useState<'existing' | 'all'>('existing')
  const [includeSources, setIncludeSources] = useState(true)
  const [includeNotes, setIncludeNotes] = useState(true)
  const [includeInsights, setIncludeInsights] = useState(true)
  const [commandId, setCommandId] = useState<string | null>(null)
  const [status, setStatus] = useState<RebuildStatusResponse | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  // Rebuild mutation
  const rebuildMutation = useMutation({
    mutationFn: async (request: RebuildEmbeddingsRequest) => {
      return embeddingApi.rebuildEmbeddings(request)
    },
    onSuccess: (data) => {
      setCommandId(data.command_id)
      // Start polling for status
      startPolling(data.command_id)
    }
  })

  // Start polling for rebuild status
  const startPolling = (cmdId: string) => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }

    const interval = setInterval(async () => {
      try {
        const statusData = await embeddingApi.getRebuildStatus(cmdId)
        setStatus(statusData)

        // Stop polling if completed or failed
        if (statusData.status === 'completed' || statusData.status === 'failed') {
          stopPolling()
        }
      } catch (error) {
        console.error('Failed to fetch rebuild status:', error)
      }
    }, 5000) // Poll every 5 seconds

    setPollingInterval(interval)
  }

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
  }, [pollingInterval])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  const handleStartRebuild = () => {
    const request: RebuildEmbeddingsRequest = {
      mode,
      include_sources: includeSources,
      include_notes: includeNotes,
      include_insights: includeInsights
    }

    rebuildMutation.mutate(request)
  }

  const handleReset = () => {
    stopPolling()
    setCommandId(null)
    setStatus(null)
    rebuildMutation.reset()
  }

  const isAnyTypeSelected = includeSources || includeNotes || includeInsights
  const isRebuildActive = commandId && status && (status.status === 'queued' || status.status === 'running')

  const progressData = status?.progress
  const stats = status?.stats

  const totalItems = progressData?.total_items ?? progressData?.total ?? 0
  const processedItems = progressData?.processed_items ?? progressData?.processed ?? 0
  const derivedProgressPercent = progressData?.percentage ?? (totalItems > 0 ? (processedItems / totalItems) * 100 : 0)
  const progressPercent = Number.isFinite(derivedProgressPercent) ? derivedProgressPercent : 0

  const sourcesProcessed = stats?.sources_processed ?? stats?.sources ?? 0
  const notesProcessed = stats?.notes_processed ?? stats?.notes ?? 0
  const insightsProcessed = stats?.insights_processed ?? stats?.insights ?? 0
  const failedItems = stats?.failed_items ?? stats?.failed ?? 0

  const computedDuration = status?.started_at && status?.completed_at
    ? (new Date(status.completed_at).getTime() - new Date(status.started_at).getTime()) / 1000
    : undefined
  const processingTimeSeconds = stats?.processing_time ?? computedDuration

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔄 Reconstruir Embeddings
        </CardTitle>
        <CardDescription>
          Reconstruye los embeddings vectoriales de tu contenido. Usa esto cuando cambies de modelo de embedding o necesites corregir embeddings corruptos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration Form */}
        {!isRebuildActive && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="mode">Modo de Reconstrucción</Label>
              <Select value={mode} onValueChange={(value) => setMode(value as 'existing' | 'all')}>
                <SelectTrigger id="mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="existing">Existentes</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {mode === 'existing'
                  ? 'Re-embeber solo elementos que ya tienen embeddings (más rápido, para cambiar de modelo)'
                  : 'Re-embeber elementos existentes + crear embeddings para elementos sin ninguno (más lento, completo)'}
              </p>
            </div>

            <div className="space-y-3">
              <Label>Incluir en la Reconstrucción</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sources"
                    checked={includeSources}
                    onCheckedChange={(checked) => setIncludeSources(checked === true)}
                  />
                  <Label htmlFor="sources" className="font-normal cursor-pointer">
                    Fuentes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notes"
                    checked={includeNotes}
                    onCheckedChange={(checked) => setIncludeNotes(checked === true)}
                  />
                  <Label htmlFor="notes" className="font-normal cursor-pointer">
                    Notas
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="insights"
                    checked={includeInsights}
                    onCheckedChange={(checked) => setIncludeInsights(checked === true)}
                  />
                  <Label htmlFor="insights" className="font-normal cursor-pointer">
                    Perspectivas
                  </Label>
                </div>
              </div>
              {!isAnyTypeSelected && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Por favor selecciona al menos un tipo de elemento para reconstruir
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Button
              onClick={handleStartRebuild}
              disabled={!isAnyTypeSelected || rebuildMutation.isPending}
              className="w-full"
            >
              {rebuildMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando Reconstrucción...
                </>
              ) : (
                '🚀 Iniciar Reconstrucción'
              )}
            </Button>

            {rebuildMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Error al iniciar la reconstrucción: {(rebuildMutation.error as Error)?.message || 'Error desconocido'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Status Display */}
        {status && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {status.status === 'queued' && <Clock className="h-5 w-5 text-yellow-500" />}
                {status.status === 'running' && <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />}
                {status.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                {status.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                <div className="flex flex-col">
                  <span className="font-medium">
                    {status.status === 'queued' && 'En Cola'}
                    {status.status === 'running' && 'Ejecutando...'}
                    {status.status === 'completed' && '¡Completado!'}
                    {status.status === 'failed' && 'Fallido'}
                  </span>
                  {status.status === 'running' && (
                    <span className="text-sm text-muted-foreground">
                      Puedes abandonar esta página, se ejecutará en segundo plano
                    </span>
                  )}
                </div>
              </div>
              {(status.status === 'completed' || status.status === 'failed') && (
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Iniciar Nueva Reconstrucción
                </Button>
              )}
            </div>

            {progressData && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progreso</span>
                  <span className="font-medium">
                    {processedItems}/{totalItems} elementos ({progressPercent.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                {failedItems > 0 && (
                  <p className="text-sm text-yellow-600">
                    ⚠️ {failedItems} elementos fallaron al procesarse
                  </p>
                )}
              </div>
            )}

            {stats && (
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Fuentes</p>
                  <p className="text-2xl font-bold">{sourcesProcessed}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Notas</p>
                  <p className="text-2xl font-bold">{notesProcessed}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Perspectivas</p>
                  <p className="text-2xl font-bold">{insightsProcessed}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tiempo</p>
                  <p className="text-2xl font-bold">
                    {processingTimeSeconds !== undefined ? `${processingTimeSeconds.toFixed(1)}s` : '—'}
                  </p>
                </div>
              </div>
            )}

            {status.error_message && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{status.error_message}</AlertDescription>
              </Alert>
            )}

            {status.started_at && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Iniciado: {new Date(status.started_at).toLocaleString()}</p>
                {status.completed_at && (
                  <p>Completado: {new Date(status.completed_at).toLocaleString()}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="when">
            <AccordionTrigger>¿Cuándo debo reconstruir los embeddings?</AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm">
              <p><strong>Debes reconstruir los embeddings cuando:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Cambiar modelos de embedding:</strong> Si cambias de un modelo de embedding a otro, necesitas reconstruir todos los embeddings para asegurar consistencia.</li>
                <li><strong>Actualizar versiones del modelo:</strong> Al actualizar a una versión más nueva de tu modelo de embedding, reconstruye para aprovechar las mejoras.</li>
                <li><strong>Corregir embeddings corruptos:</strong> Si sospechas que algunos embeddings están corruptos o faltan, reconstruirlos puede restaurarlos.</li>
                <li><strong>Después de importaciones masivas:</strong> Si importaste contenido sin embeddings, usa el modo &quot;Todos&quot; para embeber todo.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="time">
            <AccordionTrigger>¿Cuánto tiempo toma reconstruir?</AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm">
              <p><strong>El tiempo de procesamiento depende de:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Número de elementos a procesar</li>
                <li>Velocidad del modelo de embedding</li>
                <li>Límites de tasa de la API (para proveedores en la nube)</li>
                <li>Recursos del sistema</li>
              </ul>
              <p className="mt-2"><strong>Tasas típicas:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Modelos locales</strong> (Ollama): Muy rápido, limitado solo por el hardware</li>
                <li><strong>APIs en la nube</strong> (OpenAI, Google): Velocidad moderada, puede alcanzar límites de tasa con conjuntos de datos grandes</li>
                <li><strong>Fuentes:</strong> Más lento que notas/perspectivas (crea múltiples fragmentos por fuente)</li>
              </ul>
              <p className="mt-2"><em>Ejemplo: Reconstruir 200 elementos puede tomar de 2-5 minutos con APIs en la nube, o menos de 1 minuto con modelos locales.</em></p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="safe">
            <AccordionTrigger>¿Es seguro reconstruir mientras uso la aplicación?</AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm">
              <p><strong>¡Sí, reconstruir es seguro!</strong> El proceso de reconstrucción:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>✅ <strong>Es idempotente:</strong> Ejecutar múltiples veces produce el mismo resultado</li>
                <li>✅ <strong>No elimina contenido:</strong> Solo reemplaza los embeddings</li>
                <li>✅ <strong>Puede ejecutarse en cualquier momento:</strong> No necesitas detener otras operaciones</li>
                <li>✅ <strong>Maneja errores con elegancia:</strong> Los elementos fallidos se registran y se omiten</li>
              </ul>
              <p className="mt-2">⚠️ <strong>Sin embargo:</strong> Reconstrucciones muy grandes (miles de elementos) pueden ralentizar temporalmente las búsquedas durante el procesamiento.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
