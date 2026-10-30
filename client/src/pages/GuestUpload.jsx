import React, { useState, useEffect } from 'react';
import { Camera, Calendar, Sparkles, Heart, Share2, Tv, QrCode } from 'lucide-react';
import { fetchEvent, fetchEventMedia } from '../utils/api';
import { getSocket, joinEventRoom, leaveEventRoom } from '../utils/socket';
import { useTheme } from '../context/ThemeContext';
import MediaUploader from '../components/MediaUploader';
import MediaGallery from '../components/MediaGallery';
import Lightbox from '../components/Lightbox';
import GuestReactionsBar from '../components/GuestReactionsBar';

export default function GuestUpload({ slug, onOpenQr, onOpenLive }) {
  const { applyTheme } = useTheme();
  const [event, setEvent] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    loadEventData();

    // Socket.IO real-time listener
    const socket = getSocket();
    joinEventRoom(slug);

    const handleNewMedia = (payload) => {
      if (payload && payload.items) {
        setMedia((prev) => {
          // Avoid duplicates
          const newItems = payload.items.filter((item) => !prev.some((m) => m.id === item.id));
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

    socket.on('new_media', handleNewMedia);
    socket.on('media_liked', handleMediaLiked);
    socket.on('media_deleted', handleMediaDeleted);

    return () => {
      socket.off('new_media', handleNewMedia);
      socket.off('media_liked', handleMediaLiked);
      socket.off('media_deleted', handleMediaDeleted);
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

            <div style={{ display: 'flex', gap: 8 }}>
              {onOpenLive && (
                <button
                  onClick={onOpenLive}
                  className="btn btn-secondary"
                  style={{ backdropFilter: 'blur(10px)', padding: '8px 14px', fontSize: '0.85rem' }}
                  title="Abrir proyector en vivo"
                >
                  <Tv size={16} /> <span className="hide-mobile">Proyector</span>
                </button>
              )}

              {onOpenQr && (
                <button
                  onClick={onOpenQr}
                  className="btn btn-secondary"
                  style={{ backdropFilter: 'blur(10px)', padding: '8px 14px', fontSize: '0.85rem' }}
                  title="Ver QR para compartir"
                >
                  <QrCode size={16} /> <span className="hide-mobile">Código QR</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="container" style={{ marginTop: 28 }}>
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

        {/* Live Guest Reaction Bar */}
        <GuestReactionsBar
          slug={slug}
          guestName={localStorage.getItem('recuerdapp_name') || ''}
        />

        {/* Media Uploader Form */}
        <MediaUploader
          slug={slug}
          allowVideos={event.allowVideos}
          onUploadSuccess={handleUploadSuccess}
        />

        {/* Community Gallery */}
        <MediaGallery
          media={media}
          slug={slug}
          onSelectMedia={(item) => setSelectedMedia(item)}
        />
      </main>

      {/* Lightbox Modal */}
      {selectedMedia && (
        <Lightbox
          mediaItem={selectedMedia}
          allMedia={media}
          onClose={() => setSelectedMedia(null)}
          onNext={() => {
            const idx = media.findIndex((m) => m.id === selectedMedia.id);
            if (idx < media.length - 1) setSelectedMedia(media[idx + 1]);
          }}
          onPrev={() => {
            const idx = media.findIndex((m) => m.id === selectedMedia.id);
            if (idx > 0) setSelectedMedia(media[idx - 1]);
          }}
          onLike={(item) => {
            // Updated in gallery
          }}
        />
      )}
    </div>
  );
}
