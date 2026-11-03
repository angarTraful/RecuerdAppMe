import express from 'express';
import { db } from '../db.js';
import { PRESET_PLAYLISTS } from '../constants/playlists.js';
import { searchTracks, isSpotifyConfigured } from '../services/spotify.js';

const router = express.Router({ mergeParams: true });

// GET /api/events/:slug/jukebox - State, settings, tracks, presets
router.get('/', (req, res) => {
  const { slug } = req.params;
  const event = db.getEventBySlug(slug);
  if (!event) {
    return res.status(404).json({ success: false, error: 'Evento no encontrado' });
  }

  const settings = db.getJukeboxSettings(slug);
  const tracks = db.getJukeboxTracks(slug);

  res.json({
    success: true,
    settings,
    tracks,
    presets: PRESET_PLAYLISTS,
    isSpotifyConfigured: isSpotifyConfigured()
  });
});

// GET /api/events/:slug/jukebox/search - Search songs via Spotify or local catalog
router.get('/search', async (req, res) => {
  const { q } = req.query;
  const searchResult = await searchTracks(q);
  res.json({
    success: true,
    ...searchResult
  });
});

// GET /api/events/:slug/jukebox/presets - List all pre-curated playlists
router.get('/presets', (req, res) => {
  res.json({
    success: true,
    presets: PRESET_PLAYLISTS
  });
});

// POST /api/events/:slug/jukebox/request - Guest requests a song
router.post('/request', (req, res) => {
  const { slug } = req.params;
  const event = db.getEventBySlug(slug);
  if (!event) {
    return res.status(404).json({ success: false, error: 'Evento no encontrado' });
  }

  const settings = db.getJukeboxSettings(slug);
  if (!settings.acceptingRequests) {
    return res.status(403).json({ success: false, error: 'Los pedidos de temas están pausados temporalmente por el DJ.' });
  }

  const { title, artist, genre, requestedBy, previewUrl, coverUrl, spotifyUrl } = req.body;
  const cleanTitle = (title || '').trim();
  const cleanArtist = (artist || '').trim();
  const cleanAuthor = (requestedBy || 'Invitado anónimo').trim();

  if (!cleanTitle) {
    return res.status(400).json({ success: false, error: 'El nombre de la canción es obligatorio.' });
  }

  // Check if song is already in queue or playing
  const currentTracks = db.getJukeboxTracks(slug);
  const existingQueued = [...(currentTracks.playing ? [currentTracks.playing] : []), ...currentTracks.queued].find(
    t => t.title.toLowerCase() === cleanTitle.toLowerCase() && t.artist.toLowerCase() === cleanArtist.toLowerCase()
  );

  if (existingQueued) {
    // Vote it up instead of duplicating!
    const updated = db.voteJukeboxTrack(slug, existingQueued.id, cleanAuthor);
    const io = req.app.get('io');
    if (io) {
      io.to(`event:${slug}`).emit('jukebox_track_voted', { track: updated, tracks: db.getJukeboxTracks(slug) });
    }
    return res.json({
      success: true,
      message: `"${cleanTitle}" ya estaba en la lista, ¡le sumamos tu voto! 🔥`,
      track: updated,
      votedUp: true
    });
  }

  const track = db.addJukeboxTrack({
    slug,
    title: cleanTitle,
    artist: cleanArtist || 'Artista no especificado',
    genre: genre || 'General',
    requestedBy: cleanAuthor,
    previewUrl: previewUrl || null,
    coverUrl: coverUrl || null,
    spotifyUrl: spotifyUrl || null
  });

  const io = req.app.get('io');
  if (io) {
    io.to(`event:${slug}`).emit('jukebox_track_added', {
      track,
      tracks: db.getJukeboxTracks(slug)
    });
  }

  // If Auto-DJ is enabled and nothing is currently playing, start playing this song right away!
  if (settings.autoDjEnabled && !currentTracks.playing) {
    const playingTrack = db.updateJukeboxTrackStatus(slug, track.id, 'playing');
    if (io) {
      io.to(`event:${slug}`).emit('jukebox_now_playing', {
        track: playingTrack,
        tracks: db.getJukeboxTracks(slug)
      });
    }
  }

  res.status(201).json({
    success: true,
    message: `¡"${cleanTitle}" fue añadida a la lista de espera con éxito! 🎉`,
    track
  });
});

