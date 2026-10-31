import React, { useState } from 'react';
import { Heart, Play, Image as ImageIcon, MessageCircle, Video, Hash } from 'lucide-react';
import { likeMediaItem } from '../utils/api';

export default function MediaGallery({ media = [], slug, onSelectMedia }) {
  const [filter, setFilter] = useState('all'); // all, photos, videos
  const [selectedTag, setSelectedTag] = useState('all');
  const [likedIds, setLikedIds] = useState(() => new Set());

  // Extract all unique hashtags from media
  const allHashtags = Array.from(
    new Set(
      media.flatMap((item) => {
        if (Array.isArray(item.tags)) return item.tags;
        if (typeof item.tags === 'string') return item.tags.split(/[\s,]+/).filter(Boolean);
        const matches = (item.caption || '').match(/#[a-zA-Z0-9_\u00C0-\u017F]+/g);
        return matches || [];
      }).map((t) => (t.startsWith('#') ? t : `#${t}`).trim())
    )
  ).filter(Boolean);

  const filteredMedia = media.filter((item) => {
    // Type filter
    if (filter === 'photos' && item.isVideo) return false;
    if (filter === 'videos' && !item.isVideo) return false;

    // Hashtag filter
    if (selectedTag !== 'all') {
      const itemTags = Array.isArray(item.tags)
        ? item.tags.map((t) => t.toLowerCase())
        : (item.tags || '').toLowerCase().split(/[\s,]+/);
      const targetTag = selectedTag.toLowerCase();
      const targetNoHash = targetTag.replace('#', '');
      const hasTag = itemTags.some((t) => t === targetTag || t === targetNoHash);
      const inCaption = (item.caption || '').toLowerCase().includes(targetTag);
      if (!hasTag && !inCaption) return false;
    }

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

      {/* Hashtag Categories Filter */}
      {allHashtags.length > 0 && (
        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 10,
          marginBottom: 18
        }}>
          <button
            type="button"
            onClick={() => setSelectedTag('all')}
            style={{
              padding: '5px 12px',
              borderRadius: 20,
              fontSize: '0.8rem',
              fontWeight: 600,
              border: selectedTag === 'all' ? '1px solid var(--theme-primary, #D4AF37)' : '1px solid rgba(255, 255, 255, 0.12)',
              background: selectedTag === 'all' ? 'rgba(var(--primary-rgb), 0.25)' : 'rgba(255, 255, 255, 0.04)',
              color: selectedTag === 'all' ? 'var(--theme-primary, #D4AF37)' : 'var(--text-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            #Todos
          </button>
          {allHashtags.map((tag) => {
            const isSelected = selectedTag.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(isSelected ? 'all' : tag)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: isSelected ? '1px solid var(--theme-primary, #D4AF37)' : '1px solid rgba(255, 255, 255, 0.12)',
                  background: isSelected ? 'rgba(var(--primary-rgb), 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  color: isSelected ? 'var(--theme-primary, #D4AF37)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}

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
                {item.tags && item.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                    {item.tags.map((t, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          background: 'rgba(var(--primary-rgb), 0.35)',
                          color: 'var(--theme-primary, #D4AF37)',
                          padding: '1px 6px',
                          borderRadius: 6
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
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
