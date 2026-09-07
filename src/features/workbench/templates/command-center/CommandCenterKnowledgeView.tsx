import { useState } from 'react'
import {
  ArrowUpRight,
  Eye,
  FolderOpen,
  Shapes,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  getLocaleDateLocale,
  translate,
  type TranslationKey,
} from '../../../../lib/i18n'
import type { VaultEntry } from '../../../../types'
import type {
  WorkbenchDestinationKind,
  WorkbenchDestinationSummary,
} from '../../core/workbenchTypes'
import type { WorkbenchTemplateRendererProps } from '../../host/workbenchRendererTypes'

type KnowledgeProps = Pick<WorkbenchTemplateRendererProps, 'locale' | 'model' | 'navigation'>

const NODE_POSITIONS = [
  { x: 19, y: 26 },
  { x: 50, y: 18 },
  { x: 80, y: 27 },
  { x: 82, y: 69 },
  { x: 51, y: 82 },
  { x: 20, y: 72 },
] as const

const HUB_POSITION = { x: 50, y: 50 } as const

const CONSTELLATION_GUIDES = [
  { from: 0, path: 'M19 26 Q34 19 50 18', to: 1 },
  { from: 2, path: 'M80 27 Q84 48 82 69', to: 3 },
  { from: 5, path: 'M20 72 Q35 82 51 82', to: 4 },
] as const

const GROUP_LABELS: Record<WorkbenchDestinationKind, TranslationKey> = {
  type: 'workbench.knowledge.portals.types',
  folder: 'workbench.knowledge.portals.folders',
  view: 'workbench.knowledge.portals.views',
}

const GROUP_CODES: Record<WorkbenchDestinationKind, string> = {
  type: 'TYPES',
  folder: 'FOLDERS',
  view: 'VIEWS',
}

const KIND_LABELS: Record<WorkbenchDestinationKind, TranslationKey> = {
  type: 'workbench.knowledge.kind.type',
  folder: 'workbench.knowledge.kind.folder',
  view: 'workbench.knowledge.kind.view',
}

function formatCount(locale: KnowledgeProps['locale'], value: number): string {
  return new Intl.NumberFormat(getLocaleDateLocale(locale)).format(value)
}

function nodeSize(noteCount: number, maximum: number): number {
  if (maximum <= 0) return 82
  return Math.round(76 + 24 * Math.sqrt(noteCount / maximum))
}

function PanelHeading({
  eyebrow,
  locale,
  marker,
  title,
}: {
  eyebrow: TranslationKey
  locale: KnowledgeProps['locale']
  marker: string
  title: TranslationKey
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          {translate(locale, eyebrow)}
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">{translate(locale, title)}</h2>
      </div>
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
        {marker}
      </span>
    </div>
  )
}

