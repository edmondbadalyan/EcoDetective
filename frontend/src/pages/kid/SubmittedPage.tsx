import { useParams } from 'react-router-dom'
import { getTaskById } from '../../game/content'
import { getQuickTask, latestByTask } from '../../game/progress'
import { getSubmission, listSubmissions } from '../../lib/api'
import { useAsync } from '../../lib/useAsync'
import { Assets } from '../../assets'
import { PageShell } from '../../ui/PageShell'
import { Badge, Button, Card, CardInner, MascotBubble } from '../../ui/Ui'

function statusLabel(status: string) {
  if (status === 'pending') return 'улика в штабе'
  if (status === 'approved') return 'подтверждено'
  if (status === 'rejected') return 'нужна ещё одна подсказка'
  return status
}

export function SubmittedPage() {
  const params = useParams()
  const submissionId = params.submissionId ?? ''
  const { data: submission, loading, error } = useAsync(() => getSubmission(submissionId), [submissionId])
  const { data: submissions } = useAsync(() => listSubmissions(), [])

  const task = submission ? getTaskById(submission.taskId) : null
  const byTask = submissions ? latestByTask(submissions) : new Map()
  const quickTask = getQuickTask(byTask, task?.id)
  const isApproved = submission?.status === 'approved'
  const isRejected = submission?.status === 'rejected'

  return (
    <PageShell tone={task?.caseId ? (task.caseId as 'case1' | 'case2' | 'case3') : 'kid'} right={<Button to="/kid">К делам</Button>}>
      <div className="grid" style={{ gap: 16 }}>
        <Card variant="hero">
          <CardInner>
            <div className="grid" style={{ gap: 10 }}>
              <h1 className="h1">Улика отправилась в штаб!</h1>
              {loading ? <div className="loadingCritter">Штаб читает улику</div> : null}
              {error ? <p className="p softShake">{error.message}</p> : null}
              {submission ? (
                <>
                  <p className="p">
                    Улика: <b>{task?.title ?? submission.taskId}</b>
                  </p>
                  <p className="p">
                    Сейчас статус: <b>{statusLabel(submission.status)}</b>
                  </p>
                  <Badge variant={submission.status === 'pending' ? 'pending' : submission.status === 'approved' ? 'approved' : 'rejected'}>
                    {submission.status === 'pending' ? 'Штаб изучает улику' : statusLabel(submission.status)}
                  </Badge>
                </>
              ) : null}
              {submission ? (
                <div className="statusTimeline motionStagger" aria-label="Статус проверки задания">
                  <div className="statusStep statusStepDone successPop">
                    <b>1</b>
                    <span>Отправлено</span>
                  </div>
                  <div className={`statusStep ${submission.status !== 'pending' ? 'statusStepDone successPop' : 'statusStepActive'}`}>
                    <b>2</b>
                    <span>Штаб изучает</span>
                  </div>
                  <div className={`statusStep ${isApproved ? 'statusStepDone successPop' : isRejected ? 'statusStepRejected softShake' : ''}`}>
                    <b>3</b>
                    <span>{isRejected ? 'Ещё подсказка' : 'Награда'}</span>
                  </div>
                </div>
              ) : null}
              {submission && !isApproved && !isRejected ? (
                <div className="missionPulsePanel progressSpark">
                  <Badge variant="magic">Маленькая победа уже есть</Badge>
                  <div className="h2">Ты не просто отправил(а) файл — ты передал(а) улику старшему следователю.</div>
                  <p className="p">
                    {task?.emotion?.worldChange ?? 'Лес уже прислушался к твоей версии и ждёт подтверждения взрослого.'}
                  </p>
                </div>
              ) : null}
              {isRejected ? (
                <div className="feedbackPanel softShake">
                  <div className="h2">Штабу нужна ещё одна подсказка</div>
                  <p className="p">{submission.parentFeedback || 'Попробуй ещё раз и покажи доказательство чуть яснее.'}</p>
                </div>
              ) : null}
              <div className={`hint ${isApproved ? 'successPop' : isRejected ? 'softShake' : ''}`}>
                {isApproved
                  ? 'Взрослый подтвердил улику. Можно забрать награду.'
                  : isRejected
                    ? 'Добавь новую подсказку, чтобы версия стала сильнее.'
                    : 'Попроси взрослого открыть “Режим родителя”: он станет старшим следователем и подтвердит улику.'}
              </div>
              <div className="btnRow">
                {isApproved ? (
                  <Button to={`/kid/reward/${submissionId}`} variant="primary">
                    Забрать награду
                  </Button>
                ) : null}
                {isRejected && task ? (
                  <Button to={`/kid/task/${task.id}/evidence`} variant="primary">
                    Добавить подсказку и отправить снова
                  </Button>
                ) : null}
                {!isApproved && !isRejected ? (
                  <Button to={`/parent/review/${submissionId}`} variant="primary">
                    Взрослому: открыть штаб
                  </Button>
                ) : null}
                {!isApproved && !isRejected && quickTask ? (
                  <Button to={`/kid/task/${quickTask.id}`}>Пойти по другому следу: ~{quickTask.expectedMinutes} мин</Button>
                ) : null}
                <Button to="/kid">Вернуться к делам</Button>
              </div>
            </div>
          </CardInner>
        </Card>
        <MascotBubble imageSrc={Assets.illustrations.slime}>
          Улика уже в штабе. Пока взрослый смотрит доказательство, можно идти по другому следу и не терять приключение.
        </MascotBubble>
      </div>
    </PageShell>
  )
}

