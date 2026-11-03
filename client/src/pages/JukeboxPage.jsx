import React, { useState, useEffect, useRef } from 'react';
import {
  Music, Play, Pause, SkipForward, Flame, Heart, Search, Plus, Radio,
  Sparkles, CheckCircle, Volume2, VolumeX, Disc, ListMusic, User,
  Share2, ArrowLeft, RefreshCw, X, Sliders, ExternalLink, ShieldCheck, Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { fetchJukebox, requestJukeboxSong, voteJukeboxSong, performDjAction, fetchEvent } from '../utils/api';
import { getSocket, joinEventRoom } from '../utils/socket';
import { startFestiveAudioLoop, stopAudio, setMasterVolume } from '../utils/audioPlayer';

export default function JukeboxPage({ slug = 'cumple-de-joaco', onExit }) {
  const [activeMode, setActiveMode] = useState('guest'); // 'guest' | 'dj'
  const [event, setEvent] = useState(null);
  const [settings, setSettings] = useState({
    autoDjEnabled: true,
    currentPlaylistPreset: 'cachengue-fiesta',
    acceptingRequests: true,
    isPlaying: false
  });
  const [tracks, setTracks] = useState({
    playing: null,
    queued: [],
    played: [],
    rejected: [],
    all: []
  });
  const [presets, setPresets] = useState({});
  const [loading, setLoading] = useState(true);

  // Guest Request Form state
  const [guestName, setGuestName] = useState(() => (localStorage.getItem('recuerdapp_name') || '').trim() || 'Un invitado');
  const [searchQuery, setSearchQuery] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [customGenre, setCustomGenre] = useState('Cachengue');
  const [selectedPresetGenre, setSelectedPresetGenre] = useState('all');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [votedIds, setVotedIds] = useState(() => new Set());
  const [requestSuccess, setRequestSuccess] = useState(null);

  // Player / Auto-DJ state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgressSec, setAudioProgressSec] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);

  const progressIntervalRef = useRef(null);

  useEffect(() => {
    loadData();

    // Socket.IO real-time updates
    const socket = getSocket();
    joinEventRoom(slug);

    const handleTrackAdded = (payload) => {
      if (payload && payload.tracks) {
        setTracks(payload.tracks);
      }
    };

    const handleTrackVoted = (payload) => {
      if (payload && payload.tracks) {
        setTracks(payload.tracks);
      }
    };

    const handleNowPlaying = (payload) => {
      if (payload) {
        if (payload.tracks) setTracks(payload.tracks);
        setAudioProgressSec(0);
        setIsPlayingAudio(true);
        startFestiveAudioLoop(payload.track?.genre || 'Cachengue');
      }
    };

    const handleSettingsUpdated = (payload) => {
      if (payload && payload.settings) {
        setSettings(payload.settings);
      }
    };

    const handlePaused = () => {
      setIsPlayingAudio(false);
      stopAudio();
    };

    const handleResumed = () => {
      setIsPlayingAudio(true);
      startFestiveAudioLoop(tracks.playing?.genre || 'Cachengue');
    };

    socket.on('jukebox_track_added', handleTrackAdded);
    socket.on('jukebox_track_voted', handleTrackVoted);
    socket.on('jukebox_now_playing', handleNowPlaying);
    socket.on('jukebox_settings_updated', handleSettingsUpdated);
    socket.on('jukebox_paused', handlePaused);
    socket.on('jukebox_resumed', handleResumed);

    return () => {
      socket.off('jukebox_track_added', handleTrackAdded);
      socket.off('jukebox_track_voted', handleTrackVoted);
      socket.off('jukebox_now_playing', handleNowPlaying);
      socket.off('jukebox_settings_updated', handleSettingsUpdated);
      socket.off('jukebox_paused', handlePaused);
      socket.off('jukebox_resumed', handleResumed);
      stopAudio();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [slug]);

  // Handle Auto-DJ progress timer
  useEffect(() => {
    if (isPlayingAudio && tracks.playing) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      const totalDuration = tracks.playing.durationSec || 180;

      progressIntervalRef.current = setInterval(() => {
        setAudioProgressSec((prev) => {
          if (prev >= totalDuration) {
            // Track finished! Auto advance if Auto-DJ is on
            handleSkipNext();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPlayingAudio, tracks.playing]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [evtData, jukeData] = await Promise.all([
        fetchEvent(slug).catch(() => null),
        fetchJukebox(slug)
      ]);
      setEvent(evtData);
      setSettings(jukeData.settings || {});
      setTracks(jukeData.tracks || { playing: null, queued: [], played: [], rejected: [], all: [] });
      setPresets(jukeData.presets || {});
    } catch (err) {
      console.error('Error loading jukebox data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanTitle = customTitle.trim();
    if (!cleanTitle) return;

    try {
      const res = await requestJukeboxSong(slug, {
        title: cleanTitle,
        artist: customArtist.trim() || 'Artista no especificado',
        genre: customGenre,
        requestedBy: guestName.trim() || 'Un invitado'
      });

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#EC4899', '#F59E0B', '#D4AF37', '#10B981']
      });

      setRequestSuccess(res.message);
      setCustomTitle('');
      setCustomArtist('');
      setShowRequestModal(false);
      setTimeout(() => setRequestSuccess(null), 5000);
      loadData();
    } catch (err) {
      alert(err.message || 'Error al pedir canción');
    }
  };

  const handleRequestPresetSong = async (song) => {
    try {
      const res = await requestJukeboxSong(slug, {
        title: song.title,
        artist: song.artist,
        genre: song.genre,
        requestedBy: guestName.trim() || 'Un invitado'
      });

      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.65 },
        colors: ['#D4AF37', '#F59E0B', '#EC4899']
      });

      setRequestSuccess(res.message);
      setTimeout(() => setRequestSuccess(null), 4000);
      loadData();
    } catch (err) {
      alert(err.message || 'Error al pedir canción');
    }
  };

  const handleVote = async (trackId) => {
    try {
      const voterId = guestName || localStorage.getItem('recuerdapp_name') || 'anon';
      setVotedIds((prev) => new Set([...prev, trackId]));
      await voteJukeboxSong(slug, trackId, voterId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // DJ actions
  const handlePlayTrack = async (trackId) => {
    try {
      await performDjAction(slug, { action: 'play', trackId });
      setIsPlayingAudio(true);
      startFestiveAudioLoop(tracks.playing?.genre || 'Cachengue');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTogglePlayPause = () => {
    if (isPlayingAudio) {
      setIsPlayingAudio(false);
      stopAudio();
      performDjAction(slug, { action: 'pause' });
    } else {
      setIsPlayingAudio(true);
      startFestiveAudioLoop(tracks.playing?.genre || 'Cachengue');
      performDjAction(slug, { action: 'resume' });
    }
  };

  const handleSkipNext = async () => {
    try {
      await performDjAction(slug, { action: 'next' });
      setAudioProgressSec(0);
      setIsPlayingAudio(true);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectTrack = async (trackId) => {
    try {
      await performDjAction(slug, { action: 'reject', trackId });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleAutoDj = async () => {
    try {
      const res = await performDjAction(slug, { action: 'toggle_auto_dj' });
      setSettings(res.settings);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleChangePreset = async (presetKey) => {
    try {
      const res = await performDjAction(slug, { action: 'set_preset', payload: { preset: presetKey } });
      setSettings(res.settings);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setMasterVolume(volume);
    } else {
      setIsMuted(true);
      setMasterVolume(0);
    }
  };

  const formatSec = (total) => {
    const mins = Math.floor(total / 60);
    const secs = Math.floor(total % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Filter curated songs by preset
  const allPresetTracks = Object.values(presets).flatMap((p) => p.tracks || []);
  const filteredPresetTracks = allPresetTracks.filter((t) => {
    const matchesSearch = searchQuery === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.genre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedPresetGenre === 'all' || t.genre.toLowerCase() === selectedPresetGenre.toLowerCase();
    return matchesSearch && matchesGenre;
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
        <div style={{
          width: 44,
          height: 44,
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: 'var(--theme-primary, #D4AF37)',
          borderRadius: '50%',
          margin: '0 auto 16px',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p>Cargando Cabina de DJ y Jukebox...</p>
      </div>
    );
  }

  return (
    <div className="themed-app" style={{ minHeight: '100vh', padding: '24px 16px 80px' }}>
      <div className="container" style={{ maxWidth: 960 }}>

        {/* Top Header Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {onExit ? (
              <button
                onClick={onExit}
                className="btn btn-secondary"
                style={{ padding: '8px 14px', borderRadius: 20, fontSize: '0.85rem' }}
              >
                <ArrowLeft size={16} /> Volver al Evento
              </button>
            ) : (
              <a
                href={`#/e/${slug}`}
                className="btn btn-secondary"
                style={{ padding: '8px 14px', borderRadius: 20, fontSize: '0.85rem' }}
              >
                <ArrowLeft size={16} /> Volver a Fotos
              </a>
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Disc size={20} color="var(--theme-primary, #D4AF37)" />
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                  Jukebox & DJ Interactivo
                </h2>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {event?.name || 'RecuerdAppMe Eventos'} • Música en Vivo
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.08)',
            padding: 4,
            borderRadius: 14,
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}>
            <button
              onClick={() => setActiveMode('guest')}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.88rem',
                background: activeMode === 'guest' ? 'var(--theme-primary, #D4AF37)' : 'transparent',
                color: activeMode === 'guest' ? '#0E1116' : 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Heart size={16} /> Pedir & Votar Temas
            </button>

            <button
              onClick={() => setActiveMode('dj')}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.88rem',
                background: activeMode === 'dj' ? 'var(--theme-primary, #D4AF37)' : 'transparent',
                color: activeMode === 'dj' ? '#0E1116' : 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Radio size={16} /> Cabina DJ & Auto-DJ
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {requestSuccess && (
          <div style={{
            padding: '12px 18px',
            borderRadius: 12,
            marginBottom: 20,
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#34D399',
            border: '1px solid #10B981',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.92rem',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <CheckCircle size={18} />
            <span>{requestSuccess}</span>
          </div>
        )}

        {/* 🔊 NOW PLAYING BANNER CARD */}
        <div
          className="glass-card"
          style={{
            padding: '24px',
            marginBottom: 24,
            border: '1.5px solid var(--theme-primary, #D4AF37)',
            background: 'linear-gradient(135deg, rgba(20, 24, 33, 0.95), rgba(10, 12, 16, 0.98))',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 30px rgba(var(--primary-rgb), 0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Pulsing glow background effect */}
          <div style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: isPlayingAudio ? 'rgba(var(--primary-rgb), 0.18)' : 'rgba(255,255,255,0.04)',
            filter: 'blur(50px)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Spinning Vinyl Graphic */}
              <div style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: '#111318',
                border: '3px solid var(--theme-primary, #D4AF37)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                animation: isPlayingAudio ? 'spin 3.5s linear infinite' : 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.8)'
              }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'var(--theme-primary, #D4AF37)',
                  border: '3px solid #111318'
                }} />
              </div>

              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: isPlayingAudio ? 'var(--theme-primary, #D4AF37)' : 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  <span>{isPlayingAudio ? '🔊 SONANDO AHORA EN LA PISTA' : '⏸️ EN PAUSA'}</span>
                  {tracks.playing?.genre && (
                    <span className="badge" style={{ fontSize: '0.7rem' }}>
                      {tracks.playing.genre}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', margin: '4px 0 2px' }}>
                  {tracks.playing?.title || 'Esperando inicio de música...'}
                </h3>

                <div style={{ fontSize: '0.95rem', color: 'var(--theme-secondary, #E8D5B5)' }}>
                  {tracks.playing?.artist || 'Selecciona un tema o activa el Auto-DJ abajo'}
                </div>

                {tracks.playing?.requestedBy && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Pedido con cariño por: <strong style={{ color: '#fff' }}>{tracks.playing.requestedBy}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Playback controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {activeMode === 'dj' && (
                <>
                  <button
                    onClick={handleTogglePlayPause}
                    className="btn btn-primary"
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={isPlayingAudio ? 'Pausar' : 'Reproducir'}
                  >
                    {isPlayingAudio ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: 2 }} />}
                  </button>

                  <button
                    onClick={handleSkipNext}
                    className="btn btn-secondary"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Pasar al siguiente tema más votado"
                  >
                    <SkipForward size={20} />
                  </button>

                  <button
                    onClick={handleToggleMute}
                    className="btn btn-secondary btn-icon"
                    title={isMuted ? 'Activar sonido' : 'Silenciar'}
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                </>
              )}

              {/* YouTube / Spotify Direct Search Helper */}
              {tracks.playing && (
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${tracks.playing.title} ${tracks.playing.artist}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
                  title="Abrir en YouTube / VirtualDJ"
                >
                  <ExternalLink size={14} /> Abrir YouTube
                </a>
              )}
            </div>
          </div>

          {/* Progress Bar & Counter */}
          {tracks.playing && (
            <div style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>{formatSec(audioProgressSec)}</span>
                <span>{formatSec(tracks.playing.durationSec || 180)}</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, (audioProgressSec / (tracks.playing.durationSec || 180)) * 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--theme-primary, #D4AF37), var(--theme-accent, #F59E0B))',
                    transition: 'width 1s linear'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* MODE 1: GUEST REQUEST & VOTING VIEW                           */}
        {/* ============================================================== */}
        {activeMode === 'guest' && (
          <div>
            {/* Action Card: Pedir Canción */}
            <div className="glass-card" style={{ padding: 22, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px' }}>
                    ¿Qué tema querés escuchar ahora? 🎶
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    Pide tu tema o vota los que ya están en la lista para que suenen primero
                  </p>
                </div>

                <button
                  onClick={() => setShowRequestModal(true)}
                  className="btn btn-primary"
                  style={{ padding: '12px 20px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <Plus size={18} /> Pedir una Canción
                </button>
              </div>
            </div>

            {/* LIVE QUEUE OF REQUESTED SONGS SORTED BY VOTES */}
            <div style={{ marginBottom: 30 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Flame size={20} color="#F59E0B" />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                    Cola de Temas Votados ({tracks.queued.length})
                  </h3>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Ordenados por votos en tiempo real 🔥
                </span>
              </div>

              {tracks.queued.length === 0 ? (
                <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <Music size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                  <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem' }}>Aún no hay canciones pedidas en la cola</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 16px' }}>
                    ¡Sé el primero en pedir un tema para poner a bailar a todos!
                  </p>
                  <button
                    onClick={() => setShowRequestModal(true)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    Pedir la primera canción
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tracks.queued.map((track, idx) => (
                    <div
                      key={track.id}
                      className="glass-card"
                      style={{
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        borderRadius: 14,
                        border: idx === 0 ? '1.5px solid var(--theme-primary, #D4AF37)' : '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        {/* Position ranking badge */}
                        <div style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: idx === 0 ? 'linear-gradient(135deg, #F59E0B, #D4AF37)' : 'rgba(255,255,255,0.08)',
                          color: idx === 0 ? '#0E1116' : '#fff',
                          fontWeight: 900,
                          fontSize: '0.95rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {idx === 0 ? '👑' : `#${idx + 1}`}
                        </div>

                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF' }}>
                            {track.title}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--theme-secondary, #E8D5B5)' }}>
                            {track.artist} • <span style={{ opacity: 0.7 }}>{track.genre}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            Pedido por: {track.requestedBy}
                          </div>
                        </div>
                      </div>

                      {/* Vote Button */}
                      <button
                        onClick={() => handleVote(track.id)}
                        className="btn"
                        style={{
                          padding: '8px 16px',
                          borderRadius: 20,
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          background: votedIds.has(track.id) ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                          color: votedIds.has(track.id) ? '#EF4444' : '#fff',
                          border: votedIds.has(track.id) ? '1px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Heart size={16} fill={votedIds.has(track.id) ? '#EF4444' : 'none'} />
                        <span>{track.votes || 1}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CURATED POPULAR SONGS (1-CLICK REQUEST) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                  Explorar Temas Populares Listos para Pedir
                </h3>
                {/* Search Bar */}
                <div style={{ position: 'relative', width: '100%', maxWidth: 260 }}>
                  <Search size={16} style={{ position: 'absolute', top: 12, left: 12, color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar canción..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: 36, paddingRight: 12, fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Genre Pills */}
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 14 }}>
                <button
                  onClick={() => setSelectedPresetGenre('all')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 16,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    border: selectedPresetGenre === 'all' ? '1px solid var(--theme-primary, #D4AF37)' : '1px solid rgba(255,255,255,0.1)',
                    background: selectedPresetGenre === 'all' ? 'rgba(var(--primary-rgb), 0.25)' : 'rgba(255,255,255,0.05)',
                    color: selectedPresetGenre === 'all' ? 'var(--theme-primary, #D4AF37)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Todos los géneros
                </button>
                {['Cachengue', 'Cuarteto', 'Cumbia', 'Retro Pop', 'Rock', 'EDM', 'Vals Clásico'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedPresetGenre(g)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 16,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      border: selectedPresetGenre.toLowerCase() === g.toLowerCase() ? '1px solid var(--theme-primary, #D4AF37)' : '1px solid rgba(255,255,255,0.1)',
                      background: selectedPresetGenre.toLowerCase() === g.toLowerCase() ? 'rgba(var(--primary-rgb), 0.25)' : 'rgba(255,255,255,0.05)',
                      color: selectedPresetGenre.toLowerCase() === g.toLowerCase() ? 'var(--theme-primary, #D4AF37)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {/* Grid of Curated Songs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                {filteredPresetTracks.slice(0, 18).map((song) => (
                  <div
                    key={song.id}
                    className="glass-card"
                    style={{
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      borderRadius: 12
                    }}
                  >
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {song.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {song.artist}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRequestPresetSong(song)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem', flexShrink: 0 }}
                      title="Pedir este tema"
                    >
                      <Plus size={14} /> Pedir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 2: DJ BOOTH & AUTO-DJ PANEL                               */}
        {/* ============================================================== */}
        {activeMode === 'dj' && (
          <div>
            {/* Auto-DJ Control Card */}
            <div
              className="glass-card"
              style={{
                padding: '22px 24px',
                marginBottom: 24,
                border: settings.autoDjEnabled ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.15)',
                background: settings.autoDjEnabled ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.03)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: settings.autoDjEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)',
                    color: settings.autoDjEnabled ? '#10B981' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Zap size={24} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 2px' }}>
                      Modo Auto-DJ Inteligente: {settings.autoDjEnabled ? 'ACTIVADO' : 'DESACTIVADO (Manual)'}
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                      {settings.autoDjEnabled
                        ? 'El sistema reproduce los temas más votados y rellena automáticamente con la lista de respaldo si la cola se vacía.'
                        : 'Modo manual: el DJ decide cuándo lanzar cada tema desde la botonera.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleToggleAutoDj}
                  className="btn"
                  style={{
                    padding: '10px 20px',
                    borderRadius: 20,
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    background: settings.autoDjEnabled ? '#10B981' : 'rgba(255,255,255,0.12)',
                    color: settings.autoDjEnabled ? '#0E1116' : '#fff',
                    cursor: 'pointer'
                  }}
                >
                  {settings.autoDjEnabled ? 'Apagar Auto-DJ' : 'Encender Auto-DJ'}
                </button>
              </div>

              {/* Preset playlist selector for Auto-DJ fallback */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>
                  Lista de respaldo de Auto-DJ (suena cuando no hay pedidos):
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Object.entries(presets).map(([key, p]) => (
                    <button
                      key={key}
                      onClick={() => handleChangePreset(key)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 12,
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        border: settings.currentPlaylistPreset === key ? '1.5px solid var(--theme-primary, #D4AF37)' : '1px solid rgba(255,255,255,0.1)',
                        background: settings.currentPlaylistPreset === key ? 'rgba(var(--primary-rgb), 0.25)' : 'rgba(255,255,255,0.04)',
                        color: settings.currentPlaylistPreset === key ? 'var(--theme-primary, #D4AF37)' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* DJ Queue Management */}
            <div style={{ marginBottom: 30 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Gestión de Cola de Temas ({tracks.queued.length} pedidos)
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Acciones directas para el DJ
                </span>
              </div>

              {tracks.queued.length === 0 ? (
                <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  La cola de pedidos está vacía. El Auto-DJ está reproduciendo temas de la lista de respaldo.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tracks.queued.map((track, idx) => (
                    <div
                      key={track.id}
                      className="glass-card"
                      style={{
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        borderRadius: 14
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 900, color: '#F59E0B' }}>#{idx + 1}</span>
                          <span style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>{track.title}</span>
                          <span className="badge" style={{ fontSize: '0.7rem' }}>❤️ {track.votes} votos</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--theme-secondary, #E8D5B5)', marginTop: 2 }}>
                          {track.artist} • Pedido por: <strong>{track.requestedBy}</strong>
                        </div>
                      </div>

                      {/* DJ Action Buttons */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handlePlayTrack(track.id)}
                          className="btn btn-primary"
                          style={{ padding: '8px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <Play size={14} /> Poner a sonar
                        </button>
                        <button
                          onClick={() => handleRejectTrack(track.id)}
                          className="btn btn-secondary"
                          style={{ padding: '8px 12px', fontSize: '0.82rem', color: '#F87171' }}
                          title="Descartar tema"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* History of Played Songs */}
            {tracks.played.length > 0 && (
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 12, color: 'var(--theme-secondary, #E8D5B5)' }}>
                  Temas ya reproducidos en la fiesta ({tracks.played.length})
                </h4>
                <div className="glass-card" style={{ padding: '16px', maxHeight: 260, overflowY: 'auto' }}>
                  {tracks.played.map((t, idx) => (
                    <div
                      key={t.id || idx}
                      style={{
                        padding: '8px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.85rem'
                      }}
                    >
                      <div>
                        <strong style={{ color: '#fff' }}>{t.title}</strong> - {t.artist}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                          (Pedido por: {t.requestedBy})
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#10B981' }}>✔️ Sonó</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL: PEDIR CANCIÓN PERSONALIZADA */}
      {showRequestModal && (
        <div className="modal-backdrop" onClick={() => setShowRequestModal(false)} style={{ zIndex: 1200 }}>
          <div
            className="modal-content glass-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 460, padding: 26 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Music size={22} color="var(--theme-primary, #D4AF37)" />
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>
                  Pedir una Canción
                </h3>
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="btn btn-secondary btn-icon"
                style={{ width: 32, height: 32 }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Nombre de la Canción *:</label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="form-control"
                  placeholder="Ej. La Morocha, Bresh mix, Seguir Viviendo..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Artista / Banda:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Luck Ra, Soda Stereo, Duki..."
                  value={customArtist}
                  onChange={(e) => setCustomArtist(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Género:</label>
                <select
                  className="form-control"
                  value={customGenre}
                  onChange={(e) => setCustomGenre(e.target.value)}
                >
                  <option value="Cachengue">Cachengue / Reggaetón</option>
                  <option value="Cuarteto">Cuarteto / Cumbia</option>
                  <option value="Retro">Retro 80s / 90s</option>
                  <option value="Rock">Rock Nacional / Internacional</option>
                  <option value="EDM">Electrónica / House</option>
                  <option value="Lentos">Lentos / Vals</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Tu Nombre o Apodo:</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Ej. Mesa 4, Marcela, Franco..."
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={!customTitle.trim()}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 800 }}
              >
                Enviar Pedido a la Cola 🎶
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
