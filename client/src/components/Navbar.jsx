import React from 'react';
import { Camera, Tv, ShieldCheck, QrCode, Home, Sparkles } from 'lucide-react';

export default function Navbar({ event, currentTab, onTabChange, onOpenQr }) {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'rgba(14, 17, 22, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '12px 20px'
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Brand */}
        <a 
          href="/" 
          onClick={(e) => { e.preventDefault(); window.location.hash = '#/'; }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: 'linear-gradient(135deg, var(--theme-primary, #D4AF37), var(--theme-accent, #F59E0B))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0E1116',
            boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.3)'
          }}>
            <Camera size={20} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 6 }}>
              RecuerdApp<span style={{ color: 'var(--theme-primary, #D4AF37)' }}>Me</span>
            </div>
            {event && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {event.name}
              </div>
            )}
          </div>
        </a>

        {/* Navigation tabs if on an event */}
        {event ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px',
            borderRadius: 14,
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              onClick={() => onTabChange('guest')}
              className="btn btn-secondary"
              style={{
                padding: '8px 14px',
                fontSize: '0.85rem',
                borderRadius: 10,
                background: currentTab === 'guest' ? 'var(--theme-primary, #D4AF37)' : 'transparent',
                color: currentTab === 'guest' ? '#0E1116' : 'var(--text-main)',
                border: 'none',
                fontWeight: currentTab === 'guest' ? 700 : 500
              }}
            >
              <Camera size={16} />
              <span className="hide-mobile">Invitados</span>
            </button>

            <button
              onClick={() => onTabChange('live')}
              className="btn btn-secondary"
              style={{
                padding: '8px 14px',
                fontSize: '0.85rem',
                borderRadius: 10,
                background: currentTab === 'live' ? 'var(--theme-primary, #D4AF37)' : 'transparent',
                color: currentTab === 'live' ? '#0E1116' : 'var(--text-main)',
                border: 'none',
                fontWeight: currentTab === 'live' ? 700 : 500
              }}
              title="Abrir proyector en pantalla completa"
            >
              <Tv size={16} />
              <span>Proyector</span>
            </button>

            <button
              onClick={() => onTabChange('admin')}
              className="btn btn-secondary"
              style={{
                padding: '8px 14px',
                fontSize: '0.85rem',
                borderRadius: 10,
                background: currentTab === 'admin' ? 'var(--theme-primary, #D4AF37)' : 'transparent',
                color: currentTab === 'admin' ? '#0E1116' : 'var(--text-main)',
                border: 'none',
                fontWeight: currentTab === 'admin' ? 700 : 500
              }}
              title="Panel del Anfitrión"
            >
              <ShieldCheck size={16} />
              <span className="hide-mobile">Anfitrión</span>
            </button>

            {onOpenQr && (
              <button
                onClick={onOpenQr}
                className="btn btn-secondary"
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: 'none'
                }}
                title="Ver y descargar Tarjeta QR para mesas"
              >
                <QrCode size={16} />
              </button>
            )}
          </div>
        ) : (
          <div>
            <a
              href="#/"
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.88rem' }}
            >
              <Home size={16} /> Inicio
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
