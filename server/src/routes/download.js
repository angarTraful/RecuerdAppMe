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

  // Also add a readable TXT or JSON with dedications and guestbook
  const dedications = db.getDedicationsByEventSlug(slug);

  const guestbookTxt = `=== LIBRO DE RECUERDOS Y DEDICATORIAS ===\n` +
    `Evento: ${event.name}\nFecha: ${event.date}\nTotal de recuerdos multimedia: ${mediaList.length}\nTotal de saludos y dedicatorias: ${dedications.length}\n\n` +
    `--- SALUDOS Y DEDICATORIAS ---\n` +
    (dedications.length > 0
      ? dedications.map(d => `[${d.createdAt}] ${d.author}: "${d.message}"`).join('\n\n')
      : '(No se registraron saludos escritos directos)') +
    `\n\n--- ARCHIVOS MULTIMEDIA SUBIDOS ---\n` +
    mediaList.map(m => `[${m.createdAt}] ${m.uploaderName} ${m.tags?.length ? `[${m.tags.join(' ')}]` : ''} - ${m.isVideo ? 'Video' : 'Foto'}: ${m.filename || m.originalName}`).join('\n');

  archive.append(guestbookTxt, { name: 'DEDICATORIAS_Y_SALUDOS.txt' });
  archive.append(JSON.stringify({ dedications, media: mediaList }, null, 2), { name: 'recuerdos_metadata.json' });

  await archive.finalize();
});

// GET /api/download/:slug/messages - Download dedicated text guestbook of all messages
router.get('/:slug/messages', (req, res) => {
  const { slug } = req.params;
  const event = db.getEventBySlug(slug);

  if (!event) {
    return res.status(404).json({ success: false, error: 'Evento no encontrado' });
  }

  const dedications = db.getDedicationsByEventSlug(slug);
  const mediaList = db.getMediaByEventSlug(slug, true);

  const totalUploads = mediaList.length;
  const uniqueAuthors = new Set([
    ...mediaList.map((m) => m.uploaderName),
    ...dedications.map((d) => d.author)
  ].filter(Boolean));

  let text = `================================================================================\n`;
  text += `                   LIBRO DE RECUERDOS Y DEDICATORIAS\n`;
  text += `                         RecuerdAppMe Eventos\n`;
  text += `================================================================================\n\n`;
  text += `Evento: ${event.name}\n`;
  text += `Fecha: ${event.date}\n`;
  text += `Total de Recuerdos: ${totalUploads} (Fotos y Videos)\n`;
  text += `Total de Saludos y Dedicatorias: ${dedications.length}\n`;
  text += `Invitados participantes: ${uniqueAuthors.size}\n`;
  text += `Fecha de exportación: ${new Date().toLocaleString('es-AR')}\n\n`;
  text += `================================================================================\n`;
  text += `                    1. DEDICATORIAS Y SALUDOS DE LOS INVITADOS\n`;
  text += `================================================================================\n\n`;

  if (dedications.length === 0) {
    text += `(Aún no se han registrado mensajes de saludo directos para este evento)\n\n`;
  } else {
    dedications.forEach((d, idx) => {
      const dateFormatted = new Date(d.createdAt).toLocaleString('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short'
      });
      text += `[#${idx + 1}] De: ${d.author} (${dateFormatted})\n`;
      text += `"${d.message.trim()}"\n`;
      text += `--------------------------------------------------------------------------------\n\n`;
    });
  }

  // Also extract photos that had hashtags or captions (without repeating the same message 15 times)
  const photosWithTags = mediaList.filter((m) => (m.tags && m.tags.length > 0) || (m.caption || '').trim().length > 0);
  if (photosWithTags.length > 0) {
    text += `\n================================================================================\n`;
    text += `                 2. HASHTAGS Y EPÍGRAFES DE FOTOS / VIDEOS\n`;
    text += `================================================================================\n\n`;

    // Deduplicate by author + tags + caption
    const seen = new Set();
    photosWithTags.forEach((m) => {
      const key = `${m.uploaderName}|${(m.tags || []).join(',')}|${m.caption || ''}`;
      if (seen.has(key)) return;
      seen.add(key);

      const tagsStr = m.tags && m.tags.length > 0 ? ` [${m.tags.join(' ')}]` : '';
      const captionStr = m.caption ? ` - "${m.caption.trim()}"` : '';
      text += `• ${m.uploaderName}${tagsStr}${captionStr}\n`;
    });
    text += `\n`;
  }

  text += `\n================================================================================\n`;
  text += `                ¡Gracias a todos los invitados por ser parte! ✨\n`;
  text += `                      Generado con amor por RecuerdAppMe\n`;
  text += `================================================================================\n`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${slug}-dedicatorias.txt"`);
  res.send(text);
});

export default router;
