"use client"

import { Control, FieldErrors, UseFormRegister, useWatch } from "react-hook-form"
import { FileIcon, LinkIcon, FileTextIcon } from "lucide-react"
import { FormSection } from "@/components/ui/form-section"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Controller } from "react-hook-form"

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

const SOURCE_TYPES = [
  {
    value: 'link' as const,
    label: 'Enlace',
    icon: LinkIcon,
    description: 'Agregar una página web o URL',
  },
  {
    value: 'upload' as const,
    label: 'Subir',
    icon: FileIcon,
    description: 'Subir un documento o archivo',
  },
  {
    value: 'text' as const,
    label: 'Texto',
    icon: FileTextIcon,
    description: 'Agregar contenido de texto directamente',
  },
]

interface SourceTypeStepProps {
  control: Control<CreateSourceFormData>
  register: UseFormRegister<CreateSourceFormData>
  errors: FieldErrors<CreateSourceFormData>
}

export function SourceTypeStep({ control, register, errors }: SourceTypeStepProps) {
  // Watch the selected type to make title conditional
  const selectedType = useWatch({ control, name: 'type' })
  return (
    <div className="space-y-6">
      <FormSection
        title="Tipo de Fuente"
        description="Elige cómo deseas agregar tu contenido"
      >
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Tabs 
              value={field.value || ''} 
              onValueChange={(value) => field.onChange(value as 'link' | 'upload' | 'text')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                {SOURCE_TYPES.map((type) => {
                  const Icon = type.icon
                  return (
                    <TabsTrigger key={type.value} value={type.value} className="gap-2">
                      <Icon className="h-4 w-4" />
                      {type.label}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
              
              {SOURCE_TYPES.map((type) => (
                <TabsContent key={type.value} value={type.value} className="mt-4">
                  <p className="text-sm text-muted-foreground mb-4">{type.description}</p>
                  
                  {/* Type-specific fields */}
                  {type.value === 'link' && (
                    <div>
                      <Label htmlFor="url" className="mb-2 block">URL *</Label>
                      <Input
                        id="url"
                        {...register('url')}
                        placeholder="https://example.com/article"
                        type="url"
                      />
                      {errors.url && (
                        <p className="text-sm text-destructive mt-1">{errors.url.message}</p>
                      )}
                    </div>
                  )}
                  
                  {type.value === 'upload' && (
                    <div>
                      <Label htmlFor="file" className="mb-2 block">Archivo *</Label>
                      <Input
                        id="file"
                        type="file"
                        {...register('file')}
                        accept=".pdf,.doc,.docx,.txt,.md,.epub"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Formatos soportados: PDF, DOC, DOCX, TXT, MD, EPUB
                      </p>
                      {errors.file && (
                        <p className="text-sm text-destructive mt-1">{errors.file.message}</p>
                      )}
                    </div>
                  )}
                  
                  {type.value === 'text' && (
                    <div>
                      <Label htmlFor="content" className="mb-2 block">Contenido de Texto *</Label>
                      <Textarea
                        id="content"
                        {...register('content')}
                        placeholder="Pega o escribe tu contenido aquí..."
                        rows={6}
                      />
                      {errors.content && (
                        <p className="text-sm text-destructive mt-1">{errors.content.message}</p>
                      )}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        />
        {errors.type && (
          <p className="text-sm text-destructive mt-1">{errors.type.message}</p>
        )}
      </FormSection>

      <FormSection
        title={selectedType === 'text' ? "Título *" : "Título (opcional)"}
        description={selectedType === 'text'
          ? "Se requiere un título para el contenido de texto"
          : "Si se deja vacío, se generará un título del contenido"
        }
      >
        <Input
          id="title"
          {...register('title')}
          placeholder="Dale a tu fuente un título descriptivo"
        />
        {errors.title && (
          <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
        )}
      </FormSection>
    </div>
  )
}
