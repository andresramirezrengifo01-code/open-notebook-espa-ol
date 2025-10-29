'use client'

import { useCallback, useState } from 'react'
import { AlertCircle, Loader2, RefreshCcw } from 'lucide-react'

import { useDeletePodcastEpisode, usePodcastEpisodes } from '@/lib/hooks/use-podcasts'
import { EpisodeCard } from '@/components/podcasts/EpisodeCard'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { GeneratePodcastDialog } from '@/components/podcasts/GeneratePodcastDialog'

const STATUS_ORDER: Array<{
  key: 'running' | 'completed' | 'failed' | 'pending'
  title: string
  description?: string
}> = [
  {
    key: 'running',
    title: 'Actualmente en Procesamiento',
    description: 'Episodios que están generando activos activamente.',
  },
  {
    key: 'pending',
    title: 'En Cola / Pendiente',
    description: 'Episodios enviados esperando para comenzar el procesamiento.',
  },
  {
    key: 'completed',
    title: 'Episodios Completados',
    description: 'Listos para revisar, descargar o publicar.',
  },
  {
    key: 'failed',
    title: 'Episodios Fallidos',
    description: 'Episodios que encontraron problemas durante la generación.',
  },
]

function SummaryBadge({ label, value }: { label: string; value: number }) {
  return (
    <Badge variant="outline" className="font-medium">
      <span className="text-muted-foreground mr-1.5">{label}</span>
      <span className="text-foreground">{value}</span>
    </Badge>
  )
}

export function EpisodesTab() {
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const {
    episodes,
    statusGroups,
    statusCounts,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = usePodcastEpisodes()
  const deleteEpisode = useDeletePodcastEpisode()

  const handleRefresh = useCallback(() => {
    void refetch()
  }, [refetch])

  const handleDelete = useCallback(
    (episodeId: string) => deleteEpisode.mutateAsync(episodeId),
    [deleteEpisode]
  )

  const emptyState = !isLoading && episodes.length === 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Vista general de episodios</h2>
          <p className="text-sm text-muted-foreground">
            Monitorea los trabajos de generación de podcasts y revisa los artefactos finales.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowGenerateDialog(true)}>
            Generar Podcast
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 h-4 w-4" />
            )}
            Actualizar
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <SummaryBadge label="Total" value={statusCounts.total} />
        <SummaryBadge label="Procesando" value={statusCounts.running} />
        <SummaryBadge label="Completados" value={statusCounts.completed} />
        <SummaryBadge label="Fallidos" value={statusCounts.failed} />
        <SummaryBadge label="Pendientes" value={statusCounts.pending} />
      </div>

      {isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al cargar los episodios</AlertTitle>
          <AlertDescription>
            No pudimos obtener los últimos episodios de podcast. Intenta de nuevo en breve.
          </AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando episodios…
        </div>
      ) : null}

      {emptyState ? (
        <div className="rounded-lg border border-dashed bg-muted/30 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Aún no hay episodios de podcast. Genera tu primer episodio desde las interfaces de chat de cuaderno o fuente.
          </p>
        </div>
      ) : null}

      {STATUS_ORDER.map(({ key, title, description }) => {
        const data = statusGroups[key]
        if (!data || data.length === 0) {
          return null
        }

        return (
          <section key={key} className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold leading-tight">{title}</h3>
              {description ? (
                <p className="text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            <Separator />
            <div className="space-y-4">
              {data.map((episode) => (
                <EpisodeCard
                  key={episode.id}
                  episode={episode}
                  onDelete={handleDelete}
                  deleting={deleteEpisode.isPending}
                />
              ))}
            </div>
          </section>
        )
      })}

      <GeneratePodcastDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
      />
    </div>
  )
}
