import { Router } from 'express'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { uploadToR2, deleteFromR2, keyFromUrl } from '../lib/r2'
import { requireAuth, requireAdmin } from '../lib/auth'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    cb(null, allowed.includes(file.mimetype))
  },
})

/** POST /api/upload  — upload one image, returns { url } */
router.post(
  '/',
  requireAuth,
  requireAdmin,
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file or unsupported type (jpeg/png/webp/gif only)' })
        return
      }
      const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg'
      const key = `${randomUUID()}${ext}`
      const url = await uploadToR2(key, req.file.buffer, req.file.mimetype)
      res.json({ url })
    } catch (err) {
      next(err)
    }
  },
)

/** DELETE /api/upload  — body: { url }  — removes the object from R2 */
router.delete('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { url } = req.body as { url?: string }
    if (!url) {
      res.status(400).json({ error: 'Missing url' })
      return
    }
    const key = keyFromUrl(url)
    if (!key) {
      res.status(400).json({ error: 'URL does not belong to this R2 bucket' })
      return
    }
    await deleteFromR2(key)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
