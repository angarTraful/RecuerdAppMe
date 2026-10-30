import express from 'express';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

const router = express.Router();

// GET /api/events/:slug/download-all
router.get('/:slug/download-all', async (req, res) => {
  const { slug } = req.params;
  const event = db.getEventBySlug(slug);

  if (!event) {
    return res.status(404).json({ success: false, error: 'Evento no encontrado' });
  }

  const mediaList = db.getMediaByEventSlug(slug, true);
  const eventDir = path.join(UPLOADS_ROOT, slug);

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${slug}-recuerdos.zip"`);

  const archive = archiver('zip', {
    zlib: { level: 5 } // balance between speed and compression
  });

  archive.on('error', (err) => {
    console.error('Archiver error:', err);
    if (!res.headersSent) {
      res.status(500).send('Error creando el archivo ZIP');
    }
  });

  archive.pipe(res);

  // Add all local media files
  for (const item of mediaList) {
    if (!item.isExternal && item.filename) {
      const filePath = path.join(eventDir, item.filename);
      if (fs.existsSync(filePath)) {
        const zipFileName = `${item.uploaderName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${item.filename}`;
        archive.file(filePath, { name: zipFileName });
      }
    }
  }

  // Also add a readable TXT or JSON with captions and guest dedications
  const guestbook = mediaList.map(m => ({
    autor: m.uploaderName,
    mensaje: m.caption || '(Sin dedicatoria)',
    archivo: m.filename || m.originalName,
    tipo: m.isVideo ? 'Video' : 'Foto',
    fecha: m.createdAt
  }));

  const guestbookTxt = `=== LIBRO DE RECUERDOS Y DEDICATORIAS ===\n` +
    `Evento: ${event.name}\nFecha: ${event.date}\nTotal de recuerdos: ${mediaList.length}\n\n` +
    guestbook.map(g => `[${g.fecha}] ${g.autor}: "${g.mensaje}" (${g.archivo})`).join('\n\n');

  archive.append(guestbookTxt, { name: 'DEDICATORIAS_DE_INVITADOS.txt' });
  archive.append(JSON.stringify(guestbook, null, 2), { name: 'recuerdos_metadata.json' });

  await archive.finalize();
});

export default router;
