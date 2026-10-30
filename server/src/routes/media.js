import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(UPLOADS_ROOT)) {
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const slug = req.params.slug || 'general';
    const eventDir = path.join(UPLOADS_ROOT, slug);
    if (!fs.existsSync(eventDir)) {
      fs.mkdirSync(eventDir, { recursive: true });
    }
    cb(null, eventDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E6)}`;
    cb(null, `${safeBase}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimePrefixes = ['image/', 'video/'];
  const isAllowed = allowedMimePrefixes.some(prefix => file.mimetype.startsWith(prefix));
  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se admiten imágenes y videos.`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 150 * 1024 * 1024 // 150MB max per file (supports high-res videos)
  }
});

const router = express.Router({ mergeParams: true });

// GET /api/events/:slug/media - Get all media for an event
router.get('/', (req, res) => {
  const { slug } = req.params;
  const includeUnapproved = req.query.admin === 'true';

  const event = db.getEventBySlug(slug);
  if (!event) {
    return res.status(404).json({ success: false, error: 'Evento no encontrado' });
  }

  const media = db.getMediaByEventSlug(slug, includeUnapproved);
  res.json({ success: true, count: media.length, media });
});

// POST /api/events/:slug/upload - Upload photos and videos
router.post('/upload', upload.array('files', 20), (req, res) => {
  const { slug } = req.params;
  const event = db.getEventBySlug(slug);

  if (!event) {
    return res.status(404).json({ success: false, error: 'Evento no encontrado' });
  }

  if (event.uploadsPaused) {
    for (const file of (req.files || [])) {
      try { fs.unlinkSync(file.path); } catch (e) {}
    }
    return res.status(403).json({
      success: false,
      error: 'La subida de nuevas fotos y videos para este evento se encuentra pausada por el anfitrión.'
    });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, error: 'No se recibieron archivos para subir' });
  }

  const { uploaderName, caption } = req.body;
  const cleanUploaderName = (uploaderName || '').trim();
  if (!cleanUploaderName) {
    // Clean up uploaded files if name was missing
    for (const file of req.files) {
      try { fs.unlinkSync(file.path); } catch (e) {}
    }
    return res.status(400).json({ success: false, error: 'Por favor ingresa tu nombre o apodo para compartir tus recuerdos' });
  }

  const initialStatus = event.requireModeration ? 'pending' : 'approved';

  const savedItems = [];

  for (const file of req.files) {
    const isVideo = file.mimetype.startsWith('video/');

    if (isVideo && !event.allowVideos) {
      // Remove file if videos not allowed
      try { fs.unlinkSync(file.path); } catch (e) {}
      continue;
    }

    const publicUrl = `/uploads/${slug}/${file.filename}`;

    const mediaItem = db.addMediaItem({
      eventId: event.id,
      eventSlug: event.slug,
      filename: file.filename,
      originalName: file.originalname,
      url: publicUrl,
      isExternal: false,
      mimeType: file.mimetype,
      isVideo,
      size: file.size,
      uploaderName: cleanUploaderName,
      caption: (caption && caption.trim()) || '',
      likes: 0,
      status: initialStatus
    });

    savedItems.push(mediaItem);
  }

  // Broadcast to Socket.IO room for real-time presentation update
  const io = req.app.get('io');
  if (io && savedItems.length > 0) {
    // Only broadcast approved items to public slideshow/gallery
    const broadcastable = savedItems.filter(item => item.status === 'approved');
    if (broadcastable.length > 0) {
      io.to(`event:${slug}`).emit('new_media', {
        items: broadcastable,
        uploader: cleanUploaderName
      });
    }

    // Always notify admin room of all uploads (even pending)
    io.to(`admin:${slug}`).emit('admin_new_uploads', {
      items: savedItems
    });
  }

  res.status(201).json({
    success: true,
    message: `${savedItems.length} archivo(s) subido(s) con éxito`,
    items: savedItems,
    pendingModeration: event.requireModeration
  });
});

// POST /api/events/:slug/media/:id/like - Like a photo or video
router.post('/:id/like', (req, res) => {
  const { id } = req.params;
  const { slug } = req.params;

  const item = db.incrementLike(id);
  if (!item) {
    return res.status(404).json({ success: false, error: 'Elemento no encontrado' });
  }

  const io = req.app.get('io');
  if (io) {
    io.to(`event:${slug}`).emit('media_liked', { id, likes: item.likes });
  }

  res.json({ success: true, likes: item.likes });
});

// PATCH /api/events/:slug/media/:id/status - Host/Moderator/SuperAdmin moderates status (approved, hidden, pending)
router.patch('/:id/status', (req, res) => {
  const { id, slug } = req.params;
  const { status, passcode } = req.body;

  const access = db.verifyEventAccess(slug, passcode);
  if (!access) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  if (!['approved', 'hidden', 'pending'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Estado no válido' });
  }

  const updated = db.updateMediaItem(id, { status });
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Elemento no encontrado' });
  }

  const io = req.app.get('io');
  if (io) {
    io.to(`event:${slug}`).emit('media_status_changed', { id, status });
  }

  res.json({ success: true, item: updated });
});

// DELETE /api/events/:slug/media/:id - Host/Moderator/SuperAdmin deletes media item
router.delete('/:id', (req, res) => {
  const { id, slug } = req.params;
  const { passcode } = req.body;

  const access = db.verifyEventAccess(slug, passcode);
  if (!access) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  const deleted = db.deleteMediaItem(id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Elemento no encontrado' });
  }

  // Delete physical file from disk if local
  if (!deleted.isExternal && deleted.filename) {
    const filePath = path.join(UPLOADS_ROOT, slug, deleted.filename);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { console.error('Error unlinking file:', e); }
    }
  }

  const io = req.app.get('io');
  if (io) {
    io.to(`event:${slug}`).emit('media_deleted', { id });
  }

  res.json({ success: true, message: 'Archivo eliminado' });
});

export default router;
