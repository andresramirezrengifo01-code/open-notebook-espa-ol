'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ExternalLink } from 'lucide-react'

interface EmbeddingModelChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  oldModelName?: string
  newModelName?: string
}

export function EmbeddingModelChangeDialog({
  open,
  onOpenChange,
  onConfirm,
  oldModelName,
  newModelName
}: EmbeddingModelChangeDialogProps) {
  const router = useRouter()
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirmAndRebuild = () => {
    setIsConfirming(true)
    onConfirm()
    // Give a moment for the model to update, then redirect
    setTimeout(() => {
      router.push('/advanced')
      onOpenChange(false)
      setIsConfirming(false)
    }, 500)
  }

  const handleConfirmOnly = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <AlertDialogTitle>Cambio de Modelo de Embedding</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-base text-muted-foreground">
              <p>
                Estás a punto de cambiar tu modelo de embedding{' '}
                {oldModelName && newModelName && (
                  <>
                    de <strong>{oldModelName}</strong> a <strong>{newModelName}</strong>
                  </>
                )}
                .
              </p>

              <div className="bg-muted p-4 rounded-md space-y-2">
                <p className="font-semibold text-foreground">⚠️ Importante: Reconstrucción Requerida</p>
                <p className="text-sm">
                  Cambiar tu modelo de embedding requiere reconstruir todos los embeddings existentes para mantener la consistencia.
                  Sin reconstruir, tus búsquedas pueden devolver resultados incorrectos o incompletos.
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">Qué sucede después:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Tu modelo de embedding predeterminado será actualizado</li>
                  <li>Los embeddings existentes permanecerán sin cambios hasta la reconstrucción</li>
                  <li>El nuevo contenido usará el nuevo modelo de embedding</li>
                  <li>Deberías reconstruir los embeddings lo antes posible</li>
                </ul>
              </div>

              <p className="text-sm font-medium text-foreground">
                ¿Te gustaría proceder a la página Avanzado para iniciar la reconstrucción ahora?
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel disabled={isConfirming}>
            Cancelar
          </AlertDialogCancel>
          <Button
            variant="outline"
            onClick={handleConfirmOnly}
            disabled={isConfirming}
          >
            Solo Cambiar Modelo
          </Button>
          <AlertDialogAction
            onClick={handleConfirmAndRebuild}
            disabled={isConfirming}
            className="bg-primary"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Cambiar e Ir a Reconstruir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
