import { Link } from 'react-router-dom'
import { GAME_CASES } from '../../game/content'
import { MAP_REGIONS } from '../../game/map'
import type { CaseId, ClueTask, Submission } from '../../game/types'
import { getCaseProgress, latestByTask } from '../../game/progress'
import { listSubmissions } from '../../lib/api'
import { useAsync } from '../../lib/useAsync'
import { Assets } from '../../assets'
import { PageShell } from '../../ui/PageShell'
import { Badge, Button, Card, CardInner, MascotBubble, ProgressBar } from '../../ui/Ui'

function getCase(caseId: CaseId) {
  return GAME_CASES.find((gameCase) => gameCase.id === caseId)
}

function getRegionState(progress: ReturnType<typeof getCaseProgress>) {
  if (progress.complete) {
    return {
      key: 'complete',
      label: 'Зона спасена',
      variant: 'approved' as const,
      feeling: 'Лес уже изменился благодаря твоим уликам.',
    }
  }
  if (progress.nextSubmission?.status === 'pending') {
    return {
      key: 'pending',
      label: 'Лес ждёт штаб',
      variant: 'pending' as const,
      feeling: 'Улика улетела к старшему следователю, зона замерла в ожидании.',
    }
  }
  if (progress.nextSubmission?.status === 'rejected') {
    return {
      key: 'rejected',
      label: 'Нужна подсказка',
      variant: 'rejected' as const,
      feeling: 'Лес просит ещё одно доказательство, чтобы версия стала сильнее.',
    }
  }
  if (progress.approved > 0) {
    return {
      key: 'inProgress',
      label: 'Лес оживает',
      variant: 'magic' as const,
      feeling: 'Первые улики уже меняют это место: стало светлее и спокойнее.',
    }
  }
  return {
    key: 'notStarted',
    label: 'Тайна ждёт',
    variant: 'magic' as const,
    feeling: 'Здесь ещё тихо и загадочно. Первая улика может всё изменить.',
  }
}

function getNextAction(task: ClueTask | null, submission?: Submission) {
  if (!task) return { to: '', label: 'Дело раскрыто' }
  if (submission?.status === 'rejected') return { to: `/kid/task/${task.id}`, label: 'Исправить улику' }
  if (submission?.status === 'pending') return { to: `/kid/task/${task.id}`, label: 'Проверить улику' }
  return { to: `/kid/task/${task.id}`, label: 'Следующая улика' }
}

export function ForestMapPage() {
  const { data: submissions, loading, error } = useAsync(() => listSubmissions(), [])
  const byTask = submissions ? latestByTask(submissions) : new Map<string, Submission>()

  return (
    <PageShell tone="kid" right={<Button to="/kid">К делам</Button>}>
      <div className="grid" style={{ gap: 16 }}>
        <Card variant="hero">
          <CardInner>
            <div className="forestMapHero">
              <div className="grid" style={{ gap: 10 }}>
                <Badge variant="magic">Навигация по расследованиям</Badge>
                <h1 className="h1">Карта волшебного леса</h1>
                <p className="p">
                  Карта теперь показывает не только прогресс, но и настроение леса: каждая улика делает зону живее.
                </p>
                <div className="btnRow">
                  <Button to="/kid" variant="primary">
                    Список дел
                  </Button>
                  <Badge variant="approved">Зон: {MAP_REGIONS.length}</Badge>
                </div>
              </div>
              <img className="guideImg" src={Assets.characters.guideOwl} alt="лесной гид" />
            </div>
          </CardInner>
        </Card>

        <MascotBubble imageSrc={Assets.illustrations.chicken}>
          Смотри, как меняется лес: сначала зона хранит тайну, потом оживает, ждёт штаб и наконец становится спасённой.
        </MascotBubble>

        {error ? (
          <Card>
            <CardInner>
              <div className="grid" style={{ gap: 8 }}>
                <div className="h2">Карта открылась без прогресса</div>
                <div className="p">{error.message}</div>
                <div className="hint">Если API ещё не запущен — можно изучать лес, а прогресс появится позже.</div>
              </div>
            </CardInner>
          </Card>
        ) : null}

        <Card variant="soft">
          <CardInner>
            <div className="forestMapStage motionReveal" aria-label="Интерактивная карта волшебного леса">
              <div className="forestMapPath" aria-hidden="true" />
              {MAP_REGIONS.map((region) => {
                const gameCase = getCase(region.caseId)
                const progress = getCaseProgress(region.caseId, byTask)
                const state = getRegionState(progress)
                return (
                  <Link
                    key={region.caseId}
                    to={`/kid/case/${region.caseId}`}
                    className={`forestMapRegion forestMapRegion_${region.caseId} forestMapRegion_${state.key}${progress.complete ? ' forestMapRegionDone' : ''}`}
                    style={{ left: `${region.x}%`, top: `${region.y}%` }}
                    aria-label={`${region.label}: ${state.label}, прогресс ${progress.approved} из ${progress.total}. Открыть дело.`}
                  >
                    <img src={region.mascot} alt="" />
                    <span>{region.shortLabel}</span>
                    <b>
                      {progress.approved}/{progress.total}
                    </b>
                    <small>{state.label}</small>
                    <strong>{state.feeling}</strong>
                    {gameCase ? <em>{gameCase.tagline}</em> : null}
                  </Link>
                )
              })}
            </div>
          </CardInner>
        </Card>

        <div className="forestMapLegend">
          <Badge variant="magic">{loading ? 'Загружаем прогресс' : 'Тайна ждёт'}</Badge>
          <Badge variant="magic">Лес оживает</Badge>
          <Badge variant="pending">Лес ждёт штаб</Badge>
          <Badge variant="rejected">Нужна подсказка</Badge>
          <Badge variant="approved">Зона спасена</Badge>
        </div>

        <div className="grid grid3 forestMapMobileList motionStagger">
          {MAP_REGIONS.map((region) => {
            const progress = getCaseProgress(region.caseId, byTask)
            const state = getRegionState(progress)
            const nextAction = getNextAction(progress.nextTask, progress.nextSubmission)
            return (
              <Card key={region.caseId} variant="soft">
                <CardInner>
                  <div className={`grid lift caseTint_${region.caseId}`} style={{ gap: 12, padding: 14, borderRadius: 24 }}>
                    <img className="caseMascot" src={region.mascot} alt="" />
                    <div className="grid" style={{ gap: 4 }}>
                      <div className="h2">{region.label}</div>
                      <div className="p">{state.feeling}</div>
                    </div>
                    <div className="progressSpark">
                      <ProgressBar value={progress.approved} max={progress.total} label={loading ? 'Загрузка прогресса' : 'Прогресс зоны'} />
                    </div>
                    <div className="btnRow" style={{ justifyContent: 'space-between' }}>
                      <Badge variant={state.variant}>{state.label}</Badge>
                      <Link to={`/kid/case/${region.caseId}`} className="btn">
                        Открыть дело
                      </Link>
                      {progress.complete ? (
                        <Badge variant="approved">Место изменилось благодаря тебе</Badge>
                      ) : (
                        <Link to={nextAction.to} className="btn btnPrimary">
                          {nextAction.label}
                        </Link>
                      )}
                    </div>
                  </div>
                </CardInner>
              </Card>
            )
          })}
        </div>
      </div>
    </PageShell>
  )
}
