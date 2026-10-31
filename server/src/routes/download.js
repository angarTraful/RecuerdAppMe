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

// GET /api/download/:slug/messages - Download dedicated text guestbook of all messages
router.get('/:slug/messages', (req, res) => {
  const { slug } = req.params;
  const event = db.getEventBySlug(slug);

  if (!event) {
    return res.status(404).json({ success: false, error: 'Evento no encontrado' });
  }

  const mediaList = db.getMediaByEventSlug(slug, true);

  // Filter items that have dedications/messages, plus list all uploaders
  const withMessages = mediaList.filter((m) => (m.caption || '').trim().length > 0);
  const totalUploads = mediaList.length;
  const uniqueAuthors = new Set(mediaList.map((m) => m.uploaderName).filter(Boolean));

  let text = `================================================================================\n`;
  text += `                   LIBRO DE RECUERDOS Y DEDICATORIAS\n`;
  text += `                         RecuerdAppMe Eventos\n`;
  text += `================================================================================\n\n`;
  text += `Evento: ${event.name}\n`;
  text += `Fecha: ${event.date}\n`;
  text += `Total de Recuerdos: ${totalUploads} (Fotos y Videos)\n`;
  text += `Invitados participantes: ${uniqueAuthors.size}\n`;
  text += `Mensajes y dedicatorias recibidas: ${withMessages.length}\n`;
  text += `Fecha de exportación: ${new Date().toLocaleString('es-AR')}\n\n`;
  text += `================================================================================\n`;
  text += `                            DEDICATORIAS DE LOS INVITADOS\n`;
  text += `================================================================================\n\n`;

  if (withMessages.length === 0) {
    text += `(Aún no se han registrado mensajes con texto para este evento)\n\n`;
  } else {
    withMessages.forEach((m, idx) => {
      const dateFormatted = new Date(m.createdAt).toLocaleString('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short'
      });
      const likesStr = m.likes ? ` • ${m.likes} Me Gusta ❤️` : '';
      text += `[#${idx + 1}] De: ${m.uploaderName} (${dateFormatted}${likesStr})\n`;
      text += `"${m.caption.trim()}"\n`;
      text += `Adjunto: ${m.isVideo ? 'Video' : 'Foto'} (${m.originalName || m.filename})\n`;
      text += `--------------------------------------------------------------------------------\n\n`;
    });
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
