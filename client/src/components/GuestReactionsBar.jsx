import React, { useState } from 'react';
import { Sparkles, Heart } from 'lucide-react';
import { emitReaction } from '../utils/socket';
import { playPopSound } from '../utils/audio';

const REACTION_EMOJIS = [
  { emoji: '❤️', label: 'Amor' },
  { emoji: '🎉', label: 'Fiesta' },
  { emoji: '🔥', label: 'Fuego' },
  { emoji: '🎂', label: 'Torta' },
  { emoji: '🥂', label: 'Brindis' },
  { emoji: '👏', label: 'Aplausos' }
];

export default function GuestReactionsBar({ slug, guestName, onRequireName }) {
  const [activeFeedback, setActiveFeedback] = useState(null);

  const sendEmoji = (emoji, nameToUse) => {
    // Play local pop sound
    playPopSound();

    // Broadcast to the projector screen
    emitReaction(slug, emoji, nameToUse);

    // Show quick feedback
    setActiveFeedback(emoji);
    setTimeout(() => setActiveFeedback(null), 1200);

    // Haptic feedback for mobile devices
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(40);
    }
  };

  const handleSendReaction = (emoji) => {
    const cleanName = (guestName || '').trim();
    if (!cleanName) {
      if (onRequireName) {
        onRequireName((enteredName) => sendEmoji(emoji, enteredName));
      }
      return;
    }

    sendEmoji(emoji, cleanName);
  };

  return (
    <div
      className="glass-card"
      style={{
        padding: '16px 20px',
        marginBottom: '24px',
        textAlign: 'center',
        background: 'rgba(24, 28, 36, 0.88)'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        fontSize: '0.85rem',
        fontWeight: 700,
        color: 'var(--theme-primary, #D4AF37)',
        marginBottom: 10,
        letterSpacing: '0.3px'
      }}>
        <Sparkles size={14} /> REACCIONA EN VIVO EN LA PANTALLA GIGANTE
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        flexWrap: 'wrap'
      }}>
        {REACTION_EMOJIS.map((item) => (
          <button
            key={item.emoji}
            onClick={() => handleSendReaction(item.emoji)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '50%',
              width: 48,
              height: 48,
              fontSize: '1.45rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, background 0.15s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(1.25)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onTouchStart={(e) => (e.currentTarget.style.transform = 'scale(1.25)')}
            onTouchEnd={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            title={item.label}
          >
            {item.emoji}
          </button>
        ))}
      </div>

      {activeFeedback && (
        <div style={{
          marginTop: 8,
          fontSize: '0.8rem',
          color: 'var(--theme-primary, #D4AF37)',
          fontWeight: 600,
          animation: 'scaleUp 0.2s ease-out'
        }}>
          ¡{activeFeedback} enviado a la pantalla grande! ✨
        </div>
      )}
    </div>
  );
}
