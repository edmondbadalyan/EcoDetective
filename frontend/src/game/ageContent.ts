import type { AgeContent, AgeMode, ClueTask } from './types'

export type ResolvedAgeContent = Required<AgeContent>

function defaultProofGuidance(task: ClueTask, mode: AgeMode) {
  if (task.requiresPhoto) {
    return mode === 'younger'
      ? 'Сделай результат и попроси взрослого помочь сфотографировать его.'
      : 'Добавь фото результата и объясни, почему оно подтверждает выполнение.'
  }

  if (task.allowsAudio) {
    return mode === 'younger'
      ? 'Можно сказать ответ голосом или попросить взрослого помочь с заметкой.'
      : 'Запиши голос или заметку так, чтобы взрослый понял твою версию.'
  }

  return mode === 'younger'
    ? 'Покажи находку взрослому или напиши коротко, что ты сделал.'
    : 'Опиши находку и объясни, как она связана с расследованием.'
}

function defaultMascotTip(task: ClueTask, mode: AgeMode) {
  if (mode === 'younger') {
    if (task.requiresPhoto) return 'Можно попросить взрослого помочь с фото. Главное — показать результат.'
    if (task.allowsAudio) return 'Если сложно писать, расскажи голосом. Сыщик может говорить!'
    return 'Делай маленькими шагами: найди, покажи, расскажи взрослому.'
  }

  if (task.requiresPhoto) return 'Проверь, чтобы фото показывало главное доказательство.'
  if (task.allowsAudio) return 'Скажи не только ответ, но и почему ты так думаешь.'
  return 'Сравни улику с историей дела и попробуй объяснить свою версию.'
}

function defaultReflectionQuestion(task: ClueTask, mode: AgeMode) {
  if (mode === 'younger') {
    if (task.type === 'draw') return 'Что ты нарисовал и где здесь главная улика?'
    if (task.type === 'read') return 'Какие слова ты произнёс вслух?'
    return 'Что ты нашёл и какого это цвета или формы?'
  }

  if (task.type === 'draw') return 'Какая деталь рисунка доказывает твою версию?'
  if (task.type === 'read') return 'Почему эта фраза важна для расследования?'
  return 'Почему эта находка может быть настоящей уликой?'
}

function defaultParentCheckHint(task: ClueTask, mode: AgeMode) {
  if (mode === 'younger') {
    return task.requiresPhoto
      ? 'Взрослый проверит, что результат действительно сделан.'
      : 'Взрослый проверит, что ребёнок выполнил действие и может рассказать о нём.'
  }

  return 'Взрослый проверит не только выполнение, но и объяснение: почему это связано с делом.'
}

export function getTaskAgeContent(task: ClueTask, mode: AgeMode): ResolvedAgeContent {
  const content = task.ageContent?.[mode] ?? {}

  return {
    story: content.story ?? task.story,
    instructions: content.instructions ?? task.instructions,
    proofGuidance: content.proofGuidance ?? defaultProofGuidance(task, mode),
    mascotTip: content.mascotTip ?? defaultMascotTip(task, mode),
    reflectionQuestion: content.reflectionQuestion ?? defaultReflectionQuestion(task, mode),
    parentCheckHint: content.parentCheckHint ?? defaultParentCheckHint(task, mode),
    expectedMinutes: content.expectedMinutes ?? task.expectedMinutes,
  }
}
