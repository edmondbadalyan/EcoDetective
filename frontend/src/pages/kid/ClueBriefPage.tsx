import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCaseById, getTaskById } from '../../game/content'
import { getTaskAgeContent } from '../../game/ageContent'
import { canSpeak, speakText, stopSpeaking } from '../../lib/speech'
import { getAgeMode, getAgeModeLabel } from '../../lib/ageMode'
import { Assets } from '../../assets'
import { PageShell } from '../../ui/PageShell'
import { Badge, Button, Card, CardInner, MascotBubble } from '../../ui/Ui'

export function ClueBriefPage() {
  const params = useParams()
  const task = getTaskById(params.taskId ?? '')
  const c = task ? getCaseById(task.caseId) : null
  const [speechError, setSpeechError] = useState<string | null>(null)

  if (!task || !c) {
    return (
      <PageShell right={<Button to="/kid">К делам</Button>}>
        <Card>
          <CardInner>Улика не найдена.</CardInner>
        </Card>
      </PageShell>
    )
  }

  const currentTask = task
  const typeLabel = currentTask.type === 'draw' ? 'Рисунок' : currentTask.type === 'read' ? 'Чтение' : 'Поиск'
  const ageMode = getAgeMode()
  const ageContent = getTaskAgeContent(currentTask, ageMode)
  const ageHint = currentTask.ageHint?.[ageMode]
  const emotion = currentTask.emotion

  function onSpeak() {
    setSpeechError(null)
    const ok = speakText(`${currentTask.title}. ${ageContent.story}. ${ageContent.instructions}. ${ageContent.reflectionQuestion}`)
    if (!ok) setSpeechError('Озвучка недоступна в этом браузере.')
  }

  return (
    <PageShell tone={task.caseId as 'case1' | 'case2' | 'case3'} right={<Button to={`/kid/case/${task.caseId}`}>К делу</Button>}>
      <div className="grid" style={{ gap: 16 }}>
        <Card variant="hero">
          <CardInner>
            <div className="heroCard">
              <div className="heroColumn">
                <span className="caseKicker">
                  Дело {c.number} · Улика №{task.order}
                </span>
                <h1 className="h1">{task.title.replace(/^Улика\s*№?\d*:\s*/, '')}</h1>
                <Badge variant="magic" size="lg">
                  {typeLabel} · ~{ageContent.expectedMinutes} мин
                </Badge>
                <p className="heroLead">{ageContent.story}</p>
                <span className="hintChip">Режим: {getAgeModeLabel(ageMode)}</span>
              </div>
            </div>
          </CardInner>
        </Card>

        <MascotBubble imageSrc={task.caseId === 'case3' ? Assets.illustrations.boss : Assets.illustrations.slime}>
          {ageContent.mascotTip}
        </MascotBubble>

        <Card variant="soft" className="briefCard">
          <CardInner>
            <div className="briefStack">
              <section className="briefSection briefSectionWhy" aria-labelledby="why-title">
                <div className="briefMetaRow">
                  <Badge variant="skill">{task.skill ?? 'Исследование'}</Badge>
                  <Badge variant="hint">{ageHint ?? 'Подумай, какая улика самая важная.'}</Badge>
                </div>
                <div className="h2" id="why-title">
                  Что мы заметили
                </div>
                <p className="p">{emotion?.mystery ?? ageContent.story}</p>
              </section>

              <section className="briefSection briefSectionVersion" aria-labelledby="version-title">
                <Badge variant="magic">Версия сыщика</Badge>
                <div className="h2" id="version-title">
                  Какая версия?
                </div>
                <p className="p">{emotion?.hypothesis ?? 'Эта улика может изменить ход расследования.'}</p>
              </section>

              <section className="briefSection briefSectionTask" aria-labelledby="task-title">
                <Badge variant="pending">Главный шаг</Badge>
                <div className="h2" id="task-title">
                  Что доказать
                </div>
                <p className="briefLead">{ageContent.instructions}</p>
              </section>

              <section className="briefSection briefSectionQuestion" aria-labelledby="question-title">
                <div className="h2" id="question-title">
                  Вопрос сыщика
                </div>
                <p className="p">{ageContent.reflectionQuestion}</p>
              </section>

              <div className="briefProof">{emotion?.proofGoal ?? ageContent.proofGuidance}</div>
              <div className="briefWorldChange">{emotion?.worldChange ?? task.ecoFact}</div>

              <section className="briefActions" aria-label="Действия с заданием">
                <div className="briefAudioGroup">
                  <button className="btn btnAudio" type="button" onClick={onSpeak}>
                    Послушать задание
                  </button>
                  <button className="btn btnQuiet" type="button" onClick={stopSpeaking} disabled={!canSpeak()}>
                    Остановить
                  </button>
                </div>
                {speechError ? <Badge variant="rejected">{speechError}</Badge> : null}
                <Link to={`/kid/task/${task.id}/evidence`} className="btn btnPrimary btnMainAction">
                  Я сделал(а)! Отправить доказательство
                </Link>
              </section>
            </div>
          </CardInner>
        </Card>
      </div>
    </PageShell>
  )
}

