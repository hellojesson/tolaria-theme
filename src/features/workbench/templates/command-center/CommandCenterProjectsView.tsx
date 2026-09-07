import { useState } from 'react'
import { ArrowUpRight, Graph } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  getLocaleDateLocale,
  translate,
  type TranslationKey,
} from '../../../../lib/i18n'
import type { VaultEntry } from '../../../../types'
import type { WorkbenchStatusGroup } from '../../core/workbenchTypes'
import type { WorkbenchTemplateRendererProps } from '../../host/workbenchRendererTypes'

type ProjectsProps = Pick<WorkbenchTemplateRendererProps, 'locale' | 'model' | 'navigation'>

const PROJECT_LANE_LIMIT = 3
const PROJECTS_PER_LANE_LIMIT = 2
const ACTION_QUEUE_LIMIT = 4
const PROJECT_STREAM_LIMIT = 6

function formatCount(locale: ProjectsProps['locale'], value: number): string {
  return new Intl.NumberFormat(getLocaleDateLocale(locale)).format(value)
}

function entryIdentity(entry: VaultEntry): string {
  return `${entry.workspace?.id ?? 'default'}:${entry.path}`
}

function entryTimestamp(entry: VaultEntry): number | null {
  return entry.modifiedAt ?? entry.createdAt
}

function formatEntryDate(locale: ProjectsProps['locale'], entry: VaultEntry): string {
  const timestamp = entryTimestamp(entry)
  if (!timestamp) return translate(locale, 'workbench.projects.updatedUnknown')
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const sameDay = date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate()
  return new Intl.DateTimeFormat(
    getLocaleDateLocale(locale),
    sameDay ? { hour: '2-digit', minute: '2-digit' } : { month: 'short', day: 'numeric' },
  ).format(date)
}

function connectionCount(entry: VaultEntry): number {
  return entry.outgoingLinks.length
    + Object.values(entry.relationships).reduce((count, references) => count + references.length, 0)
}

