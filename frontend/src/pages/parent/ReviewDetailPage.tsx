import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { getTaskById } from '../../game/content'
import { getSubmission, reviewSubmission } from '../../lib/api'
import { useAsync } from '../../lib/useAsync'
import { PageShell } from '../../ui/PageShell'
import { Badge, Button, Card, CardInner } from '../../ui/Ui'
import { isParentAuthed } from './auth'

const FEEDBACK_TEMPLATES = [
  'Отличное наблюдение! Улика выглядит настоящей.',
  'Хочу увидеть доказательство ближе: добавь фото или объяснение.',
  'Расскажи, почему эта улика связана с делом.',
]

export function ReviewDetailPage() {
  if (!isParentAuthed()) return <Navigate to="/parent" replace />

  const params = useParams()
  const nav = useNavigate()
  const submissionId = params.submissionId ?? ''
  const { data: submission, loading, error } = useAsync(
    () => getSubmission(submissionId),
    [submissionId],
  )

  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [reviewed, setReviewed] = useState<{ id: string; status: 'approved' | 'rejected' } | null>(null)

  const task = submission ? getTaskById(submission.taskId) : null

  async function act(action: 'approve' | 'reject') {
    if (!submission) return
    setBusy(true)
    setLocalError(null)
    try {
      const updated = await reviewSubmission(submission.id, action, {
        parentFeedback: feedback.trim() ? feedback.trim() : undefined,
      })
      if (updated.status === 'approved' || updated.status === 'rejected') {
        setReviewed({ id: updated.id, status: updated.status })
      }
      if (updated.status === 'rejected') {
        nav('/parent/review')
      }
    } catch (e: unknown) {
      setLocalError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell tone="parent" right={<Button to="/parent/review">К очереди</Button>}>
      <div className="grid" style={{ gap: 16 }}>
        <Card variant="hero">
          <CardInner>
            <div className="grid" style={{ gap: 10 }}>
              <h1 className="h1">Штаб старшего следователя</h1>
              <p className="p">Помогите ребёнку почувствовать, что его улика двигает расследование, а не просто проходит проверку.</p>
              {loading ? <div className="hint">Загружаю…</div> : null}
              {error ? <div className="p">{error.message}</div> : null}
              {localError ? (
                <Badge variant="rejected">{localError}</Badge>
              ) : null}
              {submission ? (
                <div className="btnRow">
                  <Badge variant={submission.status === 'pending' ? 'pending' : submission.status === 'approved' ? 'approved' : 'rejected'}>
                    Статус: {submission.status}
                  </Badge>
                  <Badge variant="magic">{new Date(submission.createdAt).toLocaleString()}</Badge>
                </div>
              ) : null}
            </div>
          </CardInner>
        </Card>

        {reviewed?.status === 'approved' ? (
          <Card variant="soft">
            <CardInner>
              <div className="grid" style={{ gap: 10 }}>
                <Badge variant="approved">Улика настоящая</Badge>
                <div className="h2">Лес готов показать ребёнку изменение</div>
                <p className="p">
                  Старший следователь подтвердил доказательство. Теперь ребёнок увидит награду и почувствует, что его действие помогло миру игры.
                </p>
                {task?.emotion ? <div className="hint">{task.emotion.worldChange}</div> : null}
                <div className="btnRow">
                  <Button to="/parent/review" variant="primary">
                    Изучить следующую улику
                  </Button>
                  <Button to="/parent/dashboard">В дашборд</Button>
                  <Button to={`/kid/reward/${reviewed.id}`}>Позвать ребёнка за наградой</Button>
                </div>
              </div>
            </CardInner>
          </Card>
        ) : null}

        {submission && !reviewed ? (
          <Card variant="soft">
            <CardInner>
              <div className="grid" style={{ gap: 12 }}>
                <div className="h2">{task?.title ?? submission.taskId}</div>
                {task?.emotion ? (
                  <div className="parentInvestigationPanel">
                    <Badge variant="magic">Что доказывает ребёнок</Badge>
                    <p className="p">{task.emotion.hypothesis}</p>
                    <div className="hint">После подтверждения: {task.emotion.worldChange}</div>
                  </div>
                ) : null}

                {submission.note ? (
                  <div className="evidenceBox">
                    <div style={{ padding: 0 }}>
                      <div className="label">Заметка ребёнка</div>
                      <div className="p">{submission.note}</div>
                    </div>
                  </div>
                ) : null}

                {submission.photoUrl ? (
                  <div className="field">
                    <div className="label">Фото</div>
                    <img
                      src={submission.photoUrl}
                      alt="evidence"
                      style={{
                        width: '100%',
                        maxHeight: 420,
                        objectFit: 'contain',
                        borderRadius: 22,
                        border: '2px solid rgba(21,18,63,.18)',
                        background: 'linear-gradient(135deg, #39c7ff, #a6ff55)',
                      }}
                    />
                  </div>
                ) : null}

                {submission.audioUrl ? (
                  <div className="field">
                    <div className="label">Аудио</div>
                    <audio controls src={submission.audioUrl} style={{ width: '100%' }} />
                  </div>
                ) : null}

                <div className="field">
                  <div className="label">Реплика старшего следователя (опционально)</div>
                  <div className="btnRow">
                    {FEEDBACK_TEMPLATES.map((template) => (
                      <button className="miniAction" type="button" key={template} onClick={() => setFeedback(template)}>
                        {template}
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="textarea"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Например: Отличное наблюдение! Улика выглядит настоящей."
                  />
                </div>

                <div className="btnRow">
                  <Button variant="success" onClick={() => act('approve')} disabled={busy}>
                    Улика настоящая
                  </Button>
                  <Button variant="danger" onClick={() => act('reject')} disabled={busy}>
                    Нужна ещё подсказка
                  </Button>
                  <Button to="/parent/review" disabled={busy}>
                    Отмена
                  </Button>
                </div>
              </div>
            </CardInner>
          </Card>
        ) : null}
      </div>
    </PageShell>
  )
}