function KnowledgeMap({ locale, model }: Pick<KnowledgeProps, 'locale' | 'model'>) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const clusters = model.knowledgeClusters.slice(0, NODE_POSITIONS.length)
  const selected = clusters.find((cluster) => cluster.id === selectedId)
  const maximum = Math.max(...clusters.map((cluster) => cluster.noteCount), 0)
  const selectedName = selected?.label ?? translate(locale, 'workbench.knowledge.all')
  const selectedNoteCount = selected?.noteCount ?? model.summary.noteCount
  const selectedLinkedCount = selected?.linkedEntryCount ?? model.relationshipSummary.linkedEntryCount

  return (
    <section
      aria-label={translate(locale, 'workbench.knowledge.map.title')}
      className="min-w-0 rounded-[1.25rem] border border-border bg-card/85 p-[1.3125rem] shadow-[0_18px_50px_color-mix(in_srgb,var(--foreground)_8%,transparent)] backdrop-blur-sm"
    >
      <PanelHeading
        eyebrow="workbench.knowledge.map.eyebrow"
        locale={locale}
        marker={translate(locale, 'workbench.knowledge.localReadOnly')}
        title="workbench.knowledge.map.title"
      />
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {translate(locale, 'workbench.knowledge.map.description')}
      </p>

      <div
        className="relative mt-4 min-h-[31rem] overflow-hidden rounded-[1.0625rem] border border-primary/25 bg-background/65 shadow-[inset_0_0_42px_color-mix(in_srgb,var(--primary)_4%,transparent)]"
        data-testid="workbench-knowledge-map-canvas"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 43%, color-mix(in srgb, var(--primary) 13%, transparent), transparent 29%), linear-gradient(color-mix(in srgb, var(--primary) 9%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--primary) 9%, transparent) 1px, transparent 1px)',
          backgroundSize: 'auto, 28px 28px, 28px 28px',
        }}
      >
        <div className="absolute inset-x-0 bottom-[5.75rem] top-0" data-testid="workbench-knowledge-node-field">
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-[49%] aspect-square w-[min(57%,20.625rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/15"
          />
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-[49%] aspect-square w-[min(78%,29.375rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10 opacity-70"
          />
          <svg aria-hidden="true" className="absolute inset-0 size-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            {clusters.map((cluster, index) => (
              <path
                d={`M${HUB_POSITION.x} ${HUB_POSITION.y} Q${(HUB_POSITION.x + NODE_POSITIONS[index].x) / 2} ${(HUB_POSITION.y + NODE_POSITIONS[index].y) / 2 - 2} ${NODE_POSITIONS[index].x} ${NODE_POSITIONS[index].y}`}
                fill="none"
                key={cluster.id}
                stroke="color-mix(in srgb, var(--primary) 42%, var(--border))"
                strokeWidth={index === 0 || index === 2 || index === 5 ? '0.46' : '0.3'}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {CONSTELLATION_GUIDES.filter(({ from, to }) => clusters[from] && clusters[to]).map(({ path }) => (
              <path
                d={path}
                fill="none"
                key={path}
                opacity="0.52"
                stroke="color-mix(in srgb, var(--primary) 28%, var(--border))"
                strokeWidth="0.28"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          <Button
            aria-label={translate(locale, 'workbench.knowledge.inspectAll')}
            aria-pressed={selected === undefined}
            className="absolute z-10 size-[7.875rem] -translate-x-1/2 -translate-y-1/2 flex-col rounded-full border border-primary bg-primary p-2 text-center text-primary-foreground shadow-[0_0_0_10px_color-mix(in_srgb,var(--primary)_10%,transparent),0_18px_42px_color-mix(in_srgb,var(--primary)_28%,transparent)] hover:bg-primary/90"
            data-node-kind="core"
            style={{ left: `${HUB_POSITION.x}%`, top: `${HUB_POSITION.y}%` }}
            type="button"
            onClick={() => setSelectedId(null)}
          >
            <strong className="text-sm font-semibold">{translate(locale, 'workbench.knowledge.all')}</strong>
            <span className="text-[10px] font-normal opacity-75">
              {translate(locale, 'workbench.knowledge.notes', { count: formatCount(locale, model.summary.noteCount) })}
            </span>
          </Button>

          {clusters.map((cluster, index) => {
            const position = NODE_POSITIONS[index]
            const size = nodeSize(cluster.noteCount, maximum)
            const isSelected = selected?.id === cluster.id
            return (
              <Button
                aria-label={translate(locale, 'workbench.knowledge.inspectCluster', { title: cluster.label })}
                aria-pressed={isSelected}
                className={`absolute z-10 flex-col whitespace-normal rounded-full border p-2 text-center shadow-[0_10px_30px_color-mix(in_srgb,var(--primary)_18%,transparent)] transition-[background-color,box-shadow] duration-200 ${
                  isSelected
                    ? 'border-primary bg-primary/15 text-foreground ring-[7px] ring-primary/10 hover:bg-primary/15'
                    : 'border-primary/35 bg-card/95 text-foreground hover:border-primary/60 hover:bg-primary/10'
                }`}
                data-node-slot={index + 1}
                key={cluster.id}
                style={{
                  height: `min(${size}px, 22vw)`,
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  transform: `translate(-50%, -50%)${isSelected ? ' scale(1.045)' : ''}`,
                  width: `min(${size}px, 22vw)`,
                }}
                type="button"
                variant="outline"
                onClick={() => setSelectedId(cluster.id)}
              >
                <strong className="max-w-[86%] text-xs font-semibold leading-tight [overflow-wrap:anywhere]">{cluster.label}</strong>
                <span className="mt-1 text-[10px] font-normal leading-tight text-muted-foreground">
                  {translate(locale, 'workbench.knowledge.notes', { count: formatCount(locale, cluster.noteCount) })}
                </span>
              </Button>
            )
          })}
        </div>

        <div
          aria-live="polite"
          className="absolute inset-x-[0.9375rem] bottom-[0.875rem] z-20 grid min-h-[4.125rem] items-center gap-3 rounded-[0.8125rem] border border-border bg-card/95 px-[0.8125rem] py-[0.6875rem] shadow-[0_12px_30px_color-mix(in_srgb,var(--foreground)_10%,transparent)] backdrop-blur-xl sm:grid-cols-[minmax(0,1.25fr)_minmax(5rem,0.5fr)_minmax(5rem,0.5fr)]"
          data-testid="workbench-knowledge-inspector"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{selectedName}</p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {translate(locale, selected ? 'workbench.knowledge.clusterDescription' : 'workbench.knowledge.allDescription')}
            </p>
          </div>
          <div className="border-border sm:border-l sm:pl-3">
            <strong className="block text-base font-semibold">{formatCount(locale, selectedNoteCount)}</strong>
            <span className="text-[10px] text-muted-foreground">{translate(locale, 'workbench.stats.notes')}</span>
          </div>
          <div className="border-border sm:border-l sm:pl-3">
            <strong className="block text-base font-semibold">{formatCount(locale, selectedLinkedCount)}</strong>
            <span className="text-[10px] text-muted-foreground">{translate(locale, 'workbench.knowledge.connectedInSelection')}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full border-2 border-primary" />{translate(locale, 'workbench.knowledge.legend.node')}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-px w-5 bg-primary" />{translate(locale, 'workbench.knowledge.legend.link')}</span>
        <span>{translate(locale, 'workbench.knowledge.legend.size')}</span>
      </div>
    </section>
  )
}

function RelationshipHealth({ locale, model }: Pick<KnowledgeProps, 'locale' | 'model'>) {
  const linked = model.relationshipSummary.linkedEntryCount
  const total = model.summary.noteCount
  const ratio = total > 0 ? Math.round((linked / total) * 100) : 0
  const isolated = Math.max(total - linked, 0)
  const metrics = [
    ['workbench.knowledge.health.linked', linked],
    ['workbench.knowledge.health.outgoing', model.relationshipSummary.outgoingLinkCount],
    ['workbench.knowledge.health.structured', model.relationshipSummary.relationshipReferenceCount],
    ['workbench.knowledge.health.isolated', isolated],
  ] as const

  return (
    <section className="rounded-[1.25rem] border border-border bg-card/85 p-[1.1875rem] shadow-[0_18px_50px_color-mix(in_srgb,var(--foreground)_8%,transparent)] backdrop-blur-sm">
      <PanelHeading
        eyebrow="workbench.knowledge.health.eyebrow"
        locale={locale}
        marker={translate(locale, 'workbench.knowledge.realData')}
        title="workbench.knowledge.health.title"
      />
      <div className="mt-5 grid items-center gap-4 sm:grid-cols-[7.5rem_minmax(0,1fr)] lg:grid-cols-1 xl:grid-cols-[7.5rem_minmax(0,1fr)]">
        <div
          aria-label={translate(locale, 'workbench.knowledge.health.ratioLabel', { ratio })}
          className="relative mx-auto flex size-28 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(var(--primary) 0 ${ratio}%, var(--muted) ${ratio}% 100%)` }}
        >
          <div className="absolute inset-3.5 rounded-full bg-card" />
          <div className="relative text-center">
            <strong className="block text-2xl font-semibold text-primary">{ratio}%</strong>
            <span className="text-[10px] text-muted-foreground">{translate(locale, 'workbench.knowledge.health.coverage')}</span>
          </div>
        </div>
        <div>
          {metrics.map(([label, value], index) => (
            <div className="flex items-center justify-between gap-3 border-b border-border py-2 text-xs last:border-b-0" key={label}>
              <span className="text-muted-foreground">{translate(locale, label)}</span>
              <strong className={index === metrics.length - 1 ? 'font-semibold text-amber-600 dark:text-amber-400' : 'font-semibold'}>
                {formatCount(locale, value)}
              </strong>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-[10px] leading-4 text-muted-foreground">
        {translate(locale, 'workbench.knowledge.health.note')}
      </p>
    </section>
  )
}

function knowledgeEntryMeta(locale: KnowledgeProps['locale'], entry: VaultEntry): string {
  const timestamp = entry.modifiedAt ?? entry.createdAt
  const date = timestamp
    ? new Intl.DateTimeFormat(getLocaleDateLocale(locale), { month: 'short', day: 'numeric' }).format(new Date(timestamp * 1000))
    : null
  const relationshipCount = entry.outgoingLinks.length
    + Object.values(entry.relationships).reduce((count, references) => count + references.length, 0)
  return [
    entry.isA || translate(locale, 'workbench.entry.note'),
    translate(locale, 'workbench.knowledge.stream.connections', { count: relationshipCount }),
    date,
  ].filter(Boolean).join(' · ')
}

function KnowledgeStream({ locale, model, navigation }: KnowledgeProps) {
  return (
    <section className="rounded-[1.25rem] border border-border bg-card/85 p-[1.1875rem] shadow-[0_18px_50px_color-mix(in_srgb,var(--foreground)_8%,transparent)] backdrop-blur-sm">
      <PanelHeading
        eyebrow="workbench.knowledge.stream.eyebrow"
        locale={locale}
        marker={translate(locale, 'workbench.knowledge.stream.marker', { count: model.knowledgeStreamEntries.length })}
        title="workbench.knowledge.stream.title"
      />
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{translate(locale, 'workbench.knowledge.stream.description')}</p>
      <div className="mt-3 space-y-1">
        {model.knowledgeStreamEntries.length > 0
          ? model.knowledgeStreamEntries.map((entry) => (
            <Button
              aria-label={translate(locale, 'workbench.entry.open', { title: entry.title })}
              className="h-auto w-full justify-between rounded-xl border border-transparent px-3 py-3 text-left hover:border-border hover:bg-muted/65"
              key={entry.path}
              type="button"
              variant="ghost"
              onClick={() => { void navigation.openEntry(entry) }}
            >
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium">{entry.title}</span>
                <span className="mt-1 block truncate text-[10px] font-normal text-muted-foreground">{knowledgeEntryMeta(locale, entry)}</span>
              </span>
              <ArrowUpRight className="shrink-0 text-primary" size={15} />
            </Button>
          ))
          : (
            <p className="rounded-xl border border-dashed border-border p-5 text-xs leading-5 text-muted-foreground">
              {translate(locale, 'workbench.knowledge.stream.empty')}
            </p>
          )}
      </div>
    </section>
  )
}

function PortalIcon({ kind }: Pick<WorkbenchDestinationSummary, 'kind'>) {
  if (kind === 'view') return <Eye size={15} weight="duotone" />
  if (kind === 'type') return <Shapes size={15} weight="duotone" />
  return <FolderOpen size={15} weight="duotone" />
}

function PortalGroup({
  kind,
  locale,
  navigation,
  portals,
}: Pick<KnowledgeProps, 'locale' | 'navigation'> & {
  kind: WorkbenchDestinationKind
  portals: readonly WorkbenchDestinationSummary[]
}) {
  return (
    <section className="rounded-xl border border-border bg-background/45 p-3">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {GROUP_CODES[kind]} / {translate(locale, GROUP_LABELS[kind])}
      </h3>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {portals.slice(0, 4).map((portal) => (
          <Button
            aria-label={translate(locale, 'workbench.knowledge.portals.open', {
              kind: translate(locale, KIND_LABELS[kind]),
              title: portal.label,
            })}
            className="h-auto min-w-0 justify-between rounded-lg border-transparent bg-muted/55 px-3 py-2 text-left hover:border-primary/30 hover:bg-primary/10"
            key={portal.id}
            type="button"
            variant="outline"
            onClick={() => { void navigation.openSelection(portal.selection) }}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 text-primary"><PortalIcon kind={kind} /></span>
              <span className="truncate text-xs font-medium">{portal.label}</span>
            </span>
            <span className="shrink-0 text-[10px] font-normal text-primary">{formatCount(locale, portal.count)}</span>
          </Button>
        ))}
        {portals.length === 0 && (
          <p className="col-span-full py-3 text-xs text-muted-foreground">{translate(locale, 'workbench.knowledge.portals.empty')}</p>
        )}
      </div>
    </section>
  )
}

function KnowledgePortals({ locale, model, navigation }: KnowledgeProps) {
  return (
    <section className="col-span-full rounded-[1.25rem] border border-border bg-card/85 p-5 shadow-[0_18px_50px_color-mix(in_srgb,var(--foreground)_8%,transparent)] backdrop-blur-sm">
      <PanelHeading
        eyebrow="workbench.knowledge.portals.eyebrow"
        locale={locale}
        marker={translate(locale, 'workbench.knowledge.portals.marker')}
        title="workbench.knowledge.portals.title"
      />
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{translate(locale, 'workbench.knowledge.portals.description')}</p>
      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        <PortalGroup kind="type" locale={locale} navigation={navigation} portals={model.typeSummaries} />
        <PortalGroup kind="folder" locale={locale} navigation={navigation} portals={model.folderSummaries} />
        <PortalGroup kind="view" locale={locale} navigation={navigation} portals={model.savedViewSummaries} />
      </div>
    </section>
  )
}

export function CommandCenterKnowledgeView({ locale, model, navigation }: KnowledgeProps) {
  if (model.loading) {
    return <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground" role="status">{translate(locale, 'workbench.loading')}</div>
  }
  return (
    <div className="mx-auto grid w-full max-w-[90rem] gap-[1.125rem] lg:grid-cols-[minmax(0,1.75fr)_minmax(20rem,0.8fr)]">
      <KnowledgeMap locale={locale} model={model} />
      <div className="grid content-start gap-[1.125rem]">
        <RelationshipHealth locale={locale} model={model} />
        <KnowledgeStream locale={locale} model={model} navigation={navigation} />
      </div>
      <KnowledgePortals locale={locale} model={model} navigation={navigation} />
    </div>
  )
}
