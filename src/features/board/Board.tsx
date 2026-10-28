import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { STAGES, STAGE_LABELS } from '@/lib/constants'
import type { Application, Stage } from '@/lib/schema'
import { positionAtIndex } from '@/lib/position'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { STAGE_STYLES } from '@/components/ui/stage-styles'
import { useEditor } from '@/hooks/useEditor'
import { useMoveApplication } from '@/hooks/useApplications'
import { CardView, SortableCard } from './BoardCard'
import { groupByStage, type Columns } from './columns'

const COLUMN_PREFIX = 'column:'
const columnId = (s: Stage) => `${COLUMN_PREFIX}${s}`

export function Board({ apps }: { apps: Application[] }) {
  const editor = useEditor()
  const move = useMoveApplication()
  const byId = useMemo(() => new Map(apps.map((a) => [a.id, a])), [apps])
  const serverColumns = useMemo(() => groupByStage(apps), [apps])

  // While dragging (and until the optimistic update lands) we render a local copy.
  const [override, setOverride] = useState<Columns | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const columns = override ?? serverColumns
  const columnsRef = useRef(columns)
  columnsRef.current = columns
  const originRef = useRef<Stage | null>(null)

  useEffect(() => {
    if (!activeId) setOverride(null)
    // Only re-sync when server data changes, not when a drag ends.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverColumns])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Enter opens the card, so only Space picks it up.
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
    }),
  )

  const findStage = useCallback((id: UniqueIdentifier, cols: Columns): Stage | undefined => {
    const s = String(id)
    if (s.startsWith(COLUMN_PREFIX)) return s.slice(COLUMN_PREFIX.length) as Stage
    return STAGES.find((stage) => cols[stage].includes(s))
  }, [])

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id))
    setOverride(columnsRef.current)
    originRef.current = findStage(active.id, columnsRef.current) ?? null
  }

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    setOverride((prev) => {
      const cols = prev ?? serverColumns
      const from = findStage(active.id, cols)
      const to = findStage(over.id, cols)
      if (!from || !to || from === to) return prev
      const id = String(active.id)
      const target = cols[to]
      const overIndex = target.indexOf(String(over.id))
      const index = overIndex === -1 ? target.length : overIndex
      return {
        ...cols,
        [from]: cols[from].filter((x) => x !== id),
        [to]: [...target.slice(0, index), id, ...target.slice(index)],
      }
    })
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const id = String(active.id)
    setActiveId(null)
    const cols = columnsRef.current
    const stage = findStage(active.id, cols)
    const app = byId.get(id)
    if (!over || !stage || !app) return setOverride(null)

    let ids = cols[stage]
    const overIndex = ids.indexOf(String(over.id))
    const fromIndex = ids.indexOf(id)
    if (overIndex !== -1 && overIndex !== fromIndex) ids = arrayMove(ids, fromIndex, overIndex)
    const index = ids.indexOf(id)

    const neighbours = ids.filter((x) => x !== id).map((x) => byId.get(x)!)
    const position = positionAtIndex(neighbours, index)
    if (stage === app.stage && ids.join() === serverColumns[stage].join()) return setOverride(null)

    setOverride({ ...cols, [stage]: ids })
    move.mutate({ app, stage, position })
  }

  const onDragCancel = () => {
    setActiveId(null)
    setOverride(null)
  }

  const announcements = useMemo<Announcements>(() => {
    const name = (id: UniqueIdentifier) => byId.get(String(id))?.company ?? 'Application'
    // Describe the slot under `overId` (a card or an empty column) in words.
    const where = (overId: UniqueIdentifier) => {
      const cols = columnsRef.current
      const stage = findStage(overId, cols)
      if (!stage) return ''
      const i = cols[stage].indexOf(String(overId))
      const total = cols[stage].length
      return `${STAGE_LABELS[stage]}, position ${i === -1 ? total : i + 1} of ${total}`
    }
    return {
      onDragStart: ({ active }) => `Picked up ${name(active.id)}. In ${where(active.id)}.`,
      onDragOver: ({ active, over }) =>
        over
          ? `${name(active.id)} is now in ${where(over.id)}.`
          : `${name(active.id)} is not over a column.`,
      onDragEnd: ({ active, over }) =>
        over ? `Dropped ${name(active.id)} in ${where(over.id)}.` : `Dropped ${name(active.id)}.`,
      onDragCancel: ({ active }) =>
        `Moving cancelled. ${name(active.id)} returned to ${originRef.current ? STAGE_LABELS[originRef.current] : 'its column'}.`,
    }
  }, [byId, findStage])

  const active = activeId ? byId.get(activeId) : undefined

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      // Measure columns before a drag starts, so an arrow key pressed immediately
      // after picking a card up already has somewhere to go.
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            'To move an application, press Space to pick it up. Use the arrow keys to move it between columns and positions, then press Space to drop it or Escape to cancel. Press Enter to open it.',
        },
      }}
    >
      <div
        className="flex h-full gap-3 overflow-x-auto px-4 pb-4 max-sm:snap-x max-sm:snap-mandatory sm:px-6"
        role="region"
        aria-label="Application board"
      >
        {STAGES.map((stage) => (
          <Column
            key={stage}
            stage={stage}
            ids={columns[stage]}
            byId={byId}
            onOpen={editor.open}
            onAdd={editor.openNew}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: 'ease-out' }}>
        {active ? <CardView app={active} overlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}

interface ColumnProps {
  stage: Stage
  ids: string[]
  byId: Map<string, Application>
  onOpen: (id: string) => void
  onAdd: (stage: Stage) => void
}

function Column({ stage, ids, byId, onOpen, onAdd }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId(stage) })
  const headingId = `col-${stage}`
  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        'bg-subtle flex w-[82vw] max-w-72 shrink-0 flex-col rounded-xl border border-transparent max-sm:snap-start sm:w-72',
        isOver && 'border-brand-500/50',
      )}
      data-testid={`column-${stage}`}
    >
      <header className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span aria-hidden className={cn('size-2 rounded-full', STAGE_STYLES[stage].dot)} />
        <h2 id={headingId} className="text-sm font-semibold">
          {STAGE_LABELS[stage]}
        </h2>
        <span className="text-muted text-xs tabular-nums" aria-label={`${ids.length} applications`}>
          {ids.length}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto size-7"
          aria-label={`Add application to ${STAGE_LABELS[stage]}`}
          onClick={() => onAdd(stage)}
        >
          <Plus className="size-4" />
        </Button>
      </header>
      <SortableContext id={stage} items={ids} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2"
        >
          {ids.map((id) => {
            const app = byId.get(id)
            return app ? <SortableCard key={id} app={app} onOpen={onOpen} /> : null
          })}
          {ids.length === 0 && (
            <p className="text-muted border-base m-1 rounded-lg border border-dashed p-4 text-center text-xs">
              Drop applications here
            </p>
          )}
        </div>
      </SortableContext>
    </section>
  )
}
