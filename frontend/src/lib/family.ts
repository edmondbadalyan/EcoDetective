const FAMILY_ID_KEY = 'eco_family_id'

function makeFamilyId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `family-${crypto.randomUUID()}`
  }
  return `family-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function getFamilyId() {
  const existing = localStorage.getItem(FAMILY_ID_KEY)
  if (existing) return existing

  const next = makeFamilyId()
  localStorage.setItem(FAMILY_ID_KEY, next)
  return next
}

export function resetFamilyId() {
  const next = makeFamilyId()
  localStorage.setItem(FAMILY_ID_KEY, next)
  return next
}

export function getFamilyShortCode() {
  return getFamilyId().replace(/^family-/, '').slice(0, 8).toUpperCase()
}
