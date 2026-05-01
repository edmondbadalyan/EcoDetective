import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CLUE_TASKS, GAME_CASES, getTasksForCase } from '../../game/content'
import type { Submission } from '../../game/types'
import { getOwlHouseStage, getTokenBalance, latestByTask, TOKEN_GOAL, TOKEN_GOAL_TITLE } from '../../game/progress'
import { listSubmissions } from '../../lib/api'
import { getAgeMode, getAgeModeLabel, setAgeMode, type AgeMode } from '../../lib/ageMode'
import { useAsync } from '../../lib/useAsync'
import { Assets } from '../../assets'
import { PageShell } from '../../ui/PageShell'
import { Badge, Button, Card, CardInner, MascotBubble, ProgressBar } from '../../ui/Ui'

const ONBOARDING_KEY = 'eco_family_onboarding_seen'
const ONBOARDING_EXIT_MS = 240

function countApproved(tasksIds: string[], submissions: Submission[]) {
  const approved = new Set(Array.from(latestByTask(submissions).values()).filter((s) => s.status === 'approved').map((s) => s.taskId))
  return tasksIds.filter((id) => approved.has(id)).length
}

function mascotForCase(caseId: string) {
  if (caseId === 'case2') return Assets.illustrations.slime
  if (caseId === 'case3') return Assets.illustrations.boss
  return Assets.illustrations.chicken
}

