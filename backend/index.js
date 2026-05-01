const path = require('path')
const fs = require('fs')
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const Database = require('better-sqlite3')
const { z } = require('zod')
const crypto = require('crypto')

const PORT = process.env.PORT ? Number(process.env.PORT) : 5174
const PUBLIC_BASE = process.env.PUBLIC_BASE ?? `http://localhost:${PORT}`
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024

const ROOT = __dirname
const UPLOADS_DIR = path.join(ROOT, 'uploads')
const DB_PATH = path.join(ROOT, 'data.db')

fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    familyId TEXT NOT NULL DEFAULT 'demo-family',
    taskId TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    status TEXT NOT NULL,
    note TEXT,
    photoUrl TEXT,
    audioUrl TEXT,
    parentFeedback TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
  CREATE INDEX IF NOT EXISTS idx_submissions_taskId ON submissions(taskId);
`)

const columns = db.prepare(`PRAGMA table_info(submissions)`).all().map((column) => column.name)
if (!columns.includes('familyId')) {
  db.exec(`
    ALTER TABLE submissions ADD COLUMN familyId TEXT NOT NULL DEFAULT 'demo-family';
  `)
}
db.exec(`CREATE INDEX IF NOT EXISTS idx_submissions_familyId ON submissions(familyId);`)

const app = express()
app.use(cors({ origin: true }))
app.use(express.json({ limit: '1mb' }))
app.use('/uploads', express.static(UPLOADS_DIR))

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '')
    cb(null, `${crypto.randomUUID()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES },
})

app.get('/api/health', (_req, res) => res.json({ ok: true }))

function getFamilyId(req) {
  const raw = req.get('x-family-id') || req.query.familyId || 'demo-family'
  return String(raw).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) || 'demo-family'
}

app.post('/api/uploads', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).send('file is too large')
      return res.status(400).send(err.message || 'upload failed')
    }

    if (!req.file) return res.status(400).send('file is required')
    const url = `${PUBLIC_BASE}/uploads/${req.file.filename}`
    return res.json({ url })
  })
})

const CreateSubmission = z.object({
  taskId: z.string().min(1),
  note: z.string().max(2000).optional(),
  photoUrl: z.string().url().optional(),
  audioUrl: z.string().url().optional(),
})

app.post('/api/submissions', (req, res) => {
  const parsed = CreateSubmission.safeParse(req.body)
  if (!parsed.success) return res.status(400).json(parsed.error.format())

  const id = crypto.randomUUID()
  const familyId = getFamilyId(req)
  const createdAt = new Date().toISOString()
  const status = 'pending'

  const stmt = db.prepare(`
    INSERT INTO submissions (id, familyId, taskId, createdAt, status, note, photoUrl, audioUrl, parentFeedback)
    VALUES (@id, @familyId, @taskId, @createdAt, @status, @note, @photoUrl, @audioUrl, NULL)
  `)
  stmt.run({
    id,
    familyId,
    taskId: parsed.data.taskId,
    createdAt,
    status,
    note: parsed.data.note ?? null,
    photoUrl: parsed.data.photoUrl ?? null,
    audioUrl: parsed.data.audioUrl ?? null,
  })

  const row = db.prepare(`SELECT * FROM submissions WHERE id = ? AND familyId = ?`).get(id, familyId)
  return res.json(row)
})

app.get('/api/submissions', (req, res) => {
  const familyId = getFamilyId(req)
  const status = typeof req.query.status === 'string' ? req.query.status : undefined
  const taskId = typeof req.query.taskId === 'string' ? req.query.taskId : undefined

  const where = ['familyId = @familyId']
  const params = { familyId }
  if (status) {
    where.push('status = @status')
    params.status = status
  }
  if (taskId) {
    where.push('taskId = @taskId')
    params.taskId = taskId
  }

  const sql = `SELECT * FROM submissions ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY createdAt DESC`
  const rows = db.prepare(sql).all(params)
  return res.json(rows)
})

app.get('/api/submissions/:id', (req, res) => {
  const row = db.prepare(`SELECT * FROM submissions WHERE id = ? AND familyId = ?`).get(req.params.id, getFamilyId(req))
  if (!row) return res.status(404).send('not found')
  return res.json(row)
})

const ReviewBody = z.object({
  parentFeedback: z.string().max(2000).optional(),
})

function setStatus(req, res, nextStatus) {
  const familyId = getFamilyId(req)
  const row = db.prepare(`SELECT * FROM submissions WHERE id = ? AND familyId = ?`).get(req.params.id, familyId)
  if (!row) return res.status(404).send('not found')

  const parsed = ReviewBody.safeParse(req.body ?? {})
  if (!parsed.success) return res.status(400).json(parsed.error.format())

  db.prepare(
    `UPDATE submissions SET status = @status, parentFeedback = @parentFeedback WHERE id = @id AND familyId = @familyId`,
  ).run({
    id: req.params.id,
    familyId,
    status: nextStatus,
    parentFeedback: parsed.data.parentFeedback ?? null,
  })

  const updated = db.prepare(`SELECT * FROM submissions WHERE id = ? AND familyId = ?`).get(req.params.id, familyId)
  return res.json(updated)
}

app.post('/api/submissions/:id/approve', (req, res) => setStatus(req, res, 'approved'))
app.post('/api/submissions/:id/reject', (req, res) => setStatus(req, res, 'rejected'))

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on ${PUBLIC_BASE}`)
})

