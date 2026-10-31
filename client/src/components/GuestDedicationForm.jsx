import React, { useState } from 'react';
import { Send, Heart, Sparkles, MessageCircleHeart, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sendDedication } from '../utils/api';
import { emitDedication } from '../utils/socket';

export default function GuestDedicationForm({ slug, guestName, onRequireName }) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanMsg = message.trim();
    if (!cleanMsg) return;

    const performSend = async (authorToUse) => {
      setIsSending(true);
      try {
        await sendDedication(slug, authorToUse, cleanMsg);
        emitDedication(slug, authorToUse, cleanMsg);

        // Confetti effect
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#EC4899', '#F59E0B', '#D4AF37', '#10B981']
        });

        setMessage('');
        setSentSuccess(true);
        setTimeout(() => setSentSuccess(false), 5000);
      } catch (err) {
        console.error('Error sending dedication:', err);
        alert(err.message || 'Error al enviar dedicatoria');
      } finally {
        setIsSending(false);
      }
    };

    if (!guestName || !guestName.trim()) {
      if (onRequireName) {
        onRequireName((enteredName) => {
          performSend(enteredName);
        });
      } else {
        alert('Por favor ingresa tu nombre antes de enviar tu dedicatoria');
      }
      return;
    }

    await performSend(guestName.trim());
  };

  return (
    <div className="glass-card" style={{ padding: '22px 24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'rgba(236, 72, 153, 0.15)',
          color: '#EC4899',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <MessageCircleHeart size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
            Enviar Saludo a la Pantalla Gigante
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            Escribe tu dedicatoria y aparecerá en vivo durante 5 segundos
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <textarea
            className="form-control"
            rows={2}
            maxLength={180}
            placeholder="Ej. ¡Muchas felicidades Joaco, te amamos un montón! A disfrutar con todo ❤️🥂"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSending}
            style={{
              resize: 'none',
              paddingRight: 60,
              fontSize: '0.95rem',
              lineHeight: 1.4
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: 8,
            right: 12,
            fontSize: '0.75rem',
            color: message.length > 150 ? '#F59E0B' : 'var(--text-muted)'
          }}>
            {message.length}/180
          </div>
        </div>

        {sentSuccess && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 8,
            marginBottom: 12,
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34D399',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.88rem'
          }}>
            <CheckCircle size={16} />
            <span>¡Tu saludo fue proyectado en la pantalla en vivo por 5 segundos! ✨🎉</span>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-secondary"
          disabled={isSending || !message.trim()}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '0.95rem',
            fontWeight: 700,
            border: '1.5px solid rgba(236, 72, 153, 0.5)',
            background: 'rgba(236, 72, 153, 0.12)',
            color: '#F472B6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          <Send size={16} />
          <span>{isSending ? 'Enviando a la pantalla...' : 'Enviar Saludo a la Pantalla Gigante (5s) ✨'}</span>
        </button>
      </form>
    </div>
  );
}

