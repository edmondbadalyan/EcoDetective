import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getTaskById } from '../../game/content'
import type { ClueTask } from '../../game/types'
import { getTaskAgeContent } from '../../game/ageContent'
import { ApiError, createSubmission, uploadEvidence } from '../../lib/api'
import { getAgeMode } from '../../lib/ageMode'
import { Assets } from '../../assets'
import { PageShell } from '../../ui/PageShell'
import { Badge, Button, Card, CardInner, MascotBubble } from '../../ui/Ui'

const AUDIO_MIME_TYPES = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
const MAX_EVIDENCE_MB = 25
const MAX_EVIDENCE_BYTES = MAX_EVIDENCE_MB * 1024 * 1024

function getAudioMimeType() {
  if (typeof MediaRecorder === 'undefined') return undefined
  return AUDIO_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type))
}

function getAudioExtension(type: string) {
  if (type.includes('mp4')) return 'm4a'
  if (type.includes('ogg')) return 'ogg'
  return 'webm'
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

function getEvidenceCopy(task: ClueTask) {
  if (task.requiresPhoto) {
    return {
      intro: 'Добавь фото результата, чтобы взрослый смог проверить задание.',
      mascot: 'Сделай снимок рисунка или результата. Если игра открыта на компьютере, можно выбрать файл с устройства.',
      photoLabel: 'Фото результата',
      photoTitle: 'Добавить фото',
      photoHint: 'Это нужно для выполнения задания',
      notePlaceholder: 'Например: что нарисовал, что хотел показать, почему это важная улика.',
      submitBlocked: 'Добавь фото, чтобы отправить',
    }
  }

  if (task.allowsAudio) {
    return {
      intro: 'Можно записать голос или оставить заметку, чтобы взрослый понял, что задание выполнено.',
      mascot: 'Выбери удобный способ: записать голос, выбрать аудиофайл или написать короткую заметку.',
      photoLabel: 'Фото улики',
      photoTitle: 'Добавить фото',
      photoHint: 'Фото здесь не требуется',
      notePlaceholder: 'Например: что прочитал вслух и как звучала фраза.',
      submitBlocked: 'Отправить взрослому',
    }
  }

  return {
    intro: 'Опиши, что нашёл, или добавь фото по желанию. Взрослый подтвердит выполнение.',
    mascot: 'Выбери удобный способ: показать находку взрослому, добавить фото или написать заметку.',
    photoLabel: 'Фото находки',
    photoTitle: 'Добавить фото по желанию',
    photoHint: 'Можно пропустить, если взрослый видел результат',
    notePlaceholder: 'Например: что нашёл, где это было, чем предмет похож на улику.',
    submitBlocked: 'Отправить взрослому',
  }
}

function getAgeNotePlaceholder(task: ClueTask) {
  const mode = getAgeMode()
  if (mode === 'younger') {
    if (task.type === 'draw') return 'Что ты нарисовал? Кто помогал?'
    if (task.type === 'read') return 'Какие слова ты прочитал?'
    return 'Что ты нашёл? Где это было?'
  }

  if (task.type === 'draw') return 'Почему рисунок помогает раскрыть дело? Какая деталь главная?'
  if (task.type === 'read') return 'Почему эта фраза важна для расследования?'
  return 'Почему это доказывает твою версию? Опиши связь с делом.'
}

export function EvidenceUploadPage() {
  const params = useParams()
  const task = useMemo(() => getTaskById(params.taskId ?? ''), [params.taskId])
  const nav = useNavigate()

  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [audio, setAudio] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  const recordingStreamRef = useRef<MediaStream | null>(null)
  const recordingTimerRef = useRef<number | null>(null)

  const canRecordAudio =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined'

  useEffect(() => {
    if (!photo) {
      setPhotoPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(photo)
    setPhotoPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  useEffect(() => {
    if (!audio) {
      setAudioPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(audio)
    setAudioPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [audio])

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current)
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  if (!task) {
    return (
      <PageShell right={<Button to="/kid">К делам</Button>}>
        <Card>
          <CardInner>Улика не найдена.</CardInner>
        </Card>
      </PageShell>
    )
  }

  const taskId = task.id
  const needsPhoto = task.requiresPhoto
  const canAudio = task.allowsAudio
  const evidenceCopy = getEvidenceCopy(task)
  const ageContent = getTaskAgeContent(task, getAgeMode())
  const showPhotoCapture = needsPhoto || !canAudio
  const canSubmit = !busy && !isRecording && (!needsPhoto || !!photo)

  function setEvidenceFile(kind: 'photo' | 'audio', file: File | null) {
    if (file && file.size > MAX_EVIDENCE_BYTES) {
      if (kind === 'photo') setPhoto(null)
      if (kind === 'audio') setAudio(null)
      setError(`Файл слишком большой. Максимум ${MAX_EVIDENCE_MB} МБ.`)
      return
    }

    setError(null)
    if (kind === 'photo') setPhoto(file)
    if (kind === 'audio') setAudio(file)
  }

  async function startAudioRecording() {
    if (!canRecordAudio) {
      setError('Запись голоса недоступна в этом браузере. Можно выбрать готовый аудиофайл.')
      return
    }

    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getAudioMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)

      recordingChunksRef.current = []
      recordingStreamRef.current = stream
      recorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data)
      }

      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || 'audio/webm'
        const blob = new Blob(recordingChunksRef.current, { type })
        if (blob.size > 0) {
          setEvidenceFile('audio', new File([blob], `voice-evidence-${Date.now()}.${getAudioExtension(type)}`, { type }))
        }
        recordingStreamRef.current?.getTracks().forEach((track) => track.stop())
        recordingStreamRef.current = null
        recorderRef.current = null
        recordingChunksRef.current = []
        if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
        setIsRecording(false)
      }

      recorder.onerror = () => {
        setError('Не получилось записать голос. Проверь разрешение микрофона или выбери аудиофайл.')
      }

      recorder.start()
      setAudio(null)
      setIsRecording(true)
      setRecordingSeconds(0)
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((seconds) => seconds + 1)
      }, 1000)
    } catch {
      setError('Микрофон не открылся. Разреши доступ или выбери готовую запись.')
    }
  }

  function stopAudioRecording() {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    }
  }

  async function onSubmit() {
    setBusy(true)
    setError(null)
    try {
      const [photoUp, audioUp] = await Promise.all([
        photo ? uploadEvidence(photo) : Promise.resolve(null),
        audio ? uploadEvidence(audio) : Promise.resolve(null),
      ])

      const submission = await createSubmission({
        taskId,
        note: note.trim() ? note.trim() : undefined,
        photoUrl: photoUp?.url ?? undefined,
        audioUrl: audioUp?.url ?? undefined,
      })

      nav(`/kid/submitted/${submission.id}`)
    } catch (e: unknown) {
      if (e instanceof ApiError && e.status === 409 && e.bodyText) {
        try {
          const parsed = JSON.parse(e.bodyText) as { existingSubmissionId?: string; submission?: { id?: string } }
          const existingId = parsed.existingSubmissionId ?? parsed.submission?.id
          if (existingId) {
            nav(`/kid/submitted/${existingId}`)
            return
          }
        } catch {
          // ignore JSON parse errors and fall through to generic message
        }
      }
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell tone={task.caseId as 'case1' | 'case2' | 'case3'} right={<Button to={`/kid/task/${taskId}`}>Назад</Button>}>
      <div className="grid" style={{ gap: 16 }}>
        <Card variant="hero">
          <CardInner>
            <div className="grid" style={{ gap: 10 }}>
              <h1 className="h1">Доказательство</h1>
              <p className="p">{evidenceCopy.intro}</p>
              <div className="hint">{ageContent.parentCheckHint}</div>
              <div className="btnRow">
                {showPhotoCapture ? (
                  <Badge variant={needsPhoto ? 'pending' : 'approved'}>
                    {needsPhoto ? 'Фото обязательно' : 'Фото по желанию'}
                  </Badge>
                ) : null}
                {canAudio ? <Badge variant="magic">Можно аудио</Badge> : null}
                <Badge variant="approved">Заметка доступна</Badge>
              </div>
              {error ? <Badge variant="rejected">{error}</Badge> : null}
            </div>
          </CardInner>
        </Card>

        <MascotBubble imageSrc={Assets.illustrations.chicken}>
          {evidenceCopy.mascot}
        </MascotBubble>

        <Card variant="soft">
          <CardInner>
            <div className="grid" style={{ gap: 14 }}>
              {showPhotoCapture ? (
                <div className="field uploadZone capturePanel">
                  <div className="label">{evidenceCopy.photoLabel}</div>
                  <input
                    id="photoEvidence"
                    className="captureInput"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      setEvidenceFile('photo', e.target.files?.[0] ?? null)
                    }}
                  />
                  <label className={`captureTile ${photo ? 'captureTileReady' : ''}`} htmlFor="photoEvidence">
                    <span className="captureKicker">Фото</span>
                    <span className="captureTitle">{photo ? 'Фото готово' : evidenceCopy.photoTitle}</span>
                    <span className="captureHint">{evidenceCopy.photoHint}</span>
                  </label>
                  {photoPreviewUrl ? (
                    <div className="evidencePreview">
                      <img src={photoPreviewUrl} alt="Предпросмотр доказательства" />
                      <div className="evidencePreviewMeta">
                        <span>{photo?.name}</span>
                        <button className="miniAction" type="button" onClick={() => setPhoto(null)}>
                          Убрать фото
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {canAudio ? (
                <div className="field uploadZone capturePanel">
                  <div className="label">Голосовое доказательство</div>
                  <input
                    id="audioEvidence"
                    className="captureInput"
                    type="file"
                    accept="audio/*"
                    capture="user"
                    onChange={(e) => {
                      setEvidenceFile('audio', e.target.files?.[0] ?? null)
                    }}
                  />
                  <div className="captureGrid">
                    <button
                      className={`captureTile ${isRecording ? 'captureTileRecording' : audio ? 'captureTileReady' : ''}`}
                      type="button"
                      onClick={isRecording ? stopAudioRecording : startAudioRecording}
                    >
                      <span className="captureKicker">{isRecording ? 'Идёт запись' : 'Микрофон'}</span>
                      <span className="captureTitle">{isRecording ? `Остановить ${formatDuration(recordingSeconds)}` : audio ? 'Запись готова' : 'Записать голос'}</span>
                      <span className="captureHint">Расскажи, что нашёл или прочитал</span>
                    </button>
                    <label className="captureTile captureTileAlt" htmlFor="audioEvidence">
                      <span className="captureKicker">Файл</span>
                      <span className="captureTitle">Выбрать аудио</span>
                      <span className="captureHint">Если браузер не дал записать внутри игры</span>
                    </label>
                  </div>
                  {audioPreviewUrl ? (
                    <div className="evidencePreview">
                      <audio controls src={audioPreviewUrl} />
                      <div className="evidencePreviewMeta">
                        <span>{audio?.name}</span>
                        <button className="miniAction" type="button" onClick={() => setAudio(null)}>
                          Убрать аудио
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <div className="hint">
                    {canRecordAudio
                      ? 'Если встроенная запись не откроется, выбери готовый аудиофайл.'
                      : 'В этом браузере встроенная запись недоступна, но можно выбрать аудиофайл.'}
                  </div>
                </div>
              ) : null}

              <div className="field notePanel">
                <div className="label">Заметка ребёнка</div>
                <textarea
                  className="textarea"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={getAgeNotePlaceholder(task)}
                />
                <div className="hint">{ageContent.parentCheckHint}</div>
              </div>

              <div className="btnRow mobileSubmitBar">
                <Button variant="primary" onClick={onSubmit} disabled={!canSubmit}>
                  {busy ? 'Отправляю…' : canSubmit ? 'Отправить взрослому' : evidenceCopy.submitBlocked}
                </Button>
                <Button to={`/kid/task/${taskId}`}>Вернуться к улице</Button>
              </div>
            </div>
          </CardInner>
        </Card>
      </div>
    </PageShell>
  )
}