// POST /api/events/:slug/jukebox/vote - Vote (+1) on a track
router.post('/vote', (req, res) => {
  const { slug } = req.params;
  const { trackId, voterId } = req.body;

  if (!trackId) {
    return res.status(400).json({ success: false, error: 'trackId requerido' });
  }

  const updatedTrack = db.voteJukeboxTrack(slug, trackId, voterId || 'anon');
  if (!updatedTrack) {
    return res.status(404).json({ success: false, error: 'Tema no encontrado' });
  }

  const allTracks = db.getJukeboxTracks(slug);
  const io = req.app.get('io');
  if (io) {
    io.to(`event:${slug}`).emit('jukebox_track_voted', {
      track: updatedTrack,
      tracks: allTracks
    });
  }

  res.json({
    success: true,
    track: updatedTrack,
    tracks: allTracks
  });
});

// POST /api/events/:slug/jukebox/dj/action - DJ Control & Auto-DJ trigger actions
router.post('/dj/action', (req, res) => {
  const { slug } = req.params;
  const { action, trackId, payload } = req.body;

  const event = db.getEventBySlug(slug);
  if (!event) {
    return res.status(404).json({ success: false, error: 'Evento no encontrado' });
  }

  const io = req.app.get('io');

  if (action === 'play') {
    if (!trackId) return res.status(400).json({ success: false, error: 'trackId requerido' });
    const playing = db.updateJukeboxTrackStatus(slug, trackId, 'playing');
    const tracks = db.getJukeboxTracks(slug);
    if (io) {
      io.to(`event:${slug}`).emit('jukebox_now_playing', { track: playing, tracks });
    }
    return res.json({ success: true, track: playing, tracks });
  }

  if (action === 'pause') {
    const settings = db.updateJukeboxSettings(slug, { isPlaying: false });
    if (io) {
      io.to(`event:${slug}`).emit('jukebox_paused', { settings });
    }
    return res.json({ success: true, settings });
  }

  if (action === 'resume') {
    const settings = db.updateJukeboxSettings(slug, { isPlaying: true });
    if (io) {
      io.to(`event:${slug}`).emit('jukebox_resumed', { settings });
    }
    return res.json({ success: true, settings });
  }

  if (action === 'next') {
    // Current playing track moves to played
    const currentTracks = db.getJukeboxTracks(slug);
    if (currentTracks.playing) {
      db.updateJukeboxTrackStatus(slug, currentTracks.playing.id, 'played');
    }

    // Pick next track (Auto-DJ or top voted)
    const nextTrack = db.getNextAutoDjTrack(slug);
    const tracks = db.getJukeboxTracks(slug);
    if (io) {
      io.to(`event:${slug}`).emit('jukebox_now_playing', { track: nextTrack, tracks });
    }
    return res.json({ success: true, track: nextTrack, tracks });
  }

  if (action === 'reject') {
    if (!trackId) return res.status(400).json({ success: false, error: 'trackId requerido' });
    const rejected = db.updateJukeboxTrackStatus(slug, trackId, 'rejected');
    const tracks = db.getJukeboxTracks(slug);
    if (io) {
      io.to(`event:${slug}`).emit('jukebox_queue_updated', { tracks });
    }
    return res.json({ success: true, track: rejected, tracks });
  }

  if (action === 'delete') {
    if (!trackId) return res.status(400).json({ success: false, error: 'trackId requerido' });
    const deleted = db.deleteJukeboxTrack(slug, trackId);
    const tracks = db.getJukeboxTracks(slug);
    if (io) {
      io.to(`event:${slug}`).emit('jukebox_queue_updated', { tracks });
    }
    return res.json({ success: true, track: deleted, tracks });
  }

  if (action === 'toggle_auto_dj') {
    const current = db.getJukeboxSettings(slug);
    const updated = db.updateJukeboxSettings(slug, { autoDjEnabled: !current.autoDjEnabled });
    if (io) {
      io.to(`event:${slug}`).emit('jukebox_settings_updated', { settings: updated });
    }
    return res.json({ success: true, settings: updated });
  }

  if (action === 'toggle_requests') {
    const current = db.getJukeboxSettings(slug);
    const updated = db.updateJukeboxSettings(slug, { acceptingRequests: !current.acceptingRequests });
    if (io) {
      io.to(`event:${slug}`).emit('jukebox_settings_updated', { settings: updated });
    }
    return res.json({ success: true, settings: updated });
  }

  if (action === 'set_preset') {
    const presetKey = payload?.preset;
    if (presetKey && PRESET_PLAYLISTS[presetKey]) {
      const updated = db.updateJukeboxSettings(slug, { currentPlaylistPreset: presetKey });
      if (io) {
        io.to(`event:${slug}`).emit('jukebox_settings_updated', { settings: updated });
      }
      return res.json({ success: true, settings: updated });
    }
    return res.status(400).json({ success: false, error: 'Preset inválido' });
  }

  res.status(400).json({ success: false, error: 'Acción no reconocida' });
});

export default router;

