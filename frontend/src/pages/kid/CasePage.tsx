import { Link, useParams } from 'react-router-dom'
import {
  getCaseById,
  getEvidenceLinksForCase,
  getSuspectStatus,
  getTasksForCase,
} from '../../game/content'
import type { Submission } from '../../game/types'
import { listSubmissions } from '../../lib/api'
import { useAsync } from '../../lib/useAsync'
import { Assets } from '../../assets'
import { PageShell } from '../../ui/PageShell'
import { Badge, Button, Card, CardInner, MascotBubble, ProgressBar, SuspectBoard } from '../../ui/Ui'

function latestByTask(submissions: Submission[]) {
  const map = new Map<string, Submission>()
  for (const s of submissions) {
    const prev = map.get(s.taskId)
    if (!prev || new Date(prev.createdAt).getTime() < new Date(s.createdAt).getTime()) map.set(s.taskId, s)
  }
  return map
}

function statusVariant(status: Submission['status'] | undefined) {
  if (status === 'approved') return 'approved'
  if (status === 'rejected') return 'rejected'
  if (status === 'pending') return 'pending'
  return 'magic'
}

function mascotForCase(caseId: string) {
  if (caseId === 'case2') return Assets.illustrations.slime
  if (caseId === 'case3') return Assets.illustrations.boss
  return Assets.illustrations.chicken
}

export function CasePage() {
  const params = useParams()
  const c = getCaseById(params.caseId ?? '')
  const tasks = c ? getTasksForCase(c.id) : []
  const { data: submissions } = useAsync(() => listSubmissions(), [])

  if (!c) {
    return (
      <PageShell right={<Button to="/kid">Назад</Button>}>
        <Card>
          <CardInner>Дело не найдено.</CardInner>
        </Card>
      </PageShell>
    )
  }

  const byTask = submissions ? latestByTask(submissions) : new Map<string, Submission>()
  const hero =
    c.id === 'case1' ? Assets.cases.case1Hero : c.id === 'case2' ? Assets.cases.case2Hero : Assets.cases.case3Hero
  const done = tasks.filter((t) => byTask.get(t.id)?.status === 'approved').length
  const isComplete = tasks.length > 0 && done === tasks.length
  const approvedTaskIds = new Set(
    tasks.filter((t) => byTask.get(t.id)?.status === 'approved').map((t) => t.id),
  )
  const evidenceLinks = getEvidenceLinksForCase(c.id)

  return (
    <PageShell tone={c.id as 'case1' | 'case2' | 'case3'} right={<Button to="/kid">К делам</Button>}>
      <div className="grid" style={{ gap: 16 }}>
        <Card variant="hero">
          <CardInner>
            <div className="heroCard">
              <div className="heroBg">
                <img src={hero} alt="" />
              </div>
              <div className="heroColumn">
                <span className="caseKicker">
                  Дело {c.number} · {c.skillLabel}
                </span>
                <h1 className="h1">{c.shortTitle}</h1>
                <Badge variant="magic" size="lg">
                  Задание сыщика
                </Badge>
                <p className="heroLead">{c.intro}</p>
                <ProgressBar value={done} max={tasks.length} label="Улик раскрыто" />
                <span className="hintChip">
                  {tasks.length} улик в деле · после задания передай взрослому на проверку
                </span>
                {isComplete ? (
                  <div className="btnRow">
                    <Button to={`/kid/case/${c.id}/finale`} variant="primary">
                      Назвать виновного
                    </Button>
                    <Button to="/kid/album">Альбом улик</Button>
                  </div>
                ) : null}
              </div>
            </div>
          </CardInner>
        </Card>

        <MascotBubble imageSrc={mascotForCase(c.id)}>
          На доске трое подозреваемых. Каждая улика подтверждает или исключает кого-то. Раскрывай улики по порядку — и доска сама подскажет ответ.
        </MascotBubble>

        <Card variant="soft">
          <CardInner>
            <SuspectBoard
              title="Кто под подозрением"
              subtitle="Алиби, мотив и пины-улики помогут сузить круг."
              suspects={c.suspects}
              approvedTaskIds={approvedTaskIds}
              links={evidenceLinks}
              getStatus={getSuspectStatus}
            />
          </CardInner>
        </Card>

        <div className="grid grid2 motionStagger">
          {tasks.map((t) => {
            const s = byTask.get(t.id)
            const status = s?.status
            const badgeText =
              status === 'approved' ? 'Подтверждено' : status === 'rejected' ? 'Нужно пересдать' : status === 'pending' ? 'На проверке' : 'Не начато'
            return (
              <Card key={t.id} variant="soft">
                <CardInner>
                  <div className={`grid lift caseTint_${c.id}`} style={{ gap: 12, padding: 14, borderRadius: 24 }}>
                    <img className="taskCardImage" src={t.imageSrc} alt="" />
                    <div className="grid" style={{ gap: 4 }}>
                      <div className="h2">
                        {t.order}. {t.title}
                      </div>
                      <div className="p">{t.story}</div>
                    </div>
                    <div className="btnRow" style={{ justifyContent: 'space-between' }}>
                      <Badge variant={statusVariant(status)}>{badgeText}</Badge>
                      <Link to={`/kid/task/${t.id}`} className="btn btnPrimary">
                        Открыть улику
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
