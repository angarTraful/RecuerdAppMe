import React, { useState, useEffect } from 'react';
import { Camera, Tv, Sparkles, PlusCircle, ArrowRight, Calendar, Users, ShieldCheck, Heart } from 'lucide-react';
import { fetchAllEvents, createEvent } from '../utils/api';

export default function Home({ onSelectEvent }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [passcode, setPasscode] = useState('1234');
  const [themePreset, setThemePreset] = useState('elegant-gold');
  const [allowVideos, setAllowVideos] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await fetchAllEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!eventName.trim()) return;

    setCreating(true);
    try {
      const newEvent = await createEvent({
        name: eventName.trim(),
        date: eventDate || new Date().toISOString().split('T')[0],
        hostPasscode: passcode,
        themePreset,
        allowVideos
      });
      setShowCreateModal(false);
      onSelectEvent(newEvent.slug);
    } catch (err) {
      alert(err.message || 'Error al crear evento');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 60 }}>
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        padding: '70px 20px 50px',
        textAlign: 'center',
        background: 'radial-gradient(ellipse at top, rgba(212, 175, 55, 0.15) 0%, rgba(14, 17, 22, 1) 70%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div className="container" style={{ maxWidth: 860 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 30,
            background: 'rgba(212, 175, 55, 0.12)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            color: '#D4AF37',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: 20
          }}>
            <Sparkles size={16} /> GALERÍA DE FOTOS Y VIDEOS PARA EVENTOS
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
            fontWeight: 900,
            letterSpacing: '-1px',
            lineHeight: 1.15,
            marginBottom: 20,
            fontFamily: "'Outfit', sans-serif"
          }}>
            Todos los recuerdos de tu evento,<br />
            <span style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #F59E0B 50%, #EC4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              capturados en vivo por tus invitados
            </span>
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: 'var(--text-muted)',
            maxWidth: 680,
            margin: '0 auto 32px',
            lineHeight: 1.6
          }}>
            Tus invitados escanean un código QR o acceden al enlace sin registrarse, suben fotos y videos con dedicatorias, y se proyectan automáticamente en la pantalla de la fiesta.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary btn-lg"
              style={{ padding: '16px 36px', fontSize: '1.05rem' }}
            >
              <PlusCircle size={20} /> Crear mi Evento Gratis
            </button>

            {events.length > 0 && (
              <button
                onClick={() => onSelectEvent(events[0].slug)}
                className="btn btn-secondary btn-lg"
                style={{ padding: '16px 28px' }}
              >
                Ver Evento Demo <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Feature Pills */}
      <section className="container" style={{ marginTop: 40, marginBottom: 50 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20
        }}>
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(212, 175, 55, 0.15)',
              color: '#D4AF37',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14
            }}>
              <Camera size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 6 }}>QR Sin Registro</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Cero barreras: los invitados apuntan su cámara, eligen sus fotos y videos y suben al instante.
            </p>
          </div>

          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(236, 72, 153, 0.15)',
              color: '#EC4899',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14
            }}>
              <Tv size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 6 }}>Modo Proyector en Vivo</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Conecta una pantalla o proyector. Las fotos se proyectan con transiciones cinematográficas y aviso en tiempo real.
            </p>
          </div>

          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14
            }}>
              <Sparkles size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 6 }}>Tema Personalizado</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Colores, tipografías, monogramas y fotos de portada adaptadas al estilo de tu boda o celebración.
            </p>
          </div>
        </div>
      </section>

      {/* Events Directory */}
      <section className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20
        }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Eventos Creados</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Explora o gestiona tus galerías
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.88rem' }}
          >
            <PlusCircle size={16} /> Nuevo Evento
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Cargando eventos...
          </div>
        ) : events.length === 0 ? (
          <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
            <p>No hay eventos creados todavía. ¡Crea el primero!</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20
          }}>
            {events.map((evt) => (
              <div
                key={evt.id}
                className="glass-card glass-card-interactive"
                style={{ cursor: 'pointer', overflow: 'hidden' }}
                onClick={() => onSelectEvent(evt.slug)}
              >
                {/* Event Cover Banner */}
                <div style={{
                  height: 140,
                  position: 'relative',
                  backgroundImage: `url(${evt.theme?.coverImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(14, 17, 22, 0.9) 0%, transparent 80%)'
                  }} />

                  <div style={{
                    position: 'absolute',
                    bottom: 12,
                    left: 16,
                    right: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end'
                  }}>
                    <div className="badge badge-primary" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                      {evt.date}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600 }}>
                      📸 {evt.mediaCount || 0} fotos
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div style={{ padding: 20 }}>
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    marginBottom: 8,
                    fontFamily: evt.theme?.headingFont || "'Outfit', sans-serif"
                  }}>
                    {evt.name}
                  </h3>
                  <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.4,
                    marginBottom: 16,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {evt.welcomeMessage}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--theme-primary, #D4AF37)', fontWeight: 600 }}>
                      Entrar a la galería
                    </span>
                    <ArrowRight size={16} color="var(--theme-primary, #D4AF37)" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal Crear Evento */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div
            className="modal-content glass-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 520, padding: 28 }}
          >
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 6 }}>
              Crear Nuevo Evento
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 20 }}>
              Configura tu fiesta para generar tu enlace y código QR de invitados
            </p>

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre del Evento *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Ej. Boda de Lucas y Sofía / Mis 15 Sol"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha del Evento</label>
                <input
                  type="date"
                  className="form-control"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Código PIN de Anfitrión (para administrar)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. 1234"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estilo / Tema Inicial</label>
                <select
                  className="form-control"
                  value={themePreset}
                  onChange={(e) => setThemePreset(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="elegant-gold">Boda de Oro & Lujo (Elegante)</option>
                  <option value="neon-party">Fiesta Neón & Night Club (Vibrante)</option>
                  <option value="romantic-rose">Romance Rosa & Floral (Romántico)</option>
                  <option value="rustic-boho">Boho Chic & Madera (Rústico)</option>
                  <option value="modern-clean">Minimalista & Moderno (Limpio)</option>
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={allowVideos}
                    onChange={(e) => setAllowVideos(e.target.checked)}
                  />
                  <span>Permitir subida de videos (además de fotos)</span>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: 12 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn btn-primary"
                  style={{ padding: 12 }}
                >
                  {creating ? 'Creando...' : 'Crear Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
