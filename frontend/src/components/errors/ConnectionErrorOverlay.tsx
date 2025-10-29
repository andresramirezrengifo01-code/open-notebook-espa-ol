'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Database, Server, ChevronDown, ExternalLink } from 'lucide-react'
import { ConnectionError } from '@/lib/types/config'

interface ConnectionErrorOverlayProps {
  error: ConnectionError
  onRetry: () => void
}

export function ConnectionErrorOverlay({
  error,
  onRetry,
}: ConnectionErrorOverlayProps) {
  const [showDetails, setShowDetails] = useState(false)
  const isApiError = error.type === 'api-unreachable'

  return (
    <div
      className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <Card className="max-w-2xl w-full p-8 space-y-6">
        {/* Error icon and title */}
        <div className="flex items-center gap-4">
          {isApiError ? (
            <Server className="w-12 h-12 text-destructive" aria-hidden="true" />
          ) : (
            <Database className="w-12 h-12 text-destructive" aria-hidden="true" />
          )}
          <div>
            <h1 className="text-2xl font-bold" id="error-title">
              {isApiError
                ? 'No se puede conectar al servidor API'
                : 'Fallo en la conexión a la base de datos'}
            </h1>
            <p className="text-muted-foreground">
              {isApiError
                ? 'No se pudo alcanzar el servidor API de Open Notebook'
                : 'El servidor API está ejecutándose, pero la base de datos no es accesible'}
            </p>
          </div>
        </div>

        {/* Troubleshooting instructions */}
        <div className="space-y-4 border-l-4 border-primary pl-4">
          <h2 className="font-semibold">Esto generalmente significa:</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            {isApiError ? (
              <>
                <li>El servidor API no está ejecutándose</li>
                <li>El servidor API está ejecutándose en una dirección diferente</li>
                <li>Problemas de conectividad de red</li>
              </>
            ) : (
              <>
                <li>SurrealDB no está ejecutándose</li>
                <li>La configuración de conexión a la base de datos es incorrecta</li>
                <li>Problemas de red entre API y base de datos</li>
              </>
            )}
          </ul>

          <h2 className="font-semibold mt-4">Soluciones rápidas:</h2>
          {isApiError ? (
            <div className="space-y-2 text-sm bg-muted p-4 rounded">
              <p className="font-medium">Configura la variable de entorno API_URL:</p>
              <code className="block bg-background p-2 rounded text-xs">
                # Para Docker:
                <br />
                docker run -e API_URL=http://your-host:5055 ...
                <br />
                <br />
                # Para desarrollo local (archivo .env):
                <br />
                API_URL=http://localhost:5055
              </code>
            </div>
          ) : (
            <div className="space-y-2 text-sm bg-muted p-4 rounded">
              <p className="font-medium">Verifica si SurrealDB está ejecutándose:</p>
              <code className="block bg-background p-2 rounded text-xs">
                # Para Docker:
                <br />
                docker compose ps | grep surrealdb
                <br />
                docker compose logs surrealdb
              </code>
            </div>
          )}
        </div>

        {/* Documentation link */}
        <div className="text-sm">
          <p>Para instrucciones detalladas de configuración, consulta:</p>
          <a
            href="https://github.com/lfnovo/open-notebook"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            Documentación de Open Notebook
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Collapsible technical details */}
        {error.details && (
          <Collapsible open={showDetails} onOpenChange={setShowDetails}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span>Mostrar Detalles Técnicos</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showDetails ? 'rotate-180' : ''
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="space-y-2 text-sm bg-muted p-4 rounded font-mono">
                {error.details.attemptedUrl && (
                  <div>
                    <strong>URL Intentada:</strong> {error.details.attemptedUrl}
                  </div>
                )}
                {error.details.message && (
                  <div>
                    <strong>Mensaje:</strong> {error.details.message}
                  </div>
                )}
                {error.details.technicalMessage && (
                  <div>
                    <strong>Detalles Técnicos:</strong>{' '}
                    {error.details.technicalMessage}
                  </div>
                )}
                {error.details.stack && (
                  <div>
                    <strong>Rastreo de Pila:</strong>
                    <pre className="mt-2 overflow-x-auto text-xs">
                      {error.details.stack}
                    </pre>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Retry button */}
        <div className="pt-4 border-t">
          <Button onClick={onRetry} className="w-full" size="lg">
            Reintentar Conexión
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Presiona R o haz clic en el botón para reintentar
          </p>
        </div>
      </Card>
    </div>
  )
}