export function KidHomePage() {
  const { data: submissions, loading, error } = useAsync(() => listSubmissions(), [])
  const [ageMode, setAgeModeState] = useState<AgeMode>(() => getAgeMode())
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem(ONBOARDING_KEY) !== '1')
  const [isOnboardingClosing, setIsOnboardingClosing] = useState(false)
  const totalMinutes = CLUE_TASKS.reduce((sum, t) => sum + t.expectedMinutes, 0)
  const tokenBalance = submissions ? getTokenBalance(submissions) : 0
  const owlStage = getOwlHouseStage(tokenBalance)

  function chooseAgeMode(nextMode: AgeMode) {
    setAgeMode(nextMode)
    setAgeModeState(nextMode)
  }

  function closeOnboarding() {
    if (isOnboardingClosing) return
    localStorage.setItem(ONBOARDING_KEY, '1')
    setIsOnboardingClosing(true)
    window.setTimeout(() => {
      setShowOnboarding(false)
      setIsOnboardingClosing(false)
    }, ONBOARDING_EXIT_MS)
  }

  return (
    <PageShell
      tone="kid"
      right={
        <Button to="/parent" variant="primary">
          Я родитель
        </Button>
      }
    >
      <div className="grid" style={{ gap: 16 }}>
        <Card variant="hero">
          <CardInner>
            <div className="heroCard">
              <div className="heroBg">
                <img src={Assets.cases.case1Hero} alt="" />
              </div>
              <div className="heroContent">
                <div className="grid" style={{ gap: 10 }}>
                  <h1 className="h1">ЭкоСледователь</h1>
                  <p className="p">
                    Волшебный лес просит помощи. Собирай улики дома, отправляй доказательства и получай награды.
                  </p>
                  <div className="btnRow">
                    <Button to="/kid/map" variant="primary">
                      Карта леса
                    </Button>
                    <Button to="/kid/album">
                      Альбом улик
                    </Button>
                    <Badge variant="magic">Полный цикл: ~{totalMinutes} минут</Badge>
                    <Badge variant="approved">Улик всего: {CLUE_TASKS.length}</Badge>
                    <Badge variant="pending">Возраст: {getAgeModeLabel(ageMode)}</Badge>
                  </div>
                </div>
                <img className="guideImg" src={Assets.characters.guideOwl} alt="лесной гид" />
              </div>
            </div>
          </CardInner>
        </Card>

        <MascotBubble imageSrc={Assets.illustrations.chicken}>
          Выбирай дело списком или открывай карту леса: она подскажет, куда идти дальше и где ждёт новая улика.
        </MascotBubble>

        {showOnboarding ? (
          <Card variant="soft" className={isOnboardingClosing ? 'onboardingCardClosing' : undefined}>
            <CardInner>
              <div className="onboardingPanel">
                <div className="grid" style={{ gap: 6 }}>
                  <Badge variant="magic">Как играем вдвоём</Badge>
                  <div className="h2">Семейное расследование за 4 шага</div>
                </div>
                <div className="stepGrid motionStagger">
                  <div className="miniStep"><b>1</b><span>Ребёнок выбирает улику</span></div>
                  <div className="miniStep"><b>2</b><span>Делает задание дома</span></div>
                  <div className="miniStep"><b>3</b><span>Взрослый проверяет</span></div>
                  <div className="miniStep"><b>4</b><span>Награда попадает в альбом</span></div>
                </div>
                <div className="btnRow">
                  <Button variant="primary" onClick={closeOnboarding}>
                    Понятно, начать игру
                  </Button>
                </div>
              </div>
            </CardInner>
          </Card>
        ) : null}

        <Card variant="soft">
          <CardInner>
            <div className="goalPanel">
              <div className="grid" style={{ gap: 6 }}>
                <Badge variant="approved">Баланс: {loading ? '…' : tokenBalance} жетонов</Badge>
                <div className="h2">{TOKEN_GOAL_TITLE}</div>
                <p className="p">{owlStage.title}: {owlStage.description}</p>
              </div>
              <div className="progressSpark">
                <ProgressBar value={Math.min(tokenBalance, TOKEN_GOAL)} max={TOKEN_GOAL} label="Большая цель" />
              </div>
            </div>
          </CardInner>
        </Card>

        <Card variant="soft">
          <CardInner>
            <div className="ageModePanel">
              <div className="grid" style={{ gap: 4 }}>
                <div className="h2">Режим возраста</div>
                <p className="p">Для младших больше подсказок, для старших больше самостоятельных выводов.</p>
              </div>
              <div className="btnRow">
                <button className={`btn ${ageMode === 'younger' ? 'btnSuccess' : ''}`} type="button" onClick={() => chooseAgeMode('younger')}>
                  6-8 лет
                </button>
                <button className={`btn ${ageMode === 'older' ? 'btnSuccess' : ''}`} type="button" onClick={() => chooseAgeMode('older')}>
                  9-11 лет
                </button>
              </div>
            </div>
          </CardInner>
        </Card>

        {error ? (
          <Card>
            <CardInner>
              <div className="grid" style={{ gap: 8 }}>
                <div className="h2">Не получилось загрузить прогресс</div>
                <div className="p">{error.message}</div>
                <div className="hint">
                  Если бэкенд ещё не запущен — это ок. Можно продолжать после запуска API.
                </div>
              </div>
            </CardInner>
          </Card>
        ) : null}

        <div className="grid grid3 motionStagger">
          {GAME_CASES.map((c) => {
            const tasks = getTasksForCase(c.id)
            const approvedCount = submissions ? countApproved(tasks.map((t) => t.id), submissions) : 0
            return (
              <Card key={c.id} variant="soft">
                <CardInner>
                  <div className={`grid lift caseCard caseTint_${c.id}`} style={{ gap: 12, padding: 14, borderRadius: 24 }}>
                    <img className="caseMascot" src={mascotForCase(c.id)} alt="" />
                    <div className="grid" style={{ gap: 4 }}>
                      <div className="h2">{c.title}</div>
                      <div className="p">{c.tagline}</div>
                    </div>
                    <div className="progressSpark">
                      <ProgressBar value={approvedCount} max={tasks.length} label={loading ? 'Загрузка прогресса' : 'Прогресс дела'} />
                    </div>
                    <div className="btnRow" style={{ justifyContent: 'space-between' }}>
                      <Badge variant="magic">Улик: {tasks.length}</Badge>
                      <Link to={`/kid/case/${c.id}`} className="btn btnPrimary">
                        Открыть
                      </Link>
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

