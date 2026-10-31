import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default state with an engaging sample event
const initialData = {
  settings: {
    masterPasscode: process.env.MASTER_PASSCODE || 'admin2026'
  },
  events: [
    {
      id: 'evt-demo-boda',
      slug: 'boda-valentina-y-mateo',
      name: 'Boda de Valentina & Mateo',
      date: '2026-11-15',
      hostPasscode: '1234',
      moderatorPasscode: '0000',
      uploadsPaused: false,
      welcomeMessage: '¡Bienvenidos a nuestra boda! Gracias por ser parte de este momento tan especial. Comparte aquí todas tus fotos y videos.',
      instructions: 'Toma fotos espontáneas, momentos divertidos y déjanos tu saludo para proyectarlo en vivo.',
      requireModeration: false,
      allowVideos: true,
      maxVideoSizeMB: 100,
      createdAt: new Date().toISOString(),
      theme: {
        preset: 'elegant-gold',
        primaryColor: '#D4AF37', // Warm gold
        secondaryColor: '#E8D5B5',
        backgroundColor: '#0F1115', // Dark luxury
        cardBackground: 'rgba(28, 32, 42, 0.75)',
        textColor: '#F8F9FA',
        accentColor: '#F39C12',
        fontFamily: "'Playfair Display', serif",
        headingFont: "'Cinzel', serif",
        borderRadius: '16px',
        coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
        monogram: 'V & M',
        overlayOpacity: 0.6
      }
    }
  ],
  media: [
    {
      id: 'med-demo-1',
      eventId: 'evt-demo-boda',
      eventSlug: 'boda-valentina-y-mateo',
      filename: 'sample-toast.jpg',
      originalName: 'Brindis_de_honor.jpg',
      url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
      isExternal: true,
      mimeType: 'image/jpeg',
      isVideo: false,
      size: 2450000,
      uploaderName: 'Familia Gómez',
      caption: '¡Que viva el amor y esta noche inolvidable! 🥂✨',
      likes: 12,
      status: 'approved',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 'med-demo-2',
      eventId: 'evt-demo-boda',
      eventSlug: 'boda-valentina-y-mateo',
      filename: 'sample-rings.jpg',
      originalName: 'Los_anillos.jpg',
      url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80',
      isExternal: true,
      mimeType: 'image/jpeg',
      isVideo: false,
      size: 1980000,
      uploaderName: 'Padrinos Andrés y Carla',
      caption: 'El comienzo de una hermosa historia. ¡Felicidades! ❤️',
      likes: 18,
      status: 'approved',
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'med-demo-3',
      eventId: 'evt-demo-boda',
      eventSlug: 'boda-valentina-y-mateo',
      filename: 'sample-party.jpg',
      originalName: 'Fiesta_pista.jpg',
      url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
      isExternal: true,
      mimeType: 'image/jpeg',
      isVideo: false,
      size: 3120000,
      uploaderName: 'Amigos de la Facu',
      caption: '¡Se prendió la fiesta! Rompiendo la pista 🕺💃🔥',
      likes: 24,
      status: 'approved',
      createdAt: new Date(Date.now() - 1800000).toISOString()
    }
  ]
};

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading database file:', err);
    return initialData;
  }
}

function writeDb(data) {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('Error writing to database:', err);
    return false;
  }
}

