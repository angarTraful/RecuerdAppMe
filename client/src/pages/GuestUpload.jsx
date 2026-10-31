import React, { useState, useEffect, useRef } from 'react';
import { Camera, Calendar, Sparkles, Heart, Share2, Tv, QrCode, User, Edit2, ShieldCheck, Lock } from 'lucide-react';
import { fetchEvent, fetchEventMedia, formatMediaItem } from '../utils/api';
import { getSocket, joinEventRoom, leaveEventRoom } from '../utils/socket';
import { useTheme } from '../context/ThemeContext';
import MediaUploader from '../components/MediaUploader';
import GuestDedicationForm from '../components/GuestDedicationForm';
import MediaGallery from '../components/MediaGallery';
import Lightbox from '../components/Lightbox';
import GuestReactionsBar from '../components/GuestReactionsBar';

export default function GuestUpload({ slug, isEventAdmin = false, onOpenLive, onOpenAdmin }) {
  const { applyTheme } = useTheme();
  const [event, setEvent] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Guest name workflow state
  const [guestName, setGuestName] = useState(() => (localStorage.getItem('recuerdapp_name') || '').trim());
  const [showNameModal, setShowNameModal] = useState(() => !(localStorage.getItem('recuerdapp_name') || '').trim());
  const [nameInput, setNameInput] = useState(() => (localStorage.getItem('recuerdapp_name') || '').trim());
  const [pendingAction, setPendingAction] = useState(null);
  const nameInputRef = useRef(null);

  const handleSaveGuestName = (e) => {
    if (e) e.preventDefault();
    const cleaned = nameInput.trim();
    if (!cleaned) return;
    localStorage.setItem('recuerdapp_name', cleaned);
    setGuestName(cleaned);
    setShowNameModal(false);

    if (pendingAction) {
      const actionToRun = pendingAction;
      setPendingAction(null);
      setTimeout(() => actionToRun(cleaned), 50);
    }
  };

  const openNamePrompt = (callback = null) => {
    setNameInput(guestName || '');
    if (callback) {
      setPendingAction(() => callback);
    } else {
      setPendingAction(null);
    }
    setShowNameModal(true);
  };

  useEffect(() => {
    loadEventData();

    // Socket.IO real-time listener
    const socket = getSocket();
    joinEventRoom(slug);

    const handleNewMedia = (payload) => {
      if (payload && payload.items) {
        const formatted = payload.items.map(formatMediaItem);
        setMedia((prev) => {
          // Avoid duplicates
          const newItems = formatted.filter((item) => !prev.some((m) => m.id === item.id));
          return [...newItems, ...prev];
        });
      }
    };

    const handleMediaLiked = (payload) => {
      if (payload && payload.id) {
        setMedia((prev) =>
          prev.map((m) => (m.id === payload.id ? { ...m, likes: payload.likes } : m))
        );
      }
    };

    const handleMediaDeleted = (payload) => {
      if (payload && payload.id) {
        setMedia((prev) => prev.filter((m) => m.id !== payload.id));
      }
    };

    const handleEventUpdated = (updatedEvent) => {
      if (updatedEvent) {
        setEvent(updatedEvent);
        if (updatedEvent.theme) {
          applyTheme(updatedEvent.theme);
        }
      }
    };

    socket.on('new_media', handleNewMedia);
    socket.on('media_liked', handleMediaLiked);
    socket.on('media_deleted', handleMediaDeleted);
    socket.on('event_updated', handleEventUpdated);

    return () => {
      socket.off('new_media', handleNewMedia);
      socket.off('media_liked', handleMediaLiked);
      socket.off('media_deleted', handleMediaDeleted);
      socket.off('event_updated', handleEventUpdated);
      leaveEventRoom(slug);
    };
  }, [slug]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      const [evtData, mediaData] = await Promise.all([
        fetchEvent(slug),
        fetchEventMedia(slug)
      ]);
      setEvent(evtData);
      setMedia(mediaData);
      if (evtData.theme) {
        applyTheme(evtData.theme);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error cargando evento');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (newItems) => {
    // Optimistically add items if not already added by socket
    setMedia((prev) => {
      const filtered = newItems.filter((item) => !prev.some((m) => m.id === item.id));
      return [...filtered, ...prev];
    });
  };

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
        <p>Cargando galería del evento...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2 style={{ color: '#EF4444', marginBottom: 12 }}>Evento no encontrado</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>{error}</p>
        <a href="#/" className="btn btn-primary">Volver al inicio</a>
      </div>
    );
  }

  return (
    <div className="themed-app" style={{ minHeight: '100vh', paddingBottom: 80 }}>
      {/* Event Hero Banner with Custom Theme Cover */}
      <section
        className="event-hero"
        style={{
          backgroundImage: `url(${event.theme?.coverImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80'})`
        }}
      >
        <div className="event-hero-overlay" />

        <div className="container event-hero-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              {event.theme?.monogram && (
                <div style={{
                  display: 'inline-block',
                  padding: '3px 12px',
                  borderRadius: 20,
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  background: 'var(--theme-primary, #D4AF37)',
                  color: '#0E1116',
                  marginBottom: 8,
                  letterSpacing: '1px'
                }}>
                  {event.theme.monogram}
                </div>
              )}

              <h1 style={{
                fontSize: 'clamp(1.8rem, 4.5vw, 3rem)',
                fontWeight: 900,
                color: '#FFFFFF',
                margin: '0 0 6px',
                textShadow: '0 2px 10px rgba(0,0,0,0.8)'
              }}>
                {event.name}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.9rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Calendar size={15} /> {event.date}
                </span>
                <span>•</span>
                <span>📸 {media.length} recuerdos compartidos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="container" style={{ marginTop: 28 }}>
        {/* Guest Identity Bar */}
        <div
          className="glass-card"
          style={{
            padding: '12px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'rgba(var(--primary-rgb), 0.15)',
              color: 'var(--theme-primary, #D4AF37)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Participando en el evento como:
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff' }}>
                {guestName || 'Sin nombre aún'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openNamePrompt()}
            className="btn btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          >
            <Edit2 size={14} /> {guestName ? 'Cambiar nombre' : 'Ingresar mi nombre'}
          </button>
        </div>

        {/* Welcome message card from the host */}
        {event.welcomeMessage && (
          <div
            className="glass-card"
            style={{
              padding: '20px 24px',
              marginBottom: 24,
              borderLeft: '4px solid var(--theme-primary, #D4AF37)'
            }}
          >
            <div style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--theme-primary, #D4AF37)',
              marginBottom: 4
            }}>
              Mensaje del Anfitrión:
            </div>
            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5, opacity: 0.95 }}>
              "{event.welcomeMessage}"
            </p>
          </div>
        )}

        {/* If uploads are paused, show notice; otherwise show Live Reactions + Media Uploader */}
        {event.uploadsPaused ? (
          <div
            className="glass-card"
            style={{
              padding: '24px',
              marginBottom: 24,
              textAlign: 'center',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              background: 'rgba(245, 158, 11, 0.08)'
            }}
          >
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.18)',
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <Lock size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 6 }}>
              Subida de recuerdos finalizada
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: 500, marginInline: 'auto' }}>
              El anfitrión ha pausado la recepción de nuevas fotos y videos, pero puedes seguir explorando, votando y descargando todos los recuerdos de la galería.
            </p>
          </div>
        ) : (
          <>
            {/* Live Guest Reaction Bar */}
            <GuestReactionsBar
              slug={slug}
              guestName={guestName}
              onRequireName={(cb) => openNamePrompt(cb)}
            />

            {/* Standalone Dedication Greeting without Photo */}
            <GuestDedicationForm
              slug={slug}
              guestName={guestName}
              onRequireName={(cb) => openNamePrompt(cb)}
            />

            {/* Media Uploader Form */}
            <MediaUploader
              slug={slug}
              allowVideos={event.allowVideos}
              guestName={guestName}
              onGuestNameChange={(newName) => {
                setGuestName(newName);
                if (newName.trim()) {
                  localStorage.setItem('recuerdapp_name', newName.trim());
                }
              }}
              onRequireName={(cb) => openNamePrompt(cb)}
              onUploadSuccess={handleUploadSuccess}
            />
          </>
        )}

        {/* Community Gallery */}
        <MediaGallery
          media={media}
          slug={slug}
          onSelectMedia={(item) => setSelectedMedia(item)}
        />

        {/* Subtle Host / Staff Access Footer */}
        <footer style={{
          marginTop: 60,
          paddingTop: 24,
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          fontSize: '0.78rem',
          color: 'var(--text-muted)'
        }}>
          <span>Desarrollada por Andrés para Joaco </span>
          {onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.35)',
                fontSize: '0.76rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 8px'
              }}
              title="Acceso con PIN para Anfitrión o Moderador/DJ"
            >
              <ShieldCheck size={13} /> Acceso Anfitrión / DJ
            </button>
          )}
        </footer>
      </main>

      {/* Guest Name Onboarding / Prompt Modal */}
      {showNameModal && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }}>
          <div
            className="modal-content glass-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 440, padding: 28, textAlign: 'center' }}
          >
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(var(--primary-rgb), 0.15)',
              color: 'var(--theme-primary, #D4AF37)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Sparkles size={28} />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>
              ¡Bienvenido a {event.name}!
            </h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
              ¿Cómo te llamas? Así tu nombre aparecerá junto a tus fotos, videos y reacciones en la pantalla del evento.
            </p>

            <form onSubmit={handleSaveGuestName}>
              <div className="form-group" style={{ textAlign: 'left', marginBottom: 20 }}>
                <label className="form-label">Tu Nombre o Apodo *</label>
                <input
                  ref={nameInputRef}
                  type="text"
                  required
                  autoFocus
                  className="form-control"
                  placeholder="Ej. Tía Marcela, Joaco, Familia Gómez..."
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  style={{ fontSize: '1.05rem', padding: '14px 16px' }}
                />
              </div>

              <button
                type="submit"
                disabled={!nameInput.trim()}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
              >
                Continuar al Evento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedMedia && (
        <Lightbox
          mediaItem={selectedMedia}
          allMedia={media}
          onClose={() => setSelectedMedia(null)}
          onSelectItem={(item) => setSelectedMedia(item)}
          onNext={() => {
            const idx = media.findIndex((m) => m.id === selectedMedia.id);
            if (idx < media.length - 1) setSelectedMedia(media[idx + 1]);
            else if (media.length > 0) setSelectedMedia(media[0]);
          }}
          onPrev={() => {
            const idx = media.findIndex((m) => m.id === selectedMedia.id);
            if (idx > 0) setSelectedMedia(media[idx - 1]);
            else if (media.length > 0) setSelectedMedia(media[media.length - 1]);
          }}
          onLike={(item) => {
            // Updated in gallery
          }}
        />
      )}
    </div>
  );
}
