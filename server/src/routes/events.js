import express from 'express';
import { db } from '../db.js';

const router = express.Router();

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes
}

// Preset themes library
export const THEME_PRESETS = {
  'elegant-gold': {
    preset: 'elegant-gold',
    name: 'Boda de Oro & Lujo',
    primaryColor: '#D4AF37',
    secondaryColor: '#E8D5B5',
    backgroundColor: '#0E1116',
    cardBackground: 'rgba(24, 28, 36, 0.82)',
    textColor: '#F8F9FA',
    accentColor: '#F59E0B',
    fontFamily: "'Playfair Display', serif",
    headingFont: "'Cinzel', serif",
    borderRadius: '16px',
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
    overlayOpacity: 0.65
  },
  'neon-party': {
    preset: 'neon-party',
    name: 'Fiesta Neón & Night Club',
    primaryColor: '#EC4899',
    secondaryColor: '#06B6D4',
    backgroundColor: '#09090B',
    cardBackground: 'rgba(24, 24, 27, 0.85)',
    textColor: '#FAFAFA',
    accentColor: '#8B5CF6',
    fontFamily: "'Inter', sans-serif",
    headingFont: "'Outfit', sans-serif",
    borderRadius: '16px',
    coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80',
    overlayOpacity: 0.75
  },
  'romantic-rose': {
    preset: 'romantic-rose',
    name: 'Romance Rosa & Floral',
    primaryColor: '#E11D48',
    secondaryColor: '#FDA4AF',
    backgroundColor: '#FFF1F2',
    cardBackground: 'rgba(255, 255, 255, 0.92)',
    textColor: '#1E293B',
    accentColor: '#F43F5E',
    fontFamily: "'Cormorant Garamond', serif",
    headingFont: "'Playfair Display', serif",
    borderRadius: '20px',
    coverImage: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1600&q=80',
    overlayOpacity: 0.5
  },
  'rustic-boho': {
    preset: 'rustic-boho',
    name: 'Boho Chic & Naturaleza',
    primaryColor: '#C27803',
    secondaryColor: '#A7F3D0',
    backgroundColor: '#1C1917',
    cardBackground: 'rgba(41, 37, 36, 0.85)',
    textColor: '#F5F5F4',
    accentColor: '#EAB308',
    fontFamily: "'Merriweather', serif",
    headingFont: "'Montserrat', sans-serif",
    borderRadius: '12px',
    coverImage: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1600&q=80',
    overlayOpacity: 0.6
  },
  'modern-clean': {
    preset: 'modern-clean',
    name: 'Minimalista & Moderno',
    primaryColor: '#6366F1',
    secondaryColor: '#A5B4FC',
    backgroundColor: '#0B0F19',
    cardBackground: 'rgba(17, 24, 39, 0.85)',
    textColor: '#F9FAFB',
    accentColor: '#38BDF8',
    fontFamily: "'Inter', sans-serif",
    headingFont: "'Outfit', sans-serif",
    borderRadius: '18px',
    coverImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1600&q=80',
    overlayOpacity: 0.7
  }
};

// GET /api/events - List all events
router.get('/', (req, res) => {
  const events = db.getAllEvents();
  res.json({ success: true, events });
});

// GET /api/events/presets - List theme presets
router.get('/presets/themes', (req, res) => {
  res.json({ success: true, presets: THEME_PRESETS });
});

// GET /api/events/:slug - Get single event details
router.get('/:slug', (req, res) => {
  const event = db.getEventBySlug(req.params.slug);
  if (!event) {
    return res.status(404).json({ success: false, error: 'Evento no encontrado' });
  }

  // Safe public object without passcode
  const { hostPasscode, ...publicEvent } = event;
  res.json({ success: true, event: publicEvent });
});

