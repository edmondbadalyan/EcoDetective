import { useParams } from 'react-router-dom'
import { getTaskById } from '../../game/content'
import { getNextTaskInCase, getOwlHouseStage, getQuickTaskForCase, getTokenBalance, latestByTask, TOKEN_GOAL, TOKEN_GOAL_TITLE } from '../../game/progress'
import { getSubmission, listSubmissions } from '../../lib/api'
import { useAsync } from '../../lib/useAsync'
import { Assets } from '../../assets'
import { PageShell } from '../../ui/PageShell'
import { Badge, Button, Card, CardInner, MascotBubble, ProgressBar } from '../../ui/Ui'

export function RewardPage() {
  const params = useParams()
  const submissionId = params.submissionId ?? ''
  const { data: submission, loading, error } = useAsync(() => getSubmission(submissionId), [submissionId])
  const { data: submissions } = useAsync(() => listSubmissions(), [])

  const task = submission ? getTaskById(submission.taskId) : null
  const byTask = submissions ? latestByTask(submissions) : new Map()
  const nextTask = task ? getNextTaskInCase(task.caseId, byTask, task.order) : null
  const quickTask = task ? getQuickTaskForCase(byTask, task.caseId, task.id) : null
  const tokenBalance = submissions ? getTokenBalance(submissions) : 0
  const owlStage = getOwlHouseStage(tokenBalance)

  return (
    <PageShell tone={task?.caseId ? (task.caseId as 'case1' | 'case2' | 'case3') : 'kid'} right={<Button to="/kid">К делам</Button>}>
      <Card variant="hero">
        <CardInner>
          <div className="grid rewardBurst" style={{ gap: 10 }}>
            <img className="confettiLeaf one" src={Assets.decor.leaf01} alt="" />
            <img className="confettiLeaf two" src={Assets.decor.leaf01} alt="" />
            <img className="confettiLeaf three" src={Assets.decor.leaf01} alt="" />
            <span className="rewardSpark one" aria-hidden="true" />
            <span className="rewardSpark two" aria-hidden="true" />
            <span className="rewardSpark three" aria-hidden="true" />
            <h1 className="h1">Награда</h1>
            {loading ? <div className="loadingCritter">Лес готовит награду</div> : null}
            {error ? <p className="p softShake">{error.message}</p> : null}

            {submission && task ? (
              submission.status === 'approved' ? (
                <>
                  <div className="successPop">
                    <MascotBubble imageSrc={Assets.illustrations.chicken}>
                    Победа! Награда выдана, лесные жители хлопают крыльями и зовут к следующей улике.
                    </MascotBubble>
                  </div>
                  <div className="btnRow" style={{ alignItems: 'center', gap: 14 }}>
                    <span className="rewardTokenWrap">
                      <img className="rewardToken" src={Assets.rewards.token} alt="" />
                    </span>
                    <div className="rewardAmount" style={{ display: 'grid', gap: 4 }}>
                      <div style={{ fontWeight: 900, fontSize: 18 }}>
                        +{task.reward.tokens} жетонов
                      </div>
                      <Badge variant="approved">Артефакт дела: “{task.reward.sticker}”</Badge>
                    </div>
                  </div>
                  <p className="p">
                    Взрослый подтвердил улику <b>“{task.title}”</b>.
                  </p>
                  <p className="p">
                    Ты получил(а) <b>{task.reward.tokens}</b> жетонов и стикер <b>“{task.reward.sticker}”</b>.
                  </p>
                  <div className="goalPanel progressSpark">
                    <div className="grid" style={{ gap: 4 }}>
                      <div className="h2">{TOKEN_GOAL_TITLE}</div>
                      <p className="p">{owlStage.title}: {owlStage.description}</p>
                      <div className="hint">В копилке уже {tokenBalance} жетонов из {TOKEN_GOAL}.</div>
                    </div>
                    <ProgressBar value={Math.min(tokenBalance, TOKEN_GOAL)} max={TOKEN_GOAL} label="Большая цель" />
                  </div>
                  <div className="worldChangePanel successPop">
                    <Badge variant="magic">Лес изменился</Badge>
                    <p className="p">{task.emotion?.worldChange ?? 'Эта улика сделала расследование сильнее.'}</p>
                  </div>
                  {task.ecoFact ? (
                    <div className="learningPanel">
                      <div className="h2">Эко-вывод</div>
                      <p className="p">{task.ecoFact}</p>
                      <Badge variant="approved">Навык: {task.skill ?? 'Исследование'}</Badge>
                    </div>
                  ) : null}
                  {nextTask || quickTask ? (
                    <div className="nextMissionPanel">
                      <div className="grid" style={{ gap: 4 }}>
                        <Badge variant="magic">Что дальше?</Badge>
                        <div className="h2">Выбери следующую миссию</div>
                      </div>
                      <div className="btnRow">
                        {nextTask ? (
                          <Button to={`/kid/task/${nextTask.id}`} variant="primary">
                            Следующая улика: {nextTask.title}
                          </Button>
                        ) : null}
                        {quickTask ? (
                          <Button to={`/kid/task/${quickTask.id}`}>
                            Короткое задание на ~{quickTask.expectedMinutes} мин
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  <div className="btnRow">
                    <Button to={`/kid/case/${task.caseId}`} variant="primary">
                      К следующей улике
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="p">
                    Пока награда недоступна: статус <b>{submission.status}</b>.
                  </p>
                  <div className="btnRow">
                    <Button to={`/kid/submitted/${submission.id}`} variant="primary">
                      Вернуться к статусу
                    </Button>
                  </div>
                </>
              )
            ) : null}
          </div>
        </CardInner>
      </Card>
    </PageShell>
  )
}

