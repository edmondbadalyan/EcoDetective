import { Navigate } from 'react-router-dom'
import { useState } from 'react'
import { CLUE_TASKS, GAME_CASES, getTaskById } from '../../game/content'
import type { LearningSkill, Submission } from '../../game/types'
import { getOwlHouseStage, getQuickTask, getTokenBalance, latestByTask, TOKEN_GOAL, TOKEN_GOAL_TITLE } from '../../game/progress'
import { listSubmissions } from '../../lib/api'
import { getFamilyShortCode, resetFamilyId } from '../../lib/family'
import { useAsync } from '../../lib/useAsync'
import { PageShell } from '../../ui/PageShell'
import { Badge, Button, Card, CardInner, ProgressBar } from '../../ui/Ui'
import { isParentAuthed, setParentAuthed } from './auth'

export function ParentDashboardPage() {
  if (!isParentAuthed()) return <Navigate to="/parent" replace />

  const { data: submissions, loading, error } = useAsync(() => listSubmissions(), [])
  const [familyCode, setFamilyCode] = useState(() => getFamilyShortCode())
  const byTask = submissions ? latestByTask(submissions) : new Map<string, Submission>()
  const latestSubmissions = Array.from(byTask.values())
  const pending = latestSubmissions.filter((s) => s.status === 'pending').length
  const approved = latestSubmissions.filter((s) => s.status === 'approved').length
  const rejected = latestSubmissions.filter((s) => s.status === 'rejected').length

  const approvedTaskIds = new Set(
    latestSubmissions.filter((s) => s.status === 'approved').map((s) => s.taskId),
  )
  const totalTasks = CLUE_TASKS.length
  const approvedTasks = approvedTaskIds.size
  const tokenBalance = submissions ? getTokenBalance(submissions) : 0
  const lastSuccess = latestSubmissions
    .filter((s) => s.status === 'approved')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
  const recommendedTask = getQuickTask(byTask)
  const owlStage = getOwlHouseStage(tokenBalance)
  const skillCounts = CLUE_TASKS.reduce<Record<string, number>>((acc, task) => {
    if (!approvedTaskIds.has(task.id)) return acc
    const skill: LearningSkill | 'Исследование' = task.skill ?? 'Исследование'
    acc[skill] = (acc[skill] ?? 0) + 1
    return acc
  }, {})

  return (
    <PageShell
      tone="parent"
      right={
        <>
          <Button to="/parent/review" variant="primary">
            Открыть штаб
          </Button>
          <Button
            onClick={() => {
              setParentAuthed(false)
              setTimeout(() => window.location.assign('/kid'), 50)
            }}
          >
            Выйти
          </Button>
        </>
      }
    >
      <div className="grid" style={{ gap: 16 }}>
        <Card variant="hero">
          <CardInner>
            <div className="grid" style={{ gap: 10 }}>
              <h1 className="h1">Штаб семьи</h1>
              <p className="p">Вы — старший следователь: помогаете ребёнку доказать версии и увидеть, как лес меняется.</p>
              {error ? <div className="p">{error.message}</div> : null}
              <div className="btnRow">
                <span className="badge badgePending">Улики в штабе: {loading ? '…' : pending}</span>
                <span className="badge badgeApproved">Настоящие улики: {loading ? '…' : approved}</span>
                <span className="badge badgeRejected">Нужны подсказки: {loading ? '…' : rejected}</span>
                <Badge variant="magic">Всего: {totalTasks}</Badge>
                <Badge variant="approved">Жетоны: {loading ? '…' : tokenBalance}/{TOKEN_GOAL}</Badge>
              </div>
              <ProgressBar value={approvedTasks} max={totalTasks} label={loading ? 'Загрузка прогресса' : 'Общий прогресс'} />
              <ProgressBar value={Math.min(tokenBalance, TOKEN_GOAL)} max={TOKEN_GOAL} label={TOKEN_GOAL_TITLE} />
              <div className="hint">{owlStage.title}: {owlStage.description}</div>
            </div>
          </CardInner>
        </Card>

        <div className="grid grid3">
          <Card variant="soft">
            <CardInner>
              <div className="valueCard">
                <Badge variant="approved">Последняя настоящая улика</Badge>
                <div className="h2">{lastSuccess ? getTaskById(lastSuccess.taskId)?.title ?? lastSuccess.taskId : 'Пока ждём первую награду'}</div>
                <p className="p">
                  {lastSuccess
                    ? `Ребёнок получил подтверждение ${new Date(lastSuccess.createdAt).toLocaleDateString()}, а лес стал на шаг живее.`
                    : 'После первой настоящей улики здесь появится повод позвать ребёнка за победой.'}
                </p>
              </div>
            </CardInner>
          </Card>
          <Card variant="soft">
            <CardInner>
              <div className="valueCard">
                <Badge variant="skill">Что развиваем</Badge>
                <div className="h2">{Object.keys(skillCounts)[0] ?? 'Наблюдение'}</div>
                <p className="p">Навыки считаются по последней версии каждого задания, чтобы повторные попытки не искажали прогресс.</p>
              </div>
            </CardInner>
          </Card>
          <Card variant="soft">
            <CardInner>
              <div className="valueCard">
                <Badge variant="magic">Следующий шаг</Badge>
                <div className="h2">{recommendedTask?.title ?? 'Все текущие улики закрыты'}</div>
                <p className="p">
                  {recommendedTask ? `Короткая миссия примерно на ${recommendedTask.expectedMinutes} мин.` : 'Можно открыть альбом или добавить новое дело.'}
                </p>
              </div>
            </CardInner>
          </Card>
        </div>

        <div className="grid grid3">
          {GAME_CASES.map((c) => {
            const tasks = CLUE_TASKS.filter((t) => t.caseId === c.id)
            const done = tasks.filter((t) => approvedTaskIds.has(t.id)).length
            return (
              <Card key={c.id} variant="soft">
                <CardInner>
                  <div className={`grid caseTint_${c.id}`} style={{ gap: 10, padding: 14, borderRadius: 24 }}>
                    <div className="h2">{c.title}</div>
                    <div className="p">{c.tagline}</div>
                    <ProgressBar value={done} max={tasks.length} label={loading ? 'Загрузка' : 'Подтверждено'} />
                  </div>
                </CardInner>
              </Card>
            )
          })}
        </div>

        <Card variant="soft">
          <CardInner>
            <div className="grid" style={{ gap: 10 }}>
              <div className="h2">Какие навыки тренируются</div>
              <div className="hint">Считаются только подтверждённые взрослым задания.</div>
              <div className="btnRow">
                {Object.entries(skillCounts).map(([skill, count]) => (
                  <Badge key={skill} variant="approved">
                    {skill}: {count}
                  </Badge>
                ))}
                {Object.keys(skillCounts).length === 0 ? <Badge variant="magic">Пока ждём первые подтверждения</Badge> : null}
              </div>
            </div>
          </CardInner>
        </Card>

        <Card variant="soft">
          <CardInner>
            <div className="grid" style={{ gap: 10 }}>
              <div className="h2">Последние отправки</div>
              <div className="hint">
                Список последних улик из штаба: фото, аудио, заметки и быстрый переход к решению.
              </div>
              <div className="grid" style={{ gap: 8 }}>
                {(submissions ?? [])
                  .slice()
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 6)
                  .map((s) => (
                    <div key={s.id} className="submissionItem">
                      <div style={{ padding: 0 }}>
                        <div className="btnRow" style={{ justifyContent: 'space-between' }}>
                          <div style={{ display: 'grid', gap: 2 }}>
                            <div style={{ fontWeight: 800 }}>
                              {getTaskById(s.taskId)?.title ?? s.taskId}
                            </div>
                            <div className="hint">
                            решение штаба: {s.status} • {new Date(s.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <Button to={`/parent/review/${s.id}`} variant="primary">
                            Изучить
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                {!submissions || submissions.length === 0 ? (
                  <div className="hint">Пока нет отправленных заданий.</div>
                ) : null}
              </div>
            </div>
          </CardInner>
        </Card>

        <Card variant="soft">
          <CardInner>
            <div className="privacyPanel">
              <div className="grid" style={{ gap: 6 }}>
                <Badge variant="magic">Семейный контур</Badge>
                <div className="h2">Код семьи: {familyCode}</div>
                <p className="p">
                  Заявки этой семьи отделены от других локальным семейным идентификатором. Фото и аудио хранятся на вашем API-сервере, а PIN остаётся демо-защитой для родительского режима.
                </p>
              </div>
              <div className="btnRow">
                <Button
                  onClick={() => {
                    setFamilyCode(resetFamilyId().replace(/^family-/, '').slice(0, 8).toUpperCase())
                  }}
                >
                  Начать новый семейный контур
                </Button>
              </div>
              <div className="hint">
                Для реального запуска здесь стоит добавить смену PIN, удаление медиа и управление несколькими детьми.
              </div>
            </div>
          </CardInner>
        </Card>
      </div>
    </PageShell>
  )
}

