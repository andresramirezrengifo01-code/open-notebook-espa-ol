'use client'

import { useMemo, useState } from 'react'

import { AppShell } from '@/components/layout/AppShell'
import { NotebookList } from './components/NotebookList'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw } from 'lucide-react'
import { useNotebooks } from '@/lib/hooks/use-notebooks'
import { CreateNotebookDialog } from '@/components/notebooks/CreateNotebookDialog'
import { Input } from '@/components/ui/input'

export default function NotebooksPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { data: notebooks, isLoading, refetch } = useNotebooks(false)
  const { data: archivedNotebooks } = useNotebooks(true)

  const normalizedQuery = searchTerm.trim().toLowerCase()

  const filteredActive = useMemo(() => {
    if (!notebooks) {
      return undefined
    }
    if (!normalizedQuery) {
      return notebooks
    }
    return notebooks.filter((notebook) =>
      notebook.name.toLowerCase().includes(normalizedQuery)
    )
  }, [notebooks, normalizedQuery])

  const filteredArchived = useMemo(() => {
    if (!archivedNotebooks) {
      return undefined
    }
    if (!normalizedQuery) {
      return archivedNotebooks
    }
    return archivedNotebooks.filter((notebook) =>
      notebook.name.toLowerCase().includes(normalizedQuery)
    )
  }, [archivedNotebooks, normalizedQuery])

  const hasArchived = (archivedNotebooks?.length ?? 0) > 0
  const isSearching = normalizedQuery.length > 0

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Cuadernos</h1>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar cuadernos..."
              className="w-full sm:w-64"
            />
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cuaderno
            </Button>
          </div>
        </div>
        
        <div className="space-y-8">
          <NotebookList
            notebooks={filteredActive}
            isLoading={isLoading}
            title="Cuadernos Activos"
            emptyTitle={isSearching ? 'No hay cuadernos que coincidan con tu búsqueda' : undefined}
            emptyDescription={isSearching ? 'Intenta usar un nombre de cuaderno diferente.' : undefined}
          />
          
          {hasArchived && (
            <NotebookList
              notebooks={filteredArchived}
              isLoading={false}
              title="Cuadernos Archivados"
              collapsible
              emptyTitle={isSearching ? 'No hay cuadernos archivados que coincidan con tu búsqueda' : undefined}
              emptyDescription={isSearching ? 'Modifica tu búsqueda para encontrar cuadernos archivados.' : undefined}
            />
          )}
        </div>
      </div>

      <CreateNotebookDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </AppShell>
  )
}
