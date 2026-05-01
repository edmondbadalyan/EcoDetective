import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { getCaseById, getCaseFinale } from '../../game/content'
import { getAgeMode, getAgeModeLabel } from '../../lib/ageMode'
import { Assets } from '../../assets'
import { PageShell } from '../../ui/PageShell'
import { Badge, Button, Card, CardInner, MascotBubble } from '../../ui/Ui'

export function CaseFinalePage() {
  const params = useParams()
  const caseId = params.caseId ?? ''
  const gameCase = getCaseById(caseId)
  const finale = getCaseFinale(caseId)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const ageMode = getAgeMode()

  if (!gameCase || !finale) {
    return (
      <PageShell right={<Button to="/kid">К делам</Button>}>
        <Card>
          <CardInner>Финал дела не найден.</CardInner>
        </Card>
      </PageShell>
    )
  }

  const ageFinale = finale.ageContent?.[ageMode]
  const options = ageFinale?.options ?? finale.options
  const selected = options.find((option) => option.id === selectedId) ?? null
  const question = ageFinale?.question ?? finale.question
  const learningSummary = ageFinale?.learningSummary ?? finale.learningSummary

  return (
    <PageShell tone={gameCase.id} right={<Button to={`/kid/case/${gameCase.id}`}>К уликам</Button>}>
      <div className="grid" style={{ gap: 16 }}>
        <Card variant="hero">
          <CardInner>
            <div className="heroCard">
              <div className="heroColumn">
                <span className="caseKicker">
                  Дело {gameCase.number} · {gameCase.skillLabel}
                </span>
                <h1 className="h1">{gameCase.shortTitle}</h1>
                <Badge variant="magic" size="lg">
                  Финальное обвинение
                </Badge>
                <p className="heroLead">{question}</p>
                <span className="hintChip">
                  Режим: {getAgeModeLabel(ageMode)} · сначала проверь цепочку улик
                </span>
              </div>
            </div>
          </CardInner>
        </Card>

        <MascotBubble imageSrc={gameCase.id === 'case3' ? Assets.illustrations.boss : Assets.characters.guideOwl}>
          Сыщик не верит первой версии. Проверь цепочку доказательств — и только потом называй виновного.
        </MascotBubble>

        <Card variant="soft">
          <CardInner>
            <div className="evidenceChain motionStagger">
              <Badge variant="magic" size="lg">
                Цепочка доказательств
              </Badge>
              {finale.evidenceChain.map((evidence, index) => (
                <div className="evidenceChainStep" key={evidence}>
                  <b>{index + 1}</b>
                  <span>{evidence}</span>
                </div>
              ))}
            </div>
          </CardInner>
        </Card>

        <div className="grid grid3 motionStagger">
          {options.map((option) => (
            <Card key={option.id} variant="soft">
              <CardInner>
                <button
                  className={`finaleChoice ${selectedId === option.id ? 'finaleChoiceSelected' : ''}`}
                  type="button"
                  onClick={() => setSelectedId(option.id)}
                  aria-pressed={selectedId === option.id}
                >
                  {option.portraitSrc ? (
                    <span className="finaleSuspectPortrait" aria-hidden="true">
                      <img src={option.portraitSrc} alt="" />
                    </span>
                  ) : null}
                  <span className="h2">{option.title}</span>
                  <span className="p">{option.description}</span>
                  <Badge variant={selectedId === option.id ? 'approved' : 'magic'}>
                    {selectedId === option.id ? 'Я обвиняю' : 'Назвать виновного'}
                  </Badge>
                </button>
              </CardInner>
            </Card>
          ))}
        </div>

        {selected ? (
          <Card variant={selected.isBest ? 'soft' : 'default'} className={selected.isBest ? 'finaleRevealPanel successPop' : 'softShake'}>
            <CardInner>
              <div className="grid" style={{ gap: 10 }}>
                <Badge variant={selected.isBest ? 'approved' : 'pending'}>
                  {selected.isBest ? 'Дело раскрыто!' : 'Версия не сходится'}
                </Badge>
                <div className="h2">{selected.feedback}</div>
                <p className="p">{learningSummary}</p>
                {selected.isBest ? (
                  <>
                    {finale.twistReveal ? (
                      <div className="twistRevealPanel successPop">
                        <Badge variant="magic" size="lg">
                          Поворот дела
                        </Badge>
                        <h3 className="twistRevealTitle">Что было на самом деле</h3>
                        <p className="p">{finale.twistReveal}</p>
                      </div>
                    ) : null}
                    <div className="worldChangePanel successPop">
                      <Badge variant="approved">Что изменилось в лесу</Badge>
                      <p className="p">{finale.worldChange}</p>
                    </div>
                  </>
                ) : (
                  <div className="hint">Сверь свою версию с цепочкой доказательств выше — какая улика её опровергает?</div>
                )}
                <div className="btnRow">
                  <Button to="/kid/album" variant="primary">
                    Открыть альбом улик
                  </Button>
                  <Button to="/kid/map">К карте леса</Button>
                </div>
              </div>
            </CardInner>
          </Card>
        ) : null}
      </div>
    </PageShell>
  )
}
