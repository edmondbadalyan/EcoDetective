import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { EvidenceLink, Suspect } from '../game/types'
import type { SuspectStatus } from '../game/content'

export function Card(props: { children: ReactNode; variant?: 'default' | 'hero' | 'soft' | 'dark'; className?: string }) {
  const variantClass =
    props.variant === 'hero'
      ? ' cardHero'
      : props.variant === 'soft'
        ? ' cardSoft'
        : props.variant === 'dark'
          ? ' cardDark'
          : ''
  return <section className={'card' + variantClass + (props.className ? ` ${props.className}` : '')}>{props.children}</section>
}

export function CardInner(props: { children: ReactNode }) {
  return <div className="cardInner">{props.children}</div>
}

export function Button(props: {
  to?: string
  onClick?: () => void
  variant?: 'default' | 'primary' | 'success' | 'danger'
  children: ReactNode
  disabled?: boolean
}) {
  const className =
    'btn ' +
    (props.variant === 'primary'
      ? 'btnPrimary'
      : props.variant === 'success'
        ? 'btnSuccess'
        : props.variant === 'danger'
          ? 'btnDanger'
          : '')

  if (props.to) {
    return (
      <Link to={props.to} className={className} aria-disabled={props.disabled}>
        {props.children}
      </Link>
    )
  }

  return (
    <button className={className} onClick={props.onClick} disabled={props.disabled}>
      {props.children}
    </button>
  )
}

export function Badge(props: {
  children: ReactNode
  variant?: 'default' | 'pending' | 'approved' | 'rejected' | 'magic' | 'skill' | 'hint'
  size?: 'sm' | 'lg'
}) {
  const variantClass =
    props.variant === 'pending'
      ? 'badgePending'
      : props.variant === 'approved'
        ? 'badgeApproved'
        : props.variant === 'rejected'
          ? 'badgeRejected'
          : props.variant === 'magic'
            ? 'badgeMagic'
            : props.variant === 'skill'
              ? 'badgeSkill'
              : props.variant === 'hint'
                ? 'badgeHint'
                : ''
  const sizeClass = props.size === 'lg' ? ' badgeLg' : ''
  return <span className={`badge ${variantClass}${sizeClass}`.trim()}>{props.children}</span>
}

export function ProgressBar(props: { value: number; max: number; label?: string }) {
  const percent = props.max > 0 ? Math.round((props.value / props.max) * 100) : 0
  return (
    <div className="progressWrap" aria-label={props.label ?? `Прогресс ${props.value} из ${props.max}`}>
      <div className="progressMeta">
        <span>{props.label ?? 'Прогресс'}</span>
        <b>
          {props.value}/{props.max}
        </b>
      </div>
      <div className="progressTrack">
        <div className="progressFill" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
      </div>
    </div>
  )
}

export function MascotBubble(props: { children: ReactNode; imageSrc: string; imageAlt?: string }) {
  return (
    <div className="mascotBubble">
      <img src={props.imageSrc} alt={props.imageAlt ?? ''} />
      <div>{props.children}</div>
    </div>
  )
}

export function SuspectCard(props: { suspect: Suspect; status: SuspectStatus; pins: EvidenceLink[] }) {
  const { suspect, status, pins } = props
  const stateClass =
    status === 'cleared' ? ' suspectCleared' : status === 'suspicious' ? ' suspectSuspicious' : ''
  const statusLabel =
    status === 'cleared' ? 'Алиби подтверждено' : status === 'suspicious' ? 'Под подозрением' : 'Пока неизвестно'
  const statusVariant: 'approved' | 'rejected' | 'hint' =
    status === 'cleared' ? 'approved' : status === 'suspicious' ? 'rejected' : 'hint'

  return (
    <article className={`suspectCard${stateClass}`} aria-label={`Подозреваемый: ${suspect.name}`}>
      <header className="suspectCardHead">
        <div className="suspectPortrait">
          <img src={suspect.portraitSrc} alt="" />
        </div>
        <div>
          <p className="suspectName">{suspect.name}</p>
          <p className="suspectRole">{suspect.role}</p>
        </div>
      </header>
      <p className="suspectAlibi">
        <b>Алиби:</b> {suspect.alibi}
      </p>
      <Badge variant={statusVariant}>{statusLabel}</Badge>
      {pins.length > 0 ? (
        <div className="suspectPins" aria-label="Найденные улики">
          {pins.map((pin) => {
            const cls =
              pin.effect === 'implicates'
                ? 'suspectPinImplicates'
                : pin.effect === 'eliminates'
                  ? 'suspectPinEliminates'
                  : 'suspectPinHerring'
            return (
              <span key={`${pin.taskId}-${pin.suspectId}-${pin.effect}`} className={`suspectPin ${cls}`} title={pin.reason}>
                {pin.pinLabel}
              </span>
            )
          })}
        </div>
      ) : null}
    </article>
  )
}

export function SuspectBoard(props: {
  title?: string
  subtitle?: string
  suspects: Suspect[]
  approvedTaskIds: Set<string>
  links: EvidenceLink[]
  getStatus: (
    suspect: Suspect,
    approvedTaskIds: Set<string>,
    links: EvidenceLink[],
  ) => { status: SuspectStatus; pins: EvidenceLink[] }
}) {
  return (
    <div className="suspectBoard">
      <header className="suspectBoardHead">
        <Badge variant="magic" size="lg">
          Доска подозреваемых
        </Badge>
        {props.title ? <h2 className="suspectBoardTitle">{props.title}</h2> : null}
        {props.subtitle ? <p className="suspectBoardSub">{props.subtitle}</p> : null}
      </header>
      <div className="suspectGrid">
        {props.suspects.map((s) => {
          const { status, pins } = props.getStatus(s, props.approvedTaskIds, props.links)
          return <SuspectCard key={s.id} suspect={s} status={status} pins={pins} />
        })}
      </div>
    </div>
  )
}

