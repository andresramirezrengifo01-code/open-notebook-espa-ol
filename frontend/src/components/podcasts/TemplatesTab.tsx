'use client'

import { useMemo } from 'react'
import { AlertCircle, Lightbulb, Loader2 } from 'lucide-react'

import { EpisodeProfilesPanel } from '@/components/podcasts/EpisodeProfilesPanel'
import { SpeakerProfilesPanel } from '@/components/podcasts/SpeakerProfilesPanel'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useEpisodeProfiles, useSpeakerProfiles } from '@/lib/hooks/use-podcasts'
import { useModels } from '@/lib/hooks/use-models'
import { Model } from '@/lib/types/models'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

function modelsByProvider(models: Model[], type: Model['type']) {
  return models
    .filter((model) => model.type === type)
    .reduce<Record<string, string[]>>((acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = []
      }
      acc[model.provider].push(model.name)
      return acc
    }, {})
}

export function TemplatesTab() {
  const {
    episodeProfiles,
    isLoading: loadingEpisodeProfiles,
    error: episodeProfilesError,
  } = useEpisodeProfiles()

  const {
    speakerProfiles,
    usage,
    isLoading: loadingSpeakerProfiles,
    error: speakerProfilesError,
  } = useSpeakerProfiles(episodeProfiles)

  const {
    data: models = [],
    isLoading: loadingModels,
    error: modelsError,
  } = useModels()

  const languageModelOptions = useMemo(
    () => modelsByProvider(models, 'language'),
    [models]
  )
  const ttsModelOptions = useMemo(
    () => modelsByProvider(models, 'text_to_speech'),
    [models]
  )

  const isLoading = loadingEpisodeProfiles || loadingSpeakerProfiles || loadingModels
  const hasError = episodeProfilesError || speakerProfilesError || modelsError

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Espacio de trabajo de plantillas</h2>
        <p className="text-sm text-muted-foreground">
          Construye configuraciones reutilizables de episodios y locutores para una producción rápida de podcasts.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem 
          value="overview" 
          className="overflow-hidden rounded-xl border border-border bg-muted/40 px-4"
        >
          <AccordionTrigger className="gap-2 py-4 text-left text-sm font-semibold">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Cómo las plantillas impulsan la generación de podcasts
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            <div className="space-y-4">
              <p className="text-muted-foreground/90">
                Las plantillas dividen el flujo de trabajo del podcast en dos bloques de construcción reutilizables. Combínalos y mezclalos cada vez que generes un nuevo episodio.
              </p>

              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Los perfiles de episodio establecen el formato</h4>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Delinea el número de segmentos y cómo fluye la historia</li>
                  <li>Elige los modelos de lenguaje usados para briefing, esquematización y escritura del guion</li>
                  <li>Almacena briefings predeterminados para que cada episodio comience con un tono consistente</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Los perfiles de locutor dan vida a las voces</h4>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Elige el proveedor y modelo de texto a voz</li>
                  <li>Captura personalidad, historia de fondo y notas de pronunciación por locutor</li>
                  <li>Reutiliza las mismas voces de anfitrión o invitado en diferentes formatos de episodio</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Flujo de trabajo recomendado</h4>
                <ol className="list-decimal space-y-1 pl-5">
                  <li>Crea perfiles de locutor para cada voz que necesites</li>
                  <li>Construye perfiles de episodio que hagan referencia a esos locutores por nombre</li>
                  <li>Genera podcasts seleccionando el perfil de episodio que se ajuste a la historia</li>
                </ol>
                <p className="text-xs text-muted-foreground/80">
                  Los perfiles de episodio hacen referencia a perfiles de locutor por nombre, por lo que comenzar con locutores evita asignaciones de voz faltantes más adelante.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {hasError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al cargar los datos de plantillas</AlertTitle>
          <AlertDescription>
            Asegúrate de que la API esté ejecutándose e intenta de nuevo. Algunas secciones pueden estar incompletas.
          </AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando plantillas…
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <SpeakerProfilesPanel
            speakerProfiles={speakerProfiles}
            usage={usage}
            modelOptions={ttsModelOptions}
          />
          <EpisodeProfilesPanel
            episodeProfiles={episodeProfiles}
            speakerProfiles={speakerProfiles}
            modelOptions={languageModelOptions}
          />
        </div>
      )}
    </div>
  )
}
