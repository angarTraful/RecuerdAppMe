import React, { useState } from 'react';
import { Heart, Play, Image as ImageIcon, MessageCircle, Video } from 'lucide-react';
import { likeMediaItem } from '../utils/api';

export default function MediaGallery({ media = [], slug, onSelectMedia }) {
  const [filter, setFilter] = useState('all'); // all, photos, videos
  const [likedIds, setLikedIds] = useState(() => new Set());

  const filteredMedia = media.filter((item) => {
    if (filter === 'photos') return !item.isVideo;
    if (filter === 'videos') return item.isVideo;
    return true;
  });

  const handleLike = async (e, item) => {
    e.stopPropagation();
    if (likedIds.has(item.id)) return; // already liked in current session

    setLikedIds((prev) => new Set([...prev, item.id]));
    try {
      await likeMediaItem(slug, item.id);
      item.likes = (item.likes || 0) + 1;
    } catch (err) {
      console.error('Error liking media item:', err);
    }
  };

  return (
    <div>
      {/* Filters & Count */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20
      }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Galería de Recuerdos</span>
          <span className="badge badge-primary" style={{ fontSize: '0.8rem' }}>
            {filteredMedia.length}
          </span>
        </div>

        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.06)',
          padding: 3,
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '6px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              borderRadius: 9,
              border: 'none',
              cursor: 'pointer',
              background: filter === 'all' ? 'var(--theme-primary, #D4AF37)' : 'transparent',
              color: filter === 'all' ? '#0E1116' : 'var(--text-main)'
            }}
          >
            Todos ({media.length})
          </button>
          <button
            onClick={() => setFilter('photos')}
            style={{
              padding: '6px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              borderRadius: 9,
              border: 'none',
              cursor: 'pointer',
              background: filter === 'photos' ? 'var(--theme-primary, #D4AF37)' : 'transparent',
              color: filter === 'photos' ? '#0E1116' : 'var(--text-main)'
            }}
          >
            Fotos ({media.filter(m => !m.isVideo).length})
          </button>
          <button
            onClick={() => setFilter('videos')}
            style={{
              padding: '6px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              borderRadius: 9,
              border: 'none',
              cursor: 'pointer',
              background: filter === 'videos' ? 'var(--theme-primary, #D4AF37)' : 'transparent',
              color: filter === 'videos' ? '#0E1116' : 'var(--text-main)'
            }}
          >
            Videos ({media.filter(m => m.isVideo).length})
          </button>
        </div>
      </div>

      {/* Grid */}
      {filteredMedia.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--text-muted)'
          }}>
            <ImageIcon size={32} />
          </div>
          <h4 style={{ fontSize: '1.2rem', marginBottom: 6 }}>Aún no hay fotos o videos</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto' }}>
            ¡Sé el primero en compartir un momento usando el formulario de arriba!
          </p>
        </div>
      ) : (
        <div className="media-grid">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="media-card"
              onClick={() => onSelectMedia(item)}
            >
              {item.isVideo ? (
                <video
                  src={item.url}
                  preload="metadata"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <img
                  src={item.url}
                  alt={item.caption || item.uploaderName || 'Foto del evento'}
                  loading="lazy"
                />
              )}

              {/* Video icon indicator */}
              {item.isVideo && (
                <div style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  background: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  zIndex: 2
                }}>
                  <Play size={14} fill="#fff" />
                </div>
              )}

              {/* Heart like button */}
              <button
                type="button"
                onClick={(e) => handleLike(e, item)}
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  background: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(4px)',
                  border: 'none',
                  borderRadius: 20,
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  color: likedIds.has(item.id) ? '#EF4444' : '#fff',
                  cursor: 'pointer',
                  zIndex: 2,
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                <Heart size={14} fill={likedIds.has(item.id) ? '#EF4444' : 'none'} />
                <span>{item.likes || 0}</span>
              </button>

              {/* Bottom Card Overlay info */}
              <div className="media-card-overlay">
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                  {item.uploaderName}
                </div>
                {item.caption && (
                  <div style={{
                    fontSize: '0.8rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontStyle: 'italic',
                    marginTop: 2
                  }}>
                    "{item.caption}"
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
