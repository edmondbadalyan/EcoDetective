import type { AgeMode } from '../game/types'

export type { AgeMode }

const AGE_MODE_KEY = 'eco_age_mode'

export function getAgeMode(): AgeMode {
  if (typeof localStorage === 'undefined') return 'younger'
  return localStorage.getItem(AGE_MODE_KEY) === 'older' ? 'older' : 'younger'
}

export function setAgeMode(mode: AgeMode) {
  localStorage.setItem(AGE_MODE_KEY, mode)
}

export function getAgeModeLabel(mode: AgeMode) {
  return mode === 'older' ? '9-11 лет' : '6-8 лет'
}
