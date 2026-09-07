import { useState } from 'react'
import {
  ArrowClockwise,
  ArrowRight,
  ArrowUpRight,
  CloudSun,
  Compass,
  Eye,
  FolderOpen,
  Graph,
  Quotes,
  Shapes,
  X,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  getLocaleDateLocale,
  translate,
  type TranslationKey,
} from '../../../../lib/i18n'
import type { VaultEntry } from '../../../../types'
import type { WorkbenchDestinationSummary } from '../../core/workbenchTypes'
import type { WorkbenchTemplateRendererProps } from '../../host/workbenchRendererTypes'
import { CommandCenterKnowledgeView } from './CommandCenterKnowledgeView'
import { CommandCenterProjectsView } from './CommandCenterProjectsView'

type TemplateProps = WorkbenchTemplateRendererProps

const QUOTE_KEYS = [
  'workbench.daily.quote.one',
  'workbench.daily.quote.two',
] as const satisfies readonly TranslationKey[]

const VIEW_DESCRIPTION_KEYS: Record<string, TranslationKey> = {
  focus: 'workbench.views.focusDescription',
  knowledge: 'workbench.views.knowledgeDescription',
  projects: 'workbench.views.projectsDescription',
}

function greetingKey(hour: number): TranslationKey {
  if (hour < 6) return 'workbench.greeting.night'
  if (hour < 12) return 'workbench.greeting.morning'
  if (hour < 18) return 'workbench.greeting.afternoon'
  return 'workbench.greeting.evening'
}

function formatWorkbenchDate(locale: TemplateProps['locale'], date: Date): string {
  return new Intl.DateTimeFormat(getLocaleDateLocale(locale), {
    dateStyle: 'full',
  }).format(date)
}

function DailyContext({ locale }: Pick<TemplateProps, 'locale'>) {
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * QUOTE_KEYS.length))
  const refreshQuote = () => setQuoteIndex((current) => (current + 1) % QUOTE_KEYS.length)

  return (
    <aside
      aria-label={translate(locale, 'workbench.daily.context')}
      className="grid min-w-0 overflow-hidden rounded-2xl border border-border bg-card/85 shadow-[0_10px_28px_color-mix(in_srgb,var(--foreground)_7%,transparent)] sm:grid-cols-2 lg:grid-cols-[minmax(9.75rem,0.82fr)_minmax(9.75rem,0.82fr)_minmax(16.25rem,1.5fr)]"
      data-layout="horizontal-context-rail"
    >
      <div className="flex min-w-0 items-center gap-2.5 px-3.5 py-2.5" data-testid="workbench-context-item">
        <CloudSun className="shrink-0 text-primary" size={16} weight="duotone" />
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-muted-foreground">{translate(locale, 'workbench.daily.weather')}</p>
          <p className="mt-0.5 truncate text-xs font-medium text-foreground">{translate(locale, 'workbench.daily.weatherUnavailable')}</p>
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-2.5 border-t border-border/55 px-3.5 py-2.5 sm:border-l sm:border-t-0" data-testid="workbench-context-item">
        <Compass className="shrink-0 text-primary" size={16} weight="duotone" />
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-muted-foreground">{translate(locale, 'workbench.daily.almanac')}</p>
          <p className="mt-0.5 truncate text-xs font-medium text-foreground">{translate(locale, 'workbench.daily.almanacUnavailable')}</p>
        </div>
      </div>
      <div
        className="flex min-w-0 items-center gap-2.5 border-t border-border/55 bg-primary/5 px-3.5 py-2.5 sm:col-span-2 lg:col-span-1 lg:border-l lg:border-t-0"
        data-testid="workbench-context-item"
      >
        <Quotes className="shrink-0 text-primary" size={17} weight="duotone" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-muted-foreground">{translate(locale, 'workbench.daily.quote')}</p>
          <p className="mt-0.5 truncate text-xs font-medium" data-testid="workbench-quote">
            {translate(locale, QUOTE_KEYS[quoteIndex])}
          </p>
        </div>
        <Button
          aria-label={translate(locale, 'workbench.daily.refreshQuote')}
          className="shrink-0 rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:text-primary"
          size="icon-xs"
          type="button"
          variant="ghost"
          onClick={refreshQuote}
        >
          <ArrowClockwise size={14} />
        </Button>
      </div>
    </aside>
  )
}

