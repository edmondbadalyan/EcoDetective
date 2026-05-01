import { CLUE_TASKS, getTasksForCase } from './content'
import type { CaseId, ClueTask, Submission } from './types'

export const TOKEN_GOAL = 50
export const TOKEN_GOAL_TITLE = 'Домик мудрой совы'

const OWL_HOUSE_STAGES = [
  { minTokens: 0, title: 'Поляна выбрана', description: 'Сова нашла место для будущего домика, но лес ещё ждёт первых улик.' },
  { minTokens: 10, title: 'Фундамент из добрых дел', description: 'Первые жетоны стали крепкой основой: домик начинает появляться.' },
  { minTokens: 22, title: 'Стены из настоящих улик', description: 'Каждая подтверждённая улика добавляет новую тёплую стену.' },
  { minTokens: 36, title: 'Крыша под звёздами', description: 'Домик уже защищает сову, а лес вокруг становится спокойнее.' },
  { minTokens: 50, title: 'Огонёк для всего леса', description: 'Домик мудрой совы светится: все жители знают, кто помог его восстановить.' },
]

export function latestByTask(submissions: Submission[]) {
  const map = new Map<string, Submission>()
  for (const submission of submissions) {
    const prev = map.get(submission.taskId)
    if (!prev || new Date(prev.createdAt).getTime() < new Date(submission.createdAt).getTime()) {
      map.set(submission.taskId, submission)
    }
  }
  return map
}

export function getApprovedTaskIds(submissions: Submission[]) {
  return new Set(Array.from(latestByTask(submissions).values()).filter((submission) => submission.status === 'approved').map((submission) => submission.taskId))
}

export function getTokenBalance(submissions: Submission[]) {
  const approvedTaskIds = getApprovedTaskIds(submissions)
  return CLUE_TASKS.reduce((sum, task) => (approvedTaskIds.has(task.id) ? sum + task.reward.tokens : sum), 0)
}

export function getOwlHouseStage(tokens: number) {
  return OWL_HOUSE_STAGES.reduce((current, stage) => (tokens >= stage.minTokens ? stage : current), OWL_HOUSE_STAGES[0])
}

export function getCaseProgress(caseId: CaseId, byTask: Map<string, Submission>) {
  const tasks = getTasksForCase(caseId)
  const approved = tasks.filter((task) => byTask.get(task.id)?.status === 'approved').length
  const nextTask = tasks.find((task) => byTask.get(task.id)?.status !== 'approved') ?? null
  const nextSubmission = nextTask ? byTask.get(nextTask.id) : undefined

  return {
    approved,
    total: tasks.length,
    nextTask,
    nextSubmission,
    complete: tasks.length > 0 && approved === tasks.length,
  }
}

export function getNextTaskInCase(caseId: CaseId, byTask: Map<string, Submission>, afterOrder = 0) {
  const tasks = getTasksForCase(caseId)
  return tasks.find((task) => task.order > afterOrder && byTask.get(task.id)?.status !== 'approved')
    ?? tasks.find((task) => byTask.get(task.id)?.status !== 'approved')
    ?? null
}

export function getQuickTask(byTask: Map<string, Submission>, excludeTaskId?: string) {
  return CLUE_TASKS
    .filter((task) => task.id !== excludeTaskId && byTask.get(task.id)?.status !== 'approved')
    .sort((a, b) => a.expectedMinutes - b.expectedMinutes || a.order - b.order)[0] ?? null
}

export function getSubmissionAction(task: ClueTask, submission?: Submission) {
  if (submission?.status === 'rejected') return { to: `/kid/task/${task.id}/evidence`, label: 'Исправить и отправить' }
  if (submission?.status === 'pending') return { to: `/kid/submitted/${submission.id}`, label: 'Проверить статус' }
  if (submission?.status === 'approved') return { to: `/kid/reward/${submission.id}`, label: 'Открыть награду' }
  return { to: `/kid/task/${task.id}`, label: 'Начать улику' }
}
