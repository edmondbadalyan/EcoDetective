import { Assets } from '../assets'
import type { CaseId } from './types'

export type MapRegion = {
  caseId: CaseId
  label: string
  shortLabel: string
  description: string
  x: number
  y: number
  mascot: string
}

export const MAP_REGIONS: MapRegion[] = [
  {
    caseId: 'case1',
    label: 'Лесная оранжерея',
    shortLabel: 'Оранжерея',
    description: 'Здесь пропал редкий росток. Начни с зелёных следов и солнечных улик.',
    x: 20,
    y: 50,
    mascot: Assets.illustrations.chicken,
  },
  {
    caseId: 'case2',
    label: 'Ручей с загадочными следами',
    shortLabel: 'Ручей',
    description: 'У воды спрятаны капли, звуки и следы. Слушай внимательно.',
    x: 50,
    y: 50,
    mascot: Assets.illustrations.slime,
  },
  {
    caseId: 'case3',
    label: 'Логово мусорного тролля',
    shortLabel: 'Логово тролля',
    description: 'Тролль боится порядка. Собирай улики и возвращай лесу чистоту.',
    x: 80,
    y: 50,
    mascot: Assets.illustrations.boss,
  },
]
