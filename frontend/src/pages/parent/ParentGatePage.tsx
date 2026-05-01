import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Assets } from '../../assets'
import { PageShell } from '../../ui/PageShell'
import { Badge, Button, Card, CardInner, MascotBubble } from '../../ui/Ui'
import { isParentAuthed, setParentAuthed } from './auth'

const DEFAULT_PIN = import.meta.env.VITE_PARENT_PIN ?? '1234'

function makeChallenge() {
  const a = 2 + Math.floor(Math.random() * 8)
  const b = 2 + Math.floor(Math.random() * 8)
  return { a, b, answer: String(a + b) }
}

export function ParentGatePage() {
  const nav = useNavigate()
  const loc = useLocation()
  const next = new URLSearchParams(loc.search).get('next') ?? '/parent/dashboard'

  const challenge = useMemo(() => makeChallenge(), [])
  const [pin, setPin] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (isParentAuthed()) return <Navigate to={next} replace />

  function submit() {
    setError(null)
    if (pin !== DEFAULT_PIN) {
      setError('Неверный PIN. Проверь демо-настройки проекта.')
      return
    }
    if (answer.trim() !== challenge.answer) {
      setError('Неверный ответ на пример.')
      return
    }
    setParentAuthed(true)
    nav(next, { replace: true })
  }

  return (
    <PageShell tone="parent" right={<Button to="/kid">К ребёнку</Button>}>
      <div className="grid" style={{ gap: 16 }}>
        <Card variant="hero">
          <CardInner>
            <div className="grid" style={{ gap: 10 }}>
              <h1 className="h1">Режим родителя</h1>
              <p className="p">
                Здесь взрослый подтверждает офлайн-задания. Это демо-защита (не для настоящей безопасности).
              </p>
              {error ? (
                <Badge variant="rejected">{error}</Badge>
              ) : null}
              <div className="grid grid2">
                <div className="field">
                  <div className="label">PIN</div>
                  <input className="input" value={pin} onChange={(e) => setPin(e.target.value)} />
                  <div className="hint">Для локального демо по умолчанию: 1234</div>
                </div>
                <div className="field">
                  <div className="label">
                    Пример: {challenge.a} + {challenge.b} = ?
                  </div>
                  <input className="input" value={answer} onChange={(e) => setAnswer(e.target.value)} />
                  <div className="hint">Защита от случайного нажатия ребёнком</div>
                </div>
              </div>
              <div className="btnRow">
                <Button variant="primary" onClick={submit}>
                  Войти
                </Button>
                <Button to="/kid">Отмена</Button>
              </div>
            </div>
          </CardInner>
        </Card>
        <MascotBubble imageSrc={Assets.illustrations.chicken}>
          Взрослый режим яркий, но защищённый: PIN и пример помогают избежать случайного входа ребёнком.
        </MascotBubble>
      </div>
    </PageShell>
  )
}