function CommandCenterHeader({ locale, navigation, onSelectView, snapshot }: TemplateProps) {
  const now = new Date()
  const isKnowledge = snapshot.activeView.id === 'knowledge'
  const isProjects = snapshot.activeView.id === 'projects'
  const signalKey = isKnowledge
    ? 'workbench.knowledge.signal'
    : isProjects
      ? 'workbench.projects.signal'
      : null
  const sourceKey = isProjects
    ? 'workbench.projects.sources'
    : 'workbench.commandCenter.sources'
  return (
    <header
      className="relative z-10 shrink-0 border-b border-border bg-background"
      data-density="compact"
      data-grid="none"
      data-testid="workbench-command-center-header"
    >
      <div className="mx-auto w-full max-w-[94rem] px-5 pb-0 pt-5 md:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
            {translate(locale, 'workbench.commandCenter.brand')}
          </p>
          <Button
            aria-label={translate(locale, 'workbench.close')}
            className="rounded-xl border border-border bg-card/70"
            size="icon-sm"
            type="button"
            variant="ghost"
            onClick={navigation.close}
          >
            <X size={16} />
          </Button>
        </div>

        <div className="mt-1 grid items-center gap-3 py-2.5 lg:grid-cols-[minmax(17.5rem,0.72fr)_minmax(38rem,1.28fr)] lg:gap-8">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl" id="workbench-command-center-title">
              {translate(locale, greetingKey(now.getHours()))}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {translate(locale, isProjects ? 'workbench.projects.situation' : 'workbench.greeting.situation', {
                date: formatWorkbenchDate(locale, now),
              })}
            </p>
          </div>
          <DailyContext locale={locale} />
        </div>

        <nav
          aria-label={translate(locale, 'workbench.commandCenter.views')}
          className="mt-1 grid gap-1 rounded-2xl border border-primary/15 bg-card/95 p-1 shadow-[0_9px_24px_color-mix(in_srgb,var(--foreground)_9%,transparent)] md:grid-cols-3"
          data-density="compact"
          role="tablist"
        >
          {snapshot.template.views.map((view, index) => {
            const isActive = view.id === snapshot.activeView.id
            const viewNumber = String(index + 1).padStart(2, '0')
            const viewLabel = translate(locale, view.labelKey as TranslationKey)
            const viewDescription = translate(locale, VIEW_DESCRIPTION_KEYS[view.id] ?? 'workbench.view.pending')
            return (
              <Button
                aria-label={`${viewNumber} ${viewLabel} ${viewDescription}`}
                aria-controls={`workbench-panel-${view.id}`}
                aria-selected={isActive}
                className={`h-auto min-h-11 min-w-0 flex-col items-start justify-center gap-0.5 whitespace-normal rounded-xl border px-3 py-2.5 text-left lg:flex-row lg:items-center lg:gap-3 ${
                  isActive
                    ? 'border-primary/15 bg-primary/[0.13] text-foreground shadow-[inset_0_-2px_0_var(--primary),0_3px_12px_color-mix(in_srgb,var(--primary)_12%,transparent)] hover:bg-primary/[0.15]'
                    : 'border-border/25 bg-muted/20 text-foreground/85 hover:border-primary/25 hover:bg-primary/[0.08] hover:text-foreground'
                }`}
                id={`workbench-tab-${view.id}`}
                key={view.id}
                role="tab"
                type="button"
                variant="ghost"
                onClick={() => onSelectView(view.id)}
              >
                <span className="shrink-0 text-[11px] font-semibold tracking-[0.08em] text-primary">
                  {viewNumber}
                </span>
                <span className="shrink-0 text-sm font-semibold text-current">
                  {viewLabel}
                </span>
                <span className="min-w-0 truncate text-xs font-normal text-muted-foreground">
                  {viewDescription}
                </span>
              </Button>
            )
          })}
        </nav>

        <div className="mt-1 flex min-h-8 flex-wrap items-center justify-between gap-x-5 gap-y-1 py-1.5 text-[11px] text-muted-foreground">
          {signalKey
            ? <strong className="font-semibold uppercase tracking-[0.12em] text-primary">{translate(locale, signalKey)}</strong>
            : <span>{translate(locale, 'workbench.commandCenter.mode')}</span>}
          <span>
            {translate(locale, sourceKey)}
            {isKnowledge && ` · ${translate(locale, 'workbench.knowledge.health.linked')}`}
          </span>
        </div>
      </div>
    </header>
  )
}

