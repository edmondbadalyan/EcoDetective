import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Assets } from '../assets'

export type PageTone = 'kid' | 'parent' | 'case1' | 'case2' | 'case3'

function getCompanion(tone: PageTone) {
  if (tone === 'parent') return { src: Assets.illustrations.chicken, text: 'Я слежу за очередью проверки!' }
  if (tone === 'case2') return { src: Assets.illustrations.slime, text: 'Слушай ручей и ищи следы.' }
  if (tone === 'case3') return { src: Assets.illustrations.boss, text: 'Тролль боится порядка!' }
  const kidLines = [
    'Улика рядом. Пора в путь!',
    'Тсс… лес шепчет подсказку. Идём?',
    'Сыщик, проверь след — и расскажи взрослому вывод.',
    'Маленький шаг — большая улика.',
    'Если застрял(а) — выбери другой след и вернись позже.',
  ]
  return { src: Assets.characters.guideOwl, text: kidLines[Math.floor(Math.random() * kidLines.length)] }
}

export function PageShell(props: { right?: ReactNode; children: ReactNode; tone?: PageTone }) {
  const tone = props.tone ?? 'kid'
  const companion = getCompanion(tone)

  return (
    <div className={'appShell ' + `tone_${tone}`}>
      <div className="appBg" aria-hidden="true">
        <div className="appBgGlow" />
        <img className="appBgSticker one" src={Assets.illustrations.slime} alt="" />
        <img className="appBgSticker two" src={Assets.illustrations.boss} alt="" />
        <img className="appBgSticker three" src={Assets.illustrations.chicken} alt="" />
      </div>
      <header className="topbar">
        <div className="topbarInner">
          <Link to="/kid" className="brand">
            <div className="brandTitle">ЭкоСледователь</div>
            <div className="brandTag">детектив волшебного леса</div>
          </Link>
          <div className="btnRow">{props.right}</div>
        </div>
      </header>
      <aside className="floatingCompanion" aria-label={companion.text}>
        <div className="companionBubble">{companion.text}</div>
        <img src={companion.src} alt="" />
      </aside>
      <main className="main">{props.children}</main>
    </div>
  )
}