function ProjectPanelHeading({
  eyebrow,
  locale,
  marker,
  title,
}: {
  eyebrow: TranslationKey
  locale: ProjectsProps['locale']
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

function ProjectCard({
  entry,
  locale,
  onSelect,
  selected,
}: {
  entry: VaultEntry
  locale: ProjectsProps['locale']
  onSelect: () => void
  selected: boolean
}) {
  return (
    <Button
      aria-label={translate(locale, 'workbench.projects.board.inspect', { title: entry.title })}
      aria-pressed={selected}
      className={`relative h-auto w-full min-w-0 flex-col items-stretch gap-0 whitespace-normal rounded-xl border px-3 py-3 text-left shadow-none transition-transform hover:-translate-y-0.5 ${
        selected
          ? 'border-primary bg-primary/10 hover:bg-primary/10'
          : 'border-transparent bg-muted/65 hover:border-primary/30 hover:bg-muted'
      }`}
      type="button"
      variant="outline"
      onClick={onSelect}
    >
      {selected && <span aria-hidden="true" className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />}
      <span className="block truncate text-xs font-semibold">{entry.title}</span>
      <span className="mt-1 block truncate text-[10px] font-normal text-muted-foreground">
        {entry.isA || translate(locale, 'workbench.entry.note')}
      </span>
      <span className="mt-2 flex w-full items-center justify-between gap-2 text-[10px] font-normal text-muted-foreground">
        <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-primary" />
          {entry.status}
        </span>
        <span className="shrink-0">{formatEntryDate(locale, entry)}</span>
      </span>
    </Button>
  )
}

function ProjectLane({
  group,
  locale,
  onSelect,
  selectedId,
}: {
  group: WorkbenchStatusGroup
  locale: ProjectsProps['locale']
  onSelect: (entry: VaultEntry) => void
  selectedId: string | null
}) {
  return (
    <section
      aria-label={translate(locale, 'workbench.projects.board.statusGroup', { status: group.status })}
      className="min-w-0 rounded-2xl border border-border bg-card/78 p-3 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border pb-2.5">
        <h3 className="truncate text-xs font-semibold">{group.status}</h3>
        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
          {formatCount(locale, group.count)}
        </span>
      </div>
      <div className="mt-2.5 grid gap-2">
        {group.entries.slice(0, PROJECTS_PER_LANE_LIMIT).map((entry) => (
          <ProjectCard
            entry={entry}
            key={entryIdentity(entry)}
            locale={locale}
            selected={entryIdentity(entry) === selectedId}
            onSelect={() => onSelect(entry)}
          />
        ))}
      </div>
    </section>
  )
}

function ProjectInspector({
  entry,
  locale,
  navigation,
}: Pick<ProjectsProps, 'locale' | 'navigation'> & { entry: VaultEntry }) {
  const connections = connectionCount(entry)
  return (
    <div
      aria-live="polite"
      className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/95 px-4 py-3 shadow-[0_12px_30px_color-mix(in_srgb,var(--foreground)_9%,transparent)] backdrop-blur-xl"
      data-testid="workbench-project-inspector"
    >
      <div className="min-w-0 flex-1 basis-48">
        <p className="truncate text-sm font-semibold">{entry.title}</p>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
          {entry.isA || translate(locale, 'workbench.entry.note')}
        </p>
      </div>
      <div className="flex min-w-0 flex-1 basis-64 items-stretch">
        <div className="min-w-0 flex-1 border-l border-border pl-3">
          <strong className="block truncate text-xs font-semibold">{entry.status}</strong>
          <span className="text-[9px] text-muted-foreground">{translate(locale, 'workbench.projects.board.originalStatus')}</span>
        </div>
        <div className="min-w-0 flex-1 border-l border-border pl-3">
          <strong className="block truncate text-xs font-semibold">{formatEntryDate(locale, entry)}</strong>
          <span className="text-[9px] text-muted-foreground">{translate(locale, 'workbench.projects.board.updated')}</span>
        </div>
        <div className="min-w-0 flex-1 border-l border-border pl-3">
          <strong className="block truncate text-xs font-semibold">
            {translate(locale, 'workbench.knowledge.stream.connections', { count: formatCount(locale, connections) })}
          </strong>
          <span className="text-[9px] text-muted-foreground">{translate(locale, 'workbench.projects.board.connections')}</span>
        </div>
      </div>
      <Button
        aria-label={translate(locale, 'workbench.entry.open', { title: entry.title })}
        className="rounded-xl"
        size="sm"
        type="button"
        variant="secondary"
        onClick={() => { void navigation.openEntry(entry) }}
      >
        {translate(locale, 'workbench.entry.open', { title: entry.title })}
        <ArrowUpRight size={14} />
      </Button>
    </div>
  )
}

function ProjectBoard({ locale, model, navigation }: ProjectsProps) {
  const groups = model.statusGroups.slice(0, PROJECT_LANE_LIMIT)
  const laneEntries = groups.flatMap((group) => group.entries.slice(0, PROJECTS_PER_LANE_LIMIT))
  const [selectedId, setSelectedId] = useState<string | null>(() => laneEntries[0] ? entryIdentity(laneEntries[0]) : null)
  const selectedEntry = laneEntries.find((entry) => entryIdentity(entry) === selectedId) ?? laneEntries[0]

  return (
    <section className="min-w-0 rounded-[1.25rem] border border-border bg-card/85 p-[1.3125rem] shadow-[0_18px_50px_color-mix(in_srgb,var(--foreground)_8%,transparent)] backdrop-blur-sm">
      <ProjectPanelHeading
        eyebrow="workbench.projects.board.eyebrow"
        locale={locale}
        marker={translate(locale, 'workbench.knowledge.localReadOnly')}
        title="workbench.projects.board.title"
      />
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{translate(locale, 'workbench.projects.board.description')}</p>

      <div
        className="relative mt-4 overflow-hidden rounded-[1.0625rem] border border-primary/25 bg-background/65 p-3.5 shadow-[inset_0_0_42px_color-mix(in_srgb,var(--primary)_4%,transparent)]"
        data-testid="workbench-project-board-grid"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--primary) 10%, transparent), transparent 35%), linear-gradient(color-mix(in srgb, var(--primary) 9%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--primary) 9%, transparent) 1px, transparent 1px)',
          backgroundSize: 'auto, 28px 28px, 28px 28px',
        }}
      >
        {groups.length > 0
          ? (
            <>
              <div
                aria-hidden="true"
                className="relative mb-3 grid gap-2 px-2 pt-1 text-center text-[9px] uppercase tracking-[0.12em] text-muted-foreground before:absolute before:left-[8%] before:right-[8%] before:top-2 before:h-px before:bg-primary/35"
                style={{ gridTemplateColumns: `repeat(${groups.length}, minmax(0, 1fr))` }}
              >
                {groups.map((group, index) => (
                  <span className="relative z-10 truncate pt-3 before:absolute before:left-1/2 before:top-0 before:size-2 before:-translate-x-1/2 before:rounded-full before:border-2 before:border-background before:bg-primary before:shadow-[0_0_10px_var(--primary)]" key={group.status}>
                    {String(index + 1).padStart(2, '0')} · {group.status}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(14rem,100%),1fr))] gap-3">
                {groups.map((group) => (
                  <ProjectLane
                    group={group}
                    key={group.status}
                    locale={locale}
                    selectedId={selectedEntry ? entryIdentity(selectedEntry) : null}
                    onSelect={(entry) => setSelectedId(entryIdentity(entry))}
                  />
                ))}
              </div>
              {selectedEntry && <ProjectInspector entry={selectedEntry} locale={locale} navigation={navigation} />}
            </>
          )
          : (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border px-5 text-center text-sm text-muted-foreground">
              <Graph className="mb-3 text-primary" size={27} weight="duotone" />
              {translate(locale, 'workbench.projects.board.empty')}
            </div>
          )}
      </div>
    </section>
  )
}

