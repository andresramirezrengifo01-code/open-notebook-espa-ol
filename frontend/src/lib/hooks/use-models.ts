import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { modelsApi } from '@/lib/api/models'
import { useToast } from '@/lib/hooks/use-toast'
import { CreateModelRequest, ModelDefaults } from '@/lib/types/models'

export const MODEL_QUERY_KEYS = {
  models: ['models'] as const,
  model: (id: string) => ['models', id] as const,
  defaults: ['models', 'defaults'] as const,
  providers: ['models', 'providers'] as const,
}

export function useModels() {
  return useQuery({
    queryKey: MODEL_QUERY_KEYS.models,
    queryFn: () => modelsApi.list(),
  })
}

export function useModel(id: string) {
  return useQuery({
    queryKey: MODEL_QUERY_KEYS.model(id),
    queryFn: () => modelsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateModel() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreateModelRequest) => modelsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MODEL_QUERY_KEYS.models })
      toast({
        title: 'Éxito',
        description: 'Modelo creado exitosamente',
      })
    },
    onError: (error: unknown) => {
      const errorMessage = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Error al crear el modelo'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteModel() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => modelsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MODEL_QUERY_KEYS.models })
      queryClient.invalidateQueries({ queryKey: MODEL_QUERY_KEYS.defaults })
      toast({
        title: 'Éxito',
        description: 'Modelo eliminado exitosamente',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Error al eliminar el modelo',
        variant: 'destructive',
      })
    },
  })
}

export function useModelDefaults() {
  return useQuery({
    queryKey: MODEL_QUERY_KEYS.defaults,
    queryFn: () => modelsApi.getDefaults(),
  })
}

export function useUpdateModelDefaults() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: Partial<ModelDefaults>) => modelsApi.updateDefaults(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MODEL_QUERY_KEYS.defaults })
      toast({
        title: 'Éxito',
        description: 'Modelos predeterminados actualizados exitosamente',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Error al actualizar los modelos predeterminados',
        variant: 'destructive',
      })
    },
  })
}

export function useProviders() {
  return useQuery({
    queryKey: MODEL_QUERY_KEYS.providers,
    queryFn: () => modelsApi.getProviders(),
  })
}