function entryDate(locale: TemplateProps['locale'], entry: VaultEntry): string | null {
  const timestamp = entry.modifiedAt ?? entry.createdAt
  if (!timestamp) return null
  return new Intl.DateTimeFormat(getLocaleDateLocale(locale), {
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp * 1000))
}

function EntryRow({ entry, locale, onOpen }: { entry: VaultEntry; locale: TemplateProps['locale']; onOpen: () => void }) {
  const meta = [
    entryDate(locale, entry),
    entry.status || entry.isA || translate(locale, 'workbench.entry.note'),
  ].filter(Boolean).join(' · ')
  return (
    <Button
      aria-label={translate(locale, 'workbench.entry.open', { title: entry.title })}
      className="h-auto w-full justify-between rounded-xl border border-transparent px-3 py-3 text-left hover:border-border hover:bg-muted/65"
      type="button"
      variant="ghost"
      onClick={onOpen}
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{entry.title}</span>
        <span className="mt-1 block truncate text-xs font-normal text-muted-foreground">{meta}</span>
      </span>
      <ArrowUpRight className="text-muted-foreground" size={15} />
    </Button>
  )
}

function entryRelationshipCount(entry: VaultEntry): number {
  return entry.outgoingLinks.length
    + Object.values(entry.relationships).reduce((count, references) => count + references.length, 0)
}

function entryTime(locale: TemplateProps['locale'], entry: VaultEntry | undefined): string {
  const timestamp = entry?.modifiedAt ?? entry?.createdAt
  if (!timestamp) return '—'
  return new Intl.DateTimeFormat(getLocaleDateLocale(locale), {
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
  }).format(new Date(timestamp * 1000))
}

