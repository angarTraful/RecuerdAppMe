import React, { useEffect } from 'react';

export default function FloatingReactions({ reactions = [], onComplete }) {
  useEffect(() => {
    if (reactions.length === 0) return;
    const timer = setTimeout(() => {
      // Remove older reactions after animation finishes
      if (onComplete) onComplete();
    }, 4500);
    return () => clearTimeout(timer);
  }, [reactions, onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1030,
        overflow: 'hidden'
      }}
    >
      {reactions.map((r) => (
        <div
          key={r.id}
          style={{
            position: 'absolute',
            bottom: '-40px',
            left: `${r.x}%`,
            fontSize: `${r.size}rem`,
            animation: `floatUpAndFade ${r.duration}s cubic-bezier(0.25, 1, 0.5, 1) forwards`,
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.45))',
            userSelect: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <span>{r.emoji}</span>
          {r.uploaderName && (
            <span
              style={{
                fontSize: '0.7rem',
                color: '#fff',
                background: 'rgba(0,0,0,0.7)',
                padding: '2px 8px',
                borderRadius: 10,
                marginTop: 2,
                whiteSpace: 'nowrap'
              }}
            >
              {r.uploaderName}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