// POST /api/events - Create new event
router.post('/', (req, res) => {
  const {
    name,
    date,
    hostPasscode,
    welcomeMessage,
    instructions,
    allowVideos,
    requireModeration,
    themePreset,
    customTheme,
    customSlug
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'El nombre del evento es obligatorio' });
  }

  let baseSlug = customSlug ? slugify(customSlug) : slugify(name);
  if (!baseSlug) baseSlug = `evento-${Date.now().toString(36)}`;

  // Ensure unique slug
  let slug = baseSlug;
  let counter = 1;
  while (db.getEventBySlug(slug)) {
    slug = `${baseSlug}-${counter++}`;
  }

  // Determine theme
  const selectedPreset = THEME_PRESETS[themePreset] || THEME_PRESETS['elegant-gold'];
  const finalTheme = {
    ...selectedPreset,
    ...(customTheme || {})
  };

  const newEvent = db.createEvent({
    name: name.trim(),
    slug,
    date: date || new Date().toISOString().split('T')[0],
    hostPasscode: hostPasscode ? hostPasscode.trim() : '1234',
    welcomeMessage: welcomeMessage || `¡Bienvenidos a ${name}! Comparte tus mejores recuerdos con nosotros.`,
    instructions: instructions || 'Sube fotos y videos desde tu teléfono para verlos en vivo en la pantalla del evento.',
    specialGreeting: req.body.specialGreeting || `🎉 ¡Bienvenidos a ${name}! 🥳`,
    showGreetingBanner: req.body.showGreetingBanner !== false,
    allowVideos: allowVideos !== false,
    requireModeration: Boolean(requireModeration),
    maxVideoSizeMB: 100,
    theme: finalTheme
  });

  res.status(201).json({
    success: true,
    message: 'Evento creado con éxito',
    event: {
      ...newEvent,
      guestUrl: `/e/${newEvent.slug}`,
      slideshowUrl: `/e/${newEvent.slug}/live`,
      adminUrl: `/e/${newEvent.slug}/admin`
    }
  });
});

// POST /api/events/:slug/verify-passcode - Verify host access
router.post('/:slug/verify-passcode', (req, res) => {
  const { passcode } = req.body;
  const event = db.getEventBySlug(req.params.slug);

  if (!event) {
    return res.status(404).json({ success: false, error: 'Evento no encontrado' });
  }

  if (event.hostPasscode && event.hostPasscode !== passcode) {
    return res.status(401).json({ success: false, error: 'Código de anfitrión incorrecto' });
  }

  res.json({ success: true, authorized: true, event });
});

// PUT /api/events/:slug - Update event config and theme
router.put('/:slug', (req, res) => {
  const { passcode, ...updates } = req.body;
  const event = db.getEventBySlug(req.params.slug);

  if (!event) {
    return res.status(404).json({ success: false, error: 'Evento no encontrado' });
  }

  // Verify host authorization
  if (event.hostPasscode && event.hostPasscode !== passcode) {
    return res.status(401).json({ success: false, error: 'No autorizado. Código incorrecto.' });
  }

  const updated = db.updateEvent(req.params.slug, updates);
  res.json({ success: true, message: 'Evento actualizado exitosamente', event: updated });
});

// GET /api/events/:slug/stats - Summary statistics
router.get('/:slug/stats', (req, res) => {
  const event = db.getEventBySlug(req.params.slug);
  if (!event) {
    return res.status(404).json({ success: false, error: 'Evento no encontrado' });
  }

  const allMedia = db.getMediaByEventSlug(req.params.slug, true);
  const photos = allMedia.filter(m => !m.isVideo);
  const videos = allMedia.filter(m => m.isVideo);
  const totalLikes = allMedia.reduce((acc, m) => acc + (m.likes || 0), 0);
  const totalSizeBytes = allMedia.reduce((acc, m) => acc + (m.size || 0), 0);
  
  const uploaders = new Set(allMedia.map(m => m.uploaderName).filter(Boolean));

  res.json({
    success: true,
    stats: {
      totalMedia: allMedia.length,
      photosCount: photos.length,
      videosCount: videos.length,
      approvedCount: allMedia.filter(m => m.status === 'approved').length,
      pendingCount: allMedia.filter(m => m.status === 'pending').length,
      hiddenCount: allMedia.filter(m => m.status === 'hidden').length,
      totalLikes,
      uniqueGuests: uploaders.size,
      totalSizeMB: (totalSizeBytes / (1024 * 1024)).toFixed(2)
    }
  });
});

export default router;
