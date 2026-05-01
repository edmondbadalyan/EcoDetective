import { Link } from 'react-router-dom'
import { CLUE_TASKS, GAME_CASES, getTasksForCase } from '../../game/content'
import type { Submission } from '../../game/types'
import { getOwlHouseStage, getTokenBalance, latestByTask, TOKEN_GOAL, TOKEN_GOAL_TITLE } from '../../game/progress'
import { listSubmissions } from '../../lib/api'
import { useAsync } from '../../lib/useAsync'
import { Assets } from '../../assets'
import { PageShell } from '../../ui/PageShell'
import { Badge, Button, Card, CardInner, MascotBubble, ProgressBar } from '../../ui/Ui'

function statusLabel(status?: Submission['status']) {
  if (status === 'approved') return 'Собрано'
  if (status === 'pending') return 'На проверке'
  if (status === 'rejected') return 'Попробуй ещё раз'
  return 'Не найдено'
}

function statusVariant(status?: Submission['status']) {
  if (status === 'approved') return 'approved'
  if (status === 'pending') return 'pending'
  if (status === 'rejected') return 'rejected'
  return 'magic'
}

export function EvidenceAlbumPage() {
  const { data: submissions, loading, error } = useAsync(() => listSubmissions(), [])
  const byTask = submissions ? latestByTask(submissions) : new Map<string, Submission>()
  const collected = CLUE_TASKS.filter((task) => byTask.get(task.id)?.status === 'approved').length
  const tokenBalance = submissions ? getTokenBalance(submissions) : 0
  const owlStage = getOwlHouseStage(tokenBalance)

  return (
    <PageShell tone="kid" right={<Button to="/kid">К делам</Button>}>
      <div className="grid" style={{ gap: 16 }}>
        <Card variant="hero">
          <CardInner>
            <div className="forestMapHero">
              <div className="grid" style={{ gap: 10 }}>
                <Badge variant="magic">Мета-прогресс</Badge>
                <h1 className="h1">Альбом следователя</h1>
                <p className="p">Здесь собираются артефакты дел и следы того, как ребёнок меняет волшебный лес.</p>
                {loading ? <div className="loadingCritter">Сова листает альбом</div> : null}
                <div className="progressSpark">
                  <ProgressBar value={collected} max={CLUE_TASKS.length} label={loading ? 'Загрузка альбома' : 'Собрано улик'} />
                </div>
                <div className="progressSpark">
                  <ProgressBar value={Math.min(tokenBalance, TOKEN_GOAL)} max={TOKEN_GOAL} label={TOKEN_GOAL_TITLE} />
                </div>
                <Badge variant="approved">{owlStage.title}</Badge>
              </div>
              <img className="guideImg" src={Assets.rewards.token} alt="жетон награды" />
            </div>
          </CardInner>
        </Card>

        <MascotBubble imageSrc={Assets.characters.guideOwl}>
          Каждый стикер — не просто награда, а след твоей помощи: ручей светлеет, росток оживает, тролль слабеет.
        </MascotBubble>

        {error ? (
          <Card>
            <CardInner>
              <div className="grid" style={{ gap: 8 }}>
                <div className="h2">Не получилось загрузить альбом</div>
                <p className="p">{error.message}</p>
              </div>
            </CardInner>
          </Card>
        ) : null}

        <div className="grid motionStagger" style={{ gap: 16 }}>
          {GAME_CASES.map((gameCase) => {
            const tasks = getTasksForCase(gameCase.id)
            const done = tasks.filter((task) => byTask.get(task.id)?.status === 'approved').length
            return (
              <Card key={gameCase.id} variant="soft">
                <CardInner>
                  <div className="albumCase">
                    <div className="btnRow" style={{ justifyContent: 'space-between' }}>
                      <div className="grid" style={{ gap: 4 }}>
                        <div className="h2">{gameCase.title}</div>
                        <p className="p">{gameCase.tagline}</p>
                      </div>
                      <Badge variant={done === tasks.length ? 'approved' : 'magic'}>{done}/{tasks.length} стикеров</Badge>
                    </div>
                    <div className="albumGrid motionStagger">
                      {tasks.map((task) => {
                        const submission = byTask.get(task.id)
                        const approved = submission?.status === 'approved'
                        const rejected = submission?.status === 'rejected'
                        return (
                          <div key={task.id} className={`albumItem ${approved ? 'albumItemUnlocked successPop' : 'albumItemLocked'}`}>
                            <img className={`taskCardImage ${approved ? 'albumStickerReveal' : ''}`} src={task.imageSrc} alt={approved ? task.reward.sticker : 'закрытый стикер'} />
                            <div className="grid" style={{ gap: 4 }}>
                              <div className="h2">{approved ? task.reward.sticker : 'Секретный стикер'}</div>
                              <p className="p">{approved ? task.emotion?.albumBlurb ?? task.title : task.title}</p>
                            </div>
                            <Badge variant={statusVariant(submission?.status)}>{statusLabel(submission?.status)}</Badge>
                            {approved ? (
                              <div className="hint">+{task.reward.tokens} жетонов • {task.skill ?? 'Навык'} • лес изменился</div>
                            ) : (
                              <Link to={rejected ? `/kid/task/${task.id}/evidence` : `/kid/task/${task.id}`} className="btn btnPrimary">
                                {rejected ? 'Исправить улику' : 'Найти улику'}
                              </Link>
                            )}
                          </div>
                        )
                      })}
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
