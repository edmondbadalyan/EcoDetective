export type CaseId = 'case1' | 'case2' | 'case3'

export type AgeMode = 'younger' | 'older'

export type TaskType = 'find' | 'draw' | 'read'

export type LearningSkill =
  | 'Наблюдение'
  | 'Чтение'
  | 'Творчество'
  | 'Сортировка'
  | 'Забота о природе'
  | 'Исследование'

export type AgeContent = {
  story?: string
  instructions?: string
  proofGuidance?: string
  mascotTip?: string
  reflectionQuestion?: string
  parentCheckHint?: string
  expectedMinutes?: number
}

export type TaskEmotion = {
  mystery: string
  hypothesis: string
  proofGoal: string
  worldChange: string
  albumBlurb: string
}

export type ClueTask = {
  id: string
  caseId: CaseId
  order: number
  title: string
  story: string
  instructions: string
  imageSrc: string
  type: TaskType
  expectedMinutes: number
  requiresPhoto: boolean
  allowsAudio: boolean
  reward: {
    tokens: number
    sticker: string
  }
  skill?: LearningSkill
  ecoFact?: string
  ageHint?: {
    younger: string
    older: string
  }
  emotion?: TaskEmotion
  ageContent?: Partial<Record<AgeMode, AgeContent>>
}

export type Suspect = {
  id: string
  caseId: CaseId
  name: string
  role: string
  alibi: string
  motive: string
  portraitSrc: string
  isCulprit: boolean
  isRedHerring?: boolean
  reveal: string
}

export type EvidenceEffect = 'implicates' | 'eliminates' | 'red_herring'

export type EvidenceLink = {
  taskId: string
  suspectId: string
  effect: EvidenceEffect
  reason: string
  pinLabel: string
}

export type GameCase = {
  id: CaseId
  number: number
  skillLabel: string
  shortTitle: string
  title: string
  tagline: string
  intro: string
  twist: string
  suspects: Suspect[]
}

export type CaseFinaleOption = {
  id: string
  title: string
  description: string
  isBest: boolean
  feedback: string
  suspectId?: string
  portraitSrc?: string
}

export type CaseFinale = {
  caseId: CaseId
  question: string
  learningSummary: string
  evidenceChain: string[]
  worldChange: string
  twistReveal?: string
  options: CaseFinaleOption[]
  ageContent?: Partial<
    Record<
      AgeMode,
      {
        question: string
        learningSummary: string
        options?: CaseFinaleOption[]
      }
    >
  >
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected'

export type Submission = {
  id: string
  familyId?: string
  taskId: string
  createdAt: string
  status: SubmissionStatus
  note?: string
  photoUrl?: string
  audioUrl?: string
  parentFeedback?: string
}