function DailyBrief({ locale, model, navigation }: Pick<TemplateProps, 'locale' | 'model' | 'navigation'>) {
  const leadEntry = model.actionableEntries[0] ?? model.recentEntries[0]
  const leadStatus = leadEntry?.status || leadEntry?.isA || translate(locale, 'workbench.brief.ready')
  const relationCount = leadEntry ? entryRelationshipCount(leadEntry) : 0
  const topAccent = {
    background: 'linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary) 20%, transparent), transparent 76%)',
  }
  return (
    <article
      className="relative grid min-h-[368px] grid-rows-[auto_auto_auto] overflow-hidden rounded-[19px] border border-border bg-card/90 px-[22px] py-[18px] shadow-[0_15px_36px_color-mix(in_srgb,var(--foreground)_10%,transparent)] backdrop-blur-sm lg:h-[368px] lg:grid-rows-[auto_minmax(0,1fr)_50px]"
      data-testid="workbench-daily-brief"
      data-visual-baseline="focus-v7-compact"
    >
      <span aria-hidden="true" className="absolute left-[22px] right-[22px] top-0 h-0.5" style={topAccent} />
      <header className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          {translate(locale, 'workbench.brief.eyebrow')}
        </p>
        <p className="flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
          <span className="size-1.5 animate-pulse rounded-full bg-primary shadow-[0_0_10px_var(--primary)] motion-reduce:animate-none" />
          {translate(locale, 'workbench.brief.liveStatus')}
        </p>
      </header>

      <div className="grid min-h-0 items-center gap-[28px] py-3 lg:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)]">
        <section className="flex min-w-0 flex-col justify-center">
          <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
            {translate(locale, 'workbench.brief.priority')}
          </p>
          <h2 className="mt-2 truncate text-xl font-semibold tracking-tight md:text-2xl">
            {leadEntry?.title ?? translate(locale, 'workbench.brief.emptyTitle')}
          </h2>
          <p className="mt-2 max-w-[52ch] text-sm leading-5 text-muted-foreground">
            {leadEntry
              ? translate(locale, 'workbench.brief.decisionDescription', {
                recent: model.recentEntries.length,
                status: leadStatus,
                relations: relationCount,
              })
              : translate(locale, 'workbench.brief.description', {
                recent: model.recentEntries.length,
                actionable: model.actionableEntries.length,
              })}
          </p>

          <div className="mt-3 grid grid-cols-3 border-y border-border/70 py-1.5" aria-label={translate(locale, 'workbench.brief.evidence')}>
            <div className="grid gap-0.5 pr-3">
              <strong className="truncate text-sm font-semibold">{leadStatus}</strong>
              <span className="truncate text-xs text-muted-foreground">{translate(locale, 'workbench.projects.board.originalStatus')}</span>
            </div>
            <div className="grid gap-0.5 border-l border-border/70 px-3">
              <strong className="text-sm font-semibold">{relationCount}</strong>
              <span className="truncate text-xs text-muted-foreground">{translate(locale, 'workbench.knowledge.health.linked')}</span>
            </div>
            <div className="grid gap-0.5 border-l border-border/70 pl-3">
              <strong className="text-sm font-semibold">{entryTime(locale, leadEntry)}</strong>
              <span className="truncate text-xs text-muted-foreground">{translate(locale, 'workbench.projects.board.updated')}</span>
            </div>
          </div>

          {leadEntry && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button className="rounded-xl" type="button" onClick={() => { void navigation.openEntry(leadEntry) }}>
                {translate(locale, 'workbench.brief.openLead')}
                <ArrowRight size={15} />
              </Button>
              <Button
                className="rounded-xl border-border bg-transparent hover:border-primary/40 hover:bg-primary/5"
                type="button"
                variant="outline"
                onClick={() => { void navigation.openSelection({ kind: 'entity', entry: leadEntry }) }}
              >
                {translate(locale, 'workbench.brief.openRelations')}
              </Button>
            </div>
          )}
        </section>

        <aside className="grid h-[224px] grid-rows-[156px_minmax(0,1fr)] border-t border-border/80 pt-3 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0" aria-label={translate(locale, 'workbench.brief.evidence')}>
          <div className="relative mx-auto h-[156px] w-[230px]" role="img" aria-label={translate(locale, 'workbench.brief.signal')}>
            <span className="absolute left-1/2 top-1/2 size-[148px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/25" />
            <span className="absolute left-1/2 top-1/2 h-24 w-[220px] rounded-full border border-primary/25" style={{ transform: 'translate(-50%, -50%) rotate(29deg)' }} />
            <span className="absolute left-1/2 top-1/2 h-[88px] w-[206px] rounded-full border border-primary/25" style={{ transform: 'translate(-50%, -50%) rotate(-24deg)' }} />
            <span className="absolute left-1/2 top-1/2 size-[148px] -translate-x-1/2 -translate-y-1/2">
              <span className="block size-full animate-[spin_8s_linear_infinite] motion-reduce:animate-none">
                <span className="absolute right-2.5 top-3 size-[15px] rounded-full border-[3px] border-card bg-primary shadow-[0_0_0_4px_color-mix(in_srgb,var(--primary)_12%,transparent),0_0_15px_color-mix(in_srgb,var(--primary)_42%,transparent)]" />
              </span>
            </span>
            <span className="absolute left-1/2 top-1/2 z-[1] flex size-[92px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-primary/25 bg-card/90 text-center shadow-[0_0_26px_color-mix(in_srgb,var(--primary)_10%,transparent)]">
              <strong className="text-sm font-semibold text-primary">{leadStatus}</strong>
              <small className="text-xs text-muted-foreground">{translate(locale, 'workbench.brief.signal')}</small>
            </span>
          </div>

          <div className="self-end">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">{translate(locale, 'workbench.brief.evidence')}</p>
            {[
              ['workbench.brief.candidates', model.actionableEntries.length],
              ['workbench.brief.density', relationCount],
              ['workbench.brief.source', translate(locale, 'workbench.brief.localNotes')],
            ].map(([label, value]) => (
              <div className="flex items-center justify-between border-b border-border/75 py-0.5 text-xs last:border-b-0" key={label}>
                <span className="text-muted-foreground">{translate(locale, label as TranslationKey)}</span>
                <strong className="font-semibold">{value}</strong>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <footer className="grid min-h-[50px] grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2 rounded-[10px] border border-primary/20 bg-primary/[0.07] px-2.5 py-2">
        <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-lg border border-primary/35 bg-primary/10 text-primary">✦</span>
        <p className="min-w-0 truncate text-xs text-muted-foreground">
          <strong className="mr-2 font-semibold text-foreground">{translate(locale, 'workbench.brief.why')}</strong>
          {translate(locale, 'workbench.brief.reason')}
        </p>
        <small className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">{translate(locale, 'workbench.knowledge.localReadOnly')}</small>
      </footer>
    </article>
  )
}

function DailyPulse({ locale, model }: Pick<TemplateProps, 'locale' | 'model'>) {
  const pulseRows = [
    { label: 'workbench.stats.notes', value: model.summary.noteCount },
    { label: 'workbench.pulse.actionable', value: model.actionableEntries.length },
    { label: 'workbench.stats.favorites', value: model.favoriteEntries.length },
  ] as const
  const topAccent = {
    background: 'linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary) 20%, transparent), transparent 76%)',
  }
  const radarSweep = {
    background: 'conic-gradient(from 0deg, transparent 0 72%, color-mix(in srgb, var(--primary) 15%, transparent) 92%, transparent 100%)',
  }
  return (
    <article
      className="relative grid min-h-[368px] grid-rows-[auto_minmax(0,1fr)_50px] overflow-hidden rounded-[19px] border border-border bg-card/90 px-[22px] py-[18px] shadow-[0_15px_36px_color-mix(in_srgb,var(--foreground)_10%,transparent)] backdrop-blur-sm lg:h-[368px]"
      data-testid="workbench-daily-pulse"
      data-visual-baseline="focus-v7-compact"
    >
      <span aria-hidden="true" className="absolute left-[22px] right-[22px] top-0 h-0.5" style={topAccent} />
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{translate(locale, 'workbench.pulse.title')}</h2>
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
          <span className="size-1.5 animate-pulse rounded-full bg-primary shadow-[0_0_10px_var(--primary)] motion-reduce:animate-none" />
          {translate(locale, 'workbench.pulse.liveSignal')}
        </span>
      </header>

      <div className="grid min-h-0 grid-cols-[132px_minmax(0,1fr)] items-center gap-[15px] py-3">
        <div className="relative mx-auto aspect-square w-full max-w-[132px]" role="img" aria-label={`${model.recentEntries.length} ${translate(locale, 'workbench.pulse.recent')}`}>
          <span className="absolute inset-2.5 animate-[spin_9s_linear_infinite] rounded-full motion-reduce:animate-none" style={radarSweep} />
          <svg aria-hidden="true" className="block size-full overflow-visible" viewBox="0 0 144 144">
            <circle className="fill-none stroke-primary/25 [stroke-dasharray:2_5] [stroke-width:1]" cx="72" cy="72" r="66" />
            <circle className="fill-none stroke-primary/15 [stroke-width:1]" cx="72" cy="72" r="52" />
            <path className="fill-none stroke-primary/15 [stroke-width:1]" d="M72 6V138M6 72H138" />
            <circle className="fill-none stroke-border/70 [stroke-width:9]" cx="72" cy="72" r="43" />
            <circle className="fill-none stroke-primary [stroke-dasharray:61_39] [stroke-linecap:round] [stroke-width:9]" cx="72" cy="72" pathLength="100" r="43" transform="rotate(-90 72 72)" />
            <circle className="fill-primary stroke-card [stroke-width:3]" cx="72" cy="29" r="5" />
          </svg>
          <p className="absolute inset-0 grid place-content-center text-center">
            <strong className="text-sm font-semibold text-primary">{model.recentEntries.length}</strong>
            <small className="text-[11px] text-muted-foreground">{translate(locale, 'workbench.pulse.recent')}</small>
          </p>
        </div>

        <div>
          {pulseRows.map((row) => (
            <div className="flex items-center justify-between gap-2 border-b border-border/75 py-2.5 text-xs last:border-b-0" key={row.label}>
              <span className="flex items-center gap-2 text-muted-foreground">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-primary shadow-[0_0_9px_color-mix(in_srgb,var(--primary)_35%,transparent)]" />
                {translate(locale, row.label)}
              </span>
              <strong className="font-semibold">{row.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <footer className="flex min-h-[50px] items-center justify-between gap-2 rounded-[10px] border border-primary/20 bg-primary/[0.07] px-2.5 py-2 text-[11px] text-muted-foreground">
        <span>{translate(locale, 'workbench.pulse.snapshot')}</span>
        <strong className="shrink-0 font-semibold tracking-[0.06em] text-primary">
          {translate(locale, 'workbench.pulse.signals', { count: model.recentEntries.length })}
        </strong>
      </footer>
    </article>
  )
}

function RecentNotes({ locale, model, navigation }: Pick<TemplateProps, 'locale' | 'model' | 'navigation'>) {
  return (
    <article className="rounded-2xl border border-border bg-card/85 p-5 shadow-sm backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">{translate(locale, 'workbench.recent.title')}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{translate(locale, 'workbench.recent.description')}</p>
        </div>
        <span className="text-[11px] font-semibold tracking-[0.16em] text-primary">
          {String(model.recentEntries.length).padStart(2, '0')}
        </span>
      </div>
      <div className="mt-4 space-y-1">
        {model.recentEntries.length > 0
          ? model.recentEntries.map((entry) => (
            <EntryRow key={entry.path} entry={entry} locale={locale} onOpen={() => { void navigation.openEntry(entry) }} />
          ))
          : <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">{translate(locale, 'workbench.recent.empty')}</p>}
      </div>
    </article>
  )
}

function PortalIcon({ kind }: Pick<WorkbenchDestinationSummary, 'kind'>) {
  if (kind === 'view') return <Eye size={16} weight="duotone" />
  if (kind === 'type') return <Shapes size={16} weight="duotone" />
  return <FolderOpen size={16} weight="duotone" />
}

function QuickPortals({ locale, model, navigation }: Pick<TemplateProps, 'locale' | 'model' | 'navigation'>) {
  const portals = [
    ...model.savedViewSummaries,
    ...model.typeSummaries,
    ...model.folderSummaries,
  ].slice(0, 6)
  return (
    <article className="rounded-2xl border border-border bg-card/85 p-5 shadow-sm backdrop-blur-sm">
      <h2 className="text-sm font-semibold">{translate(locale, 'workbench.portals.title')}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{translate(locale, 'workbench.portals.description')}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {portals.length > 0
          ? portals.map((portal) => (
            <Button
              className="h-auto min-w-0 justify-start rounded-xl border border-border bg-background/55 px-3 py-3 text-left shadow-none hover:border-primary/35 hover:bg-primary/5"
              key={portal.id}
              type="button"
              variant="outline"
              onClick={() => { void navigation.openSelection(portal.selection) }}
            >
              <span className="text-primary"><PortalIcon kind={portal.kind} /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">{portal.label}</span>
                <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                  {translate(locale, 'workbench.portals.items', { count: portal.count })}
                </span>
              </span>
            </Button>
          ))
          : <p className="col-span-full rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">{translate(locale, 'workbench.portals.empty')}</p>}
      </div>
    </article>
  )
}

function FocusView({ locale, model, navigation }: Pick<TemplateProps, 'locale' | 'model' | 'navigation'>) {
  if (model.loading) {
    return <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground" role="status">{translate(locale, 'workbench.loading')}</div>
  }
  return (
    <div className="mx-auto grid w-full max-w-[90rem] gap-5">
      <div className="grid gap-[20px] lg:grid-cols-[minmax(0,1.65fr)_minmax(17rem,0.7fr)]">
        <DailyBrief locale={locale} model={model} navigation={navigation} />
        <DailyPulse locale={locale} model={model} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.85fr)]">
        <RecentNotes locale={locale} model={model} navigation={navigation} />
        <QuickPortals locale={locale} model={model} navigation={navigation} />
      </div>
    </div>
  )
}

function PendingView({ locale, snapshot }: Pick<TemplateProps, 'locale' | 'snapshot'>) {
  return (
    <div className="mx-auto flex min-h-80 w-full max-w-3xl items-center justify-center">
      <div className="rounded-2xl border border-border bg-card/85 p-8 text-center shadow-sm">
        <Graph className="mx-auto text-primary" size={28} weight="duotone" />
        <h2 className="mt-4 text-xl font-semibold">{translate(locale, snapshot.activeView.labelKey as TranslationKey)}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{translate(locale, 'workbench.view.pending')}</p>
      </div>
    </div>
  )
}

export function CommandCenterTemplate(props: TemplateProps) {
  const isFocus = props.snapshot.activeView.id === 'focus'
  const isKnowledge = props.snapshot.activeView.id === 'knowledge'
  const isProjects = props.snapshot.activeView.id === 'projects'
  return (
    <section
      aria-label={translate(props.locale, props.snapshot.template.labelKey as TranslationKey)}
      className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-background text-foreground"
      data-testid="workbench-command-center"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-75"
        style={{
          backgroundImage: 'radial-gradient(circle at 8% 0%, color-mix(in srgb, var(--primary) 14%, transparent), transparent 34%), radial-gradient(circle at 100% 92%, color-mix(in srgb, var(--accent) 35%, transparent), transparent 38%), linear-gradient(color-mix(in srgb, var(--border) 30%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--border) 30%, transparent) 1px, transparent 1px)',
          backgroundSize: 'auto, auto, 40px 40px, 40px 40px',
        }}
      />
      <CommandCenterHeader {...props} />
      <main className="relative z-0 flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div
          aria-labelledby={`workbench-tab-${props.snapshot.activeView.id}`}
          id={`workbench-panel-${props.snapshot.activeView.id}`}
          role="tabpanel"
        >
          {isFocus
            ? <FocusView locale={props.locale} model={props.model} navigation={props.navigation} />
            : isKnowledge
              ? <CommandCenterKnowledgeView locale={props.locale} model={props.model} navigation={props.navigation} />
              : isProjects
                ? <CommandCenterProjectsView locale={props.locale} model={props.model} navigation={props.navigation} />
                : <PendingView locale={props.locale} snapshot={props.snapshot} />}
        </div>
      </main>
    </section>
  )
}
