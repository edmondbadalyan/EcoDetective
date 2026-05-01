const KEY = 'eco_parent_authed'

export function isParentAuthed() {
  return localStorage.getItem(KEY) === '1'
}

export function setParentAuthed(v: boolean) {
  localStorage.setItem(KEY, v ? '1' : '0')
}

