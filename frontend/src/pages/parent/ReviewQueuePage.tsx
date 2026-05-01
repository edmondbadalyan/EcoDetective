import { Navigate } from 'react-router-dom'
import { getTaskById } from '../../game/content'
import { listSubmissions } from '../../lib/api'
import { useAsync } from '../../lib/useAsync'
import { PageShell } from '../../ui/PageShell'
import { Badge, Button, Card, CardInner } from '../../ui/Ui'
import { isParentAuthed } from './auth'

export function ReviewQueuePage() {
  if (!isParentAuthed()) return <Navigate to="/parent" replace />

  const { data: pending, loading, error } = useAsync(() => listSubmissions({ status: 'pending' }), [])

  return (
    <PageShell tone="parent" right={<Button to="/parent/dashboard">В дашборд</Button>}>
      <div className="grid" style={{ gap: 16 }}>
        <Card variant="hero">
          <CardInner>
            <div className="grid" style={{ gap: 10 }}>
              <h1 className="h1">Очередь штаба</h1>
              <p className="p">Изучите улики как старший следователь: подтвердите находку или попросите ещё одну подсказку.</p>
              {loading ? <div className="hint">Загружаю…</div> : null}
              {error ? <div className="p">{error.message}</div> : null}
            </div>
          </CardInner>
        </Card>

        <Card variant="soft">
          <CardInner>
            <div className="grid" style={{ gap: 8 }}>
              {(pending ?? []).map((s) => (
                <div key={s.id} className="submissionItem">
                  <div style={{ padding: 0 }}>
                    <div className="btnRow" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'grid', gap: 2 }}>
                        <div style={{ fontWeight: 800 }}>
                          {getTaskById(s.taskId)?.title ?? s.taskId}
                        </div>
                        <div className="btnRow">
                          <Badge variant="pending">Ждёт решения штаба</Badge>
                          <span className="hint">{new Date(s.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <Button to={`/parent/review/${s.id}`} variant="primary">
                        Изучить улику
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {pending && pending.length === 0 ? <div className="hint">Нет заданий на проверке.</div> : null}
            </div>
          </CardInner>
        </Card>
      </div>
    </PageShell>
  )
}

