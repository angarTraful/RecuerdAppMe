import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Download, Calendar, User, Play, Pause } from 'lucide-react';

export default function Lightbox({ mediaItem, allMedia = [], onClose, onNext, onPrev, onLike, onSelectItem }) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!mediaItem) return null;

  const currentIndex = allMedia.findIndex((m) => m.id === mediaItem.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allMedia.length - 1;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasNext, hasPrev, onClose, onNext, onPrev]);

  useEffect(() => {
    if (!isPlaying || allMedia.length <= 1) return;

    const duration = mediaItem.isVideo ? 10000 : 4000;
    const timer = setTimeout(() => {
      if (hasNext) {
        onNext();
      } else if (onSelectItem && allMedia.length > 0) {
        onSelectItem(allMedia[0]);
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, hasNext, mediaItem.isVideo, allMedia, onNext, onSelectItem]);

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px'
      }}
    >
      {/* Top Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 1100,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#fff',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
            {currentIndex + 1} de {allMedia.length}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {allMedia.length > 1 && (
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className={isPlaying ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              title={isPlaying ? 'Pausar presentación' : 'Reproducir presentación automática'}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              <span className="hide-mobile">{isPlaying ? 'Pausar' : 'Presentación'}</span>
            </button>
          )}
          <a
            href={mediaItem.url}
            download={mediaItem.originalName || mediaItem.filename}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            title="Descargar archivo original"
          >
            <Download size={16} /> <span className="hide-mobile">Descargar</span>
          </a>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-icon"
            style={{ width: 38, height: 38 }}
            title="Cerrar (Esc)"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 1100,
          height: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Prev Button */}
        {hasPrev && (
          <button
            onClick={onPrev}
            style={{
              position: 'absolute',
              left: 10,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              width: 44,
              height: 44,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Media content */}
        {mediaItem.isVideo ? (
          <video
            src={mediaItem.url}
            controls
            autoPlay
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: 12
            }}
          />
        ) : (
          <img
            src={mediaItem.url}
            alt={mediaItem.caption || 'Foto'}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,0.7)'
            }}
          />
        )}

        {/* Next Button */}
        {hasNext && (
          <button
            onClick={onNext}
            style={{
              position: 'absolute',
              right: 10,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              width: 44,
              height: 44,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Bottom Info Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 1100,
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem', fontWeight: 700 }}>
            <User size={16} color="var(--theme-primary, #D4AF37)" />
            <span>{mediaItem.uploaderName || 'Invitado anónimo'}</span>
            {mediaItem.createdAt && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>
                • {new Date(mediaItem.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {mediaItem.caption && (
            <div style={{ fontSize: '0.9rem', color: 'var(--theme-secondary, #E8D5B5)', fontStyle: 'italic', marginTop: 4 }}>
              "{mediaItem.caption}"
            </div>
          )}
        </div>

        <button
          onClick={() => onLike && onLike(mediaItem)}
          className="btn btn-secondary"
          style={{ padding: '8px 16px', borderRadius: 20 }}
        >
          <Heart size={16} color="#EF4444" fill="#EF4444" />
          <span>{mediaItem.likes || 0} Me gusta</span>
        </button>
      </div>
    </div>
  );
}