export const db = {
  // System Settings / Master Passcode
  getMasterPasscode() {
    const data = readDb();
    return data.settings?.masterPasscode || process.env.MASTER_PASSCODE || 'admin2026';
  },

  updateMasterPasscode(newPasscode) {
    const data = readDb();
    data.settings = {
      ...(data.settings || {}),
      masterPasscode: newPasscode
    };
    writeDb(data);
    return true;
  },

  verifyEventAccess(slug, passcode) {
    if (!passcode) return null;
    const master = this.getMasterPasscode();
    if (passcode === master) {
      return { authorized: true, role: 'superadmin' };
    }

    const event = this.getEventBySlug(slug);
    if (!event) return null;

    if (event.hostPasscode && passcode === event.hostPasscode) {
      return { authorized: true, role: 'host' };
    }

    if (event.moderatorPasscode && passcode === event.moderatorPasscode) {
      return { authorized: true, role: 'moderator' };
    }

    return null;
  },

  // Events
  getAllEvents() {
    const data = readDb();
    return data.events.map(ev => ({
      id: ev.id,
      slug: ev.slug,
      name: ev.name,
      date: ev.date,
      welcomeMessage: ev.welcomeMessage,
      uploadsPaused: Boolean(ev.uploadsPaused),
      theme: ev.theme,
      createdAt: ev.createdAt,
      mediaCount: data.media.filter(m => m.eventId === ev.id && m.status === 'approved').length
    }));
  },

  getEventBySlug(slug) {
    const data = readDb();
    return data.events.find(e => e.slug.toLowerCase() === slug.toLowerCase()) || null;
  },

  getEventById(id) {
    const data = readDb();
    return data.events.find(e => e.id === id) || null;
  },

  createEvent(eventData) {
    const data = readDb();
    const newEvent = {
      ...eventData,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString()
    };
    data.events.push(newEvent);
    writeDb(data);
    return newEvent;
  },

  updateEvent(slug, updates) {
    const data = readDb();
    const index = data.events.findIndex(e => e.slug.toLowerCase() === slug.toLowerCase());
    if (index === -1) return null;
    
    // Protect passcode from unintentional null overwrite
    const current = data.events[index];
    const updated = {
      ...current,
      ...updates,
      id: current.id,
      slug: current.slug,
      hostPasscode: updates.hostPasscode !== undefined && updates.hostPasscode.trim() !== '' ? updates.hostPasscode.trim() : current.hostPasscode,
      moderatorPasscode: updates.moderatorPasscode !== undefined ? updates.moderatorPasscode.trim() : (current.moderatorPasscode || ''),
      updatedAt: new Date().toISOString()
    };
    
    data.events[index] = updated;
    writeDb(data);
    return updated;
  },

  deleteEvent(slug) {
    const data = readDb();
    const event = data.events.find(e => e.slug.toLowerCase() === slug.toLowerCase());
    if (!event) return false;

    data.events = data.events.filter(e => e.slug.toLowerCase() !== slug.toLowerCase());
    data.media = data.media.filter(m => m.eventId !== event.id);
    data.dedications = (data.dedications || []).filter(d => d.slug.toLowerCase() !== slug.toLowerCase());
    writeDb(data);

    // Clean up physical uploads folder for this event
    try {
      const eventUploadsDir = path.join(__dirname, '..', 'uploads', event.slug);
      if (fs.existsSync(eventUploadsDir)) {
        fs.rmSync(eventUploadsDir, { recursive: true, force: true });
      }
    } catch (err) {
      console.error('Error removing event uploads directory:', err);
    }

    return true;
  },

  // Media
  getMediaByEventSlug(slug, includeUnapproved = false) {
    const data = readDb();
    return data.media
      .filter(m => m.eventSlug.toLowerCase() === slug.toLowerCase())
      .filter(m => includeUnapproved || m.status === 'approved')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  addMediaItem(item) {
    const data = readDb();
    const newItem = {
      ...item,
      id: item.id || `med-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      likes: item.likes || 0,
      createdAt: item.createdAt || new Date().toISOString()
    };
    data.media.unshift(newItem);
    writeDb(data);
    return newItem;
  },

  getMediaById(mediaId) {
    const data = readDb();
    return data.media.find(m => m.id === mediaId) || null;
  },

  updateMediaItem(mediaId, updates) {
    const data = readDb();
    const index = data.media.findIndex(m => m.id === mediaId);
    if (index === -1) return null;

    data.media[index] = {
      ...data.media[index],
      ...updates
    };
    writeDb(data);
    return data.media[index];
  },

  deleteMediaItem(mediaId) {
    const data = readDb();
    const item = data.media.find(m => m.id === mediaId);
    if (!item) return null;

    data.media = data.media.filter(m => m.id !== mediaId);
    writeDb(data);
    return item;
  },

  incrementLike(mediaId) {
    const data = readDb();
    const item = data.media.find(m => m.id === mediaId);
    if (!item) return null;
    item.likes = (item.likes || 0) + 1;
    writeDb(data);
    return item;
  },

  // Dedications / Text Greetings
  getDedicationsByEventSlug(slug) {
    const data = readDb();
    return (data.dedications || [])
      .filter(d => d.slug.toLowerCase() === slug.toLowerCase())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  addDedication(item) {
    const data = readDb();
    if (!data.dedications) data.dedications = [];
    const newDedication = {
      id: item.id || `ded-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      slug: item.slug.toLowerCase(),
      author: (item.author || 'Un invitado').trim(),
      message: (item.message || '').trim(),
      createdAt: item.createdAt || new Date().toISOString()
    };
    data.dedications.unshift(newDedication);
    writeDb(data);
    return newDedication;
  }
};
