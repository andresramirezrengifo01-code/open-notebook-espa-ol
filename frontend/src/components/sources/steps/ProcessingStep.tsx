"use client"

import { Control, Controller } from "react-hook-form"
import { FormSection } from "@/components/ui/form-section"
import { CheckboxList } from "@/components/ui/checkbox-list"
import { Checkbox } from "@/components/ui/checkbox"
import { Transformation } from "@/lib/types/transformations"
import { SettingsResponse } from "@/lib/types/api"

interface CreateSourceFormData {
  type: 'link' | 'upload' | 'text'
  title?: string
  url?: string
  content?: string
  file?: FileList | File
  notebooks?: string[]
  transformations?: string[]
  embed: boolean
  async_processing: boolean
}

interface ProcessingStepProps {
  control: Control<CreateSourceFormData>
  transformations: Transformation[]
  selectedTransformations: string[]
  onToggleTransformation: (transformationId: string) => void
  loading?: boolean
  settings?: SettingsResponse
}

export function ProcessingStep({
  control,
  transformations,
  selectedTransformations,
  onToggleTransformation,
  loading = false,
  settings
}: ProcessingStepProps) {
  const transformationItems = transformations.map((transformation) => ({
    id: transformation.id,
    title: transformation.title,
    description: transformation.description
  }))

  return (
    <div className="space-y-8">
      <FormSection
        title="Transformaciones (opcional)"
        description="Aplica transformaciones de IA para analizar y extraer insights de tu contenido."
      >
        <CheckboxList
          items={transformationItems}
          selectedIds={selectedTransformations}
          onToggle={onToggleTransformation}
          loading={loading}
          emptyMessage="No se encontraron transformaciones."
        />
      </FormSection>

      <FormSection
        title="Configuración de Procesamiento"
        description="Configura cómo se procesará y almacenará tu fuente."
      >
        <div className="space-y-4">
          {settings?.default_embedding_option === 'ask' && (
            <Controller
              control={control}
              name="embed"
              render={({ field }) => (
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-md hover:bg-muted">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium block">Habilitar incrustación para búsqueda</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Permite que esta fuente sea encontrada en búsquedas vectoriales y consultas de IA
                    </p>
                  </div>
                </label>
              )}
            />
          )}

          {settings?.default_embedding_option === 'always' && (
            <div className="p-3 rounded-md bg-primary/10 border border-primary/30">
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 bg-primary rounded-full mt-0.5 flex-shrink-0"></div>
                <div className="flex-1">
                  <span className="text-sm font-medium block text-primary">Incrustación habilitada automáticamente</span>
                  <p className="text-xs text-primary mt-1">
                    Tu configuración está configurada para siempre incrustar contenido para búsqueda vectorial.
                    Puedes cambiar esto en <span className="font-medium">Configuración</span>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {settings?.default_embedding_option === 'never' && (
            <div className="p-3 rounded-md bg-muted border border-border">
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 bg-muted-foreground rounded-full mt-0.5 flex-shrink-0"></div>
                <div className="flex-1">
                  <span className="text-sm font-medium block text-foreground">Incrustación deshabilitada</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tu configuración está configurada para omitir la incrustación. La búsqueda vectorial no estará disponible para esta fuente.
                    Puedes cambiar esto en <span className="font-medium">Configuración</span>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </FormSection>
    </div>
  )
}