function statusRingBackground(groups: readonly WorkbenchStatusGroup[]): string {
  const total = groups.reduce((sum, group) => sum + group.count, 0)
  if (total === 0) return 'var(--muted)'
  const colors = [
    'var(--primary)',
    'color-mix(in srgb, var(--primary) 55%, var(--foreground))',
    'color-mix(in srgb, var(--primary) 35%, var(--muted-foreground))',
  ]
  let start = 0
  const segments = groups.map((group, index) => {
    const end = start + (group.count / total) * 100
    const segment = `${colors[index]} ${start}% ${end}%`
    start = end
    return segment
  })
  return `conic-gradient(${segments.join(', ')})`
}

function ExecutionPulse({ locale, model }: Pick<ProjectsProps, 'locale' | 'model'>) {
  const groups = model.statusGroups.slice(0, PROJECT_LANE_LIMIT)
  const total = groups.reduce((sum, group) => sum + group.count, 0)
  return (
    <section className="rounded-[1.25rem] border border-border bg-card/85 p-[1.1875rem] shadow-[0_18px_50px_color-mix(in_srgb,var(--foreground)_8%,transparent)] backdrop-blur-sm">
      <ProjectPanelHeading
        eyebrow="workbench.projects.pulse.eyebrow"
        locale={locale}
        marker={translate(locale, 'workbench.knowledge.realData')}
        title="workbench.projects.pulse.title"
      />
      <div className="mt-5 grid items-center gap-4 sm:grid-cols-[7.5rem_minmax(0,1fr)] xl:grid-cols-[7.5rem_minmax(0,1fr)]">
        <div
          aria-label={translate(locale, 'workbench.projects.pulse.label', { count: total, groups: groups.length })}
          className="relative mx-auto flex size-28 items-center justify-center rounded-full shadow-[0_0_28px_color-mix(in_srgb,var(--primary)_10%,transparent)]"
          role="img"
          style={{ background: statusRingBackground(groups) }}
        >
          <div className="absolute inset-3.5 rounded-full bg-card" />
          <div className="relative text-center">
            <strong className="block text-2xl font-semibold">{formatCount(locale, total)}</strong>
            <span className="text-[10px] text-muted-foreground">{translate(locale, 'workbench.projects.pulse.statusNotes')}</span>
          </div>
        </div>
        <div>
          {groups.map((group) => (
            <div className="flex items-center justify-between gap-3 border-b border-border py-2 text-xs last:border-b-0" key={group.status}>
              <span className="truncate text-muted-foreground">{group.status}</span>
              <strong className="font-semibold">{formatCount(locale, group.count)}</strong>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-[10px] leading-4 text-muted-foreground">
        {translate(locale, 'workbench.projects.pulse.note')}
      </p>
    </section>
  )
}

function entryMeta(locale: ProjectsProps['locale'], entry: VaultEntry): string {
  return [entry.status, formatEntryDate(locale, entry)].filter(Boolean).join(' · ')
}

function ActionQueue({ locale, model, navigation }: ProjectsProps) {
  const entries = model.actionableEntries.slice(0, ACTION_QUEUE_LIMIT)
  return (
    <section className="rounded-[1.25rem] border border-border bg-card/85 p-[1.1875rem] shadow-[0_18px_50px_color-mix(in_srgb,var(--foreground)_8%,transparent)] backdrop-blur-sm">
      <ProjectPanelHeading
        eyebrow="workbench.projects.queue.eyebrow"
        locale={locale}
        marker={translate(locale, 'workbench.projects.queue.marker', { count: entries.length })}
        title="workbench.projects.queue.title"
      />
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{translate(locale, 'workbench.projects.queue.description')}</p>
      <div className="mt-3 space-y-1">
        {entries.length > 0
          ? entries.map((entry) => (
            <Button
              aria-label={translate(locale, 'workbench.projects.queue.open', { title: entry.title })}
              className="h-auto w-full justify-between rounded-xl border border-transparent px-3 py-3 text-left hover:border-border hover:bg-muted/65"
              key={entryIdentity(entry)}
              type="button"
              variant="ghost"
              onClick={() => { void navigation.openEntry(entry) }}
            >
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium">{entry.title}</span>
                <span className="mt-1 block truncate text-[10px] font-normal text-muted-foreground">{entryMeta(locale, entry)}</span>
              </span>
              <ArrowUpRight className="shrink-0 text-primary" size={15} />
            </Button>
          ))
          : <p className="rounded-xl border border-dashed border-border p-5 text-xs leading-5 text-muted-foreground">{translate(locale, 'workbench.projects.queue.empty')}</p>}
      </div>
    </section>
  )
}

function ProjectSignalStream({ locale, model, navigation }: ProjectsProps) {
  const entries = model.actionableEntries.slice(0, PROJECT_STREAM_LIMIT)
  return (
    <section className="rounded-[1.25rem] border border-border bg-card/85 p-5 shadow-[0_18px_50px_color-mix(in_srgb,var(--foreground)_8%,transparent)] backdrop-blur-sm xl:col-span-2">
      <ProjectPanelHeading
        eyebrow="workbench.projects.stream.eyebrow"
        locale={locale}
        marker={translate(locale, 'workbench.projects.stream.marker', { count: entries.length })}
        title="workbench.projects.stream.title"
      />
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{translate(locale, 'workbench.projects.stream.description')}</p>
      {entries.length > 0
        ? (
          <div className="relative mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(10rem,100%),1fr))] gap-2 before:absolute before:left-[3%] before:right-[3%] before:top-2 before:h-px before:bg-primary/30">
            {entries.map((entry) => (
              <Button
                aria-label={translate(locale, 'workbench.projects.stream.open', { title: entry.title })}
                className="relative h-auto min-w-0 flex-col items-stretch gap-0 rounded-xl border border-transparent bg-transparent px-3 pb-3 pt-7 text-left shadow-none before:absolute before:left-3 before:top-1 before:size-2.5 before:rounded-full before:border-2 before:border-card before:bg-primary before:shadow-[0_0_10px_var(--primary)] hover:border-border hover:bg-muted/60"
                data-testid="workbench-project-timeline-entry"
                key={entryIdentity(entry)}
                type="button"
                variant="outline"
                onClick={() => { void navigation.openEntry(entry) }}
              >
                <span className="block text-[10px] font-medium text-primary">{formatEntryDate(locale, entry)}</span>
                <strong className="mt-1 block truncate text-xs font-semibold">{entry.title}</strong>
                <span className="mt-1 flex w-full items-center justify-between gap-2 text-[9px] font-normal text-muted-foreground">
                  <span className="truncate">{entry.status}</span>
                  <span className="shrink-0">{translate(locale, 'workbench.knowledge.stream.connections', { count: connectionCount(entry) })}</span>
                </span>
              </Button>
            ))}
          </div>
        )
        : <p className="mt-4 rounded-xl border border-dashed border-border p-5 text-xs leading-5 text-muted-foreground">{translate(locale, 'workbench.projects.stream.empty')}</p>}
    </section>
  )
}

export function CommandCenterProjectsView({ locale, model, navigation }: ProjectsProps) {
  if (model.loading) {
    return <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground" role="status">{translate(locale, 'workbench.loading')}</div>
  }
  return (
    <div className="mx-auto grid w-full max-w-[90rem] gap-[1.125rem] xl:grid-cols-[minmax(0,2.15fr)_minmax(19rem,0.95fr)]">
      <ProjectBoard locale={locale} model={model} navigation={navigation} />
      <div className="grid content-start gap-[1.125rem] lg:grid-cols-2 xl:grid-cols-1">
        <ExecutionPulse locale={locale} model={model} />
        <ActionQueue locale={locale} model={model} navigation={navigation} />
      </div>
      <ProjectSignalStream locale={locale} model={model} navigation={navigation} />
    </div>
  )
}
