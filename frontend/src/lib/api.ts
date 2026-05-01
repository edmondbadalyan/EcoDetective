import type { Submission, SubmissionStatus } from '../game/types'
import { getFamilyId } from './family'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:5174'

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('x-family-id', getFamilyId())
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? `: ${text}` : ''}`)
  }
  return (await res.json()) as T
}

export async function uploadEvidence(file: File): Promise<{ url: string }> {
  const form = new FormData()
  form.append('file', file)
  return await http('/api/uploads', { method: 'POST', body: form })
}

export async function createSubmission(input: {
  taskId: string
  note?: string
  photoUrl?: string
  audioUrl?: string
}): Promise<Submission> {
  return await http('/api/submissions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export async function getSubmission(submissionId: string): Promise<Submission> {
  return await http(`/api/submissions/${encodeURIComponent(submissionId)}`)
}

export async function listSubmissions(params?: {
  status?: SubmissionStatus
  taskId?: string
}): Promise<Submission[]> {
  const q = new URLSearchParams()
  if (params?.status) q.set('status', params.status)
  if (params?.taskId) q.set('taskId', params.taskId)
  const suffix = q.toString() ? `?${q.toString()}` : ''
  return await http(`/api/submissions${suffix}`)
}

export async function reviewSubmission(
  submissionId: string,
  action: 'approve' | 'reject',
  input?: { parentFeedback?: string },
): Promise<Submission> {
  return await http(`/api/submissions/${encodeURIComponent(submissionId)}/${action}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input ?? {}),
  })
}

