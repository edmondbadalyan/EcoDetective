export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

export function speakText(text: string) {
  if (!canSpeak()) return false

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ru-RU'
  utterance.rate = 0.92
  window.speechSynthesis.speak(utterance)
  return true
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel()
}
