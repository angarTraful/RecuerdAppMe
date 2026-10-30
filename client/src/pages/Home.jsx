import React, { useState, useEffect } from 'react';
import {
  Camera, Tv, Sparkles, PlusCircle, ArrowRight, Calendar, Users,
  ShieldCheck, Heart, Lock, Trash2, KeyRound, LogOut, Settings, CheckCircle
} from 'lucide-react';
import {
  fetchAllEvents, createEvent, verifyMasterPasscode,
  updateMasterPasscode, deleteEvent
} from '../utils/api';

export default function Home({ onSelectEvent, onAuthChange }) {
  const [isSuperAdmin, setIsSuperAdmin] = useState(() => {
    return sessionStorage.getItem('superadmin_auth') === 'true';
  });
  const [masterPassInput, setMasterPassInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMasterPassModal, setShowMasterPassModal] = useState(false);
  const [deleteTargetEvent, setDeleteTargetEvent] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Master passcode change state
  const [currentMasterPass, setCurrentMasterPass] = useState('');
  const [newMasterPass, setNewMasterPass] = useState('');
  const [masterPassFeedback, setMasterPassFeedback] = useState(null);

  // Form state for new event
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [passcode, setPasscode] = useState('1234');
  const [moderatorPasscode, setModeratorPasscode] = useState('0000');
  const [themePreset, setThemePreset] = useState('elegant-gold');
  const [allowVideos, setAllowVideos] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) {
      loadEvents();
    } else {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  const getStoredMasterPass = () => {
    return sessionStorage.getItem('superadmin_pass') || masterPassInput || '';
  };

  const handleMasterLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const authorized = await verifyMasterPasscode(masterPassInput.trim());
      if (authorized) {
        sessionStorage.setItem('superadmin_auth', 'true');
        sessionStorage.setItem('superadmin_pass', masterPassInput.trim());
        setIsSuperAdmin(true);
        if (onAuthChange) onAuthChange();
      }
    } catch (err) {
      setAuthError(err.message || 'Clave Maestra incorrecta');
    }
  };

  const handleMasterLogout = () => {
    sessionStorage.removeItem('superadmin_auth');
    sessionStorage.removeItem('superadmin_pass');
    setIsSuperAdmin(false);
    setMasterPassInput('');
    if (onAuthChange) onAuthChange();
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
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
        hostPasscode: passcode.trim() || '1234',
        moderatorPasscode: moderatorPasscode.trim(),
        masterPasscode: getStoredMasterPass(),
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

  const handleChangeMasterPass = async (e) => {
    e.preventDefault();
    setMasterPassFeedback(null);
    try {
      await updateMasterPasscode(currentMasterPass.trim(), newMasterPass.trim());
      sessionStorage.setItem('superadmin_pass', newMasterPass.trim());
      setMasterPassFeedback({ type: 'success', text: '¡Clave Maestra actualizada con éxito!' });
      setCurrentMasterPass('');
      setNewMasterPass('');
      setTimeout(() => {
        setShowMasterPassModal(false);
        setMasterPassFeedback(null);
      }, 1500);
    } catch (err) {
      setMasterPassFeedback({ type: 'error', text: err.message || 'Error al actualizar la Clave Maestra' });
    }
  };

  const handleConfirmDeleteEvent = async (e) => {
    e.preventDefault();
    if (!deleteTargetEvent) return;
    if (deleteConfirmText.trim().toLowerCase() !== deleteTargetEvent.slug.toLowerCase()) {
      alert(`Por favor escribe "${deleteTargetEvent.slug}" para confirmar la eliminación.`);
      return;
    }

    setDeleting(true);
    try {
      await deleteEvent(deleteTargetEvent.slug, getStoredMasterPass());
      setEvents((prev) => prev.filter((ev) => ev.slug !== deleteTargetEvent.slug));
      setDeleteTargetEvent(null);
      setDeleteConfirmText('');
    } catch (err) {
      alert(err.message || 'Error al eliminar el evento');
    } finally {
      setDeleting(false);
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
            {isSuperAdmin && (
              <>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary btn-lg"
                  style={{ padding: '16px 36px', fontSize: '1.05rem' }}
                >
                  <PlusCircle size={20} /> Crear Nuevo Evento
                </button>

                <button
                  onClick={() => setShowMasterPassModal(true)}
                  className="btn btn-secondary btn-lg"
                  style={{ padding: '16px 24px', fontSize: '0.95rem' }}
                >
                  <KeyRound size={18} /> Cambiar Clave Maestra
                </button>

                <button
                  onClick={handleMasterLogout}
                  className="btn btn-secondary btn-lg"
                  style={{ padding: '16px 24px', fontSize: '0.95rem' }}
                >
                  <LogOut size={18} /> Cerrar Sesión Admin
                </button>
              </>
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

      {/* Protected SuperAdmin Directory OR Master Login */}
      <section className="container">
        {!isSuperAdmin ? (
          <div className="container-narrow" style={{ padding: '10px 0 40px', textAlign: 'center' }}>
            <div className="glass-card" style={{ padding: 36, maxWidth: 460, margin: '0 auto' }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(212, 175, 55, 0.15)',
                color: '#D4AF37',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Lock size={26} />
              </div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>
                Administración del Sistema
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24, lineHeight: 1.5 }}>
                Ingresa la <strong>Clave Maestra</strong> para ver el listado de eventos, crear nuevos eventos o eliminar eventos existentes.
              </p>

              <form onSubmit={handleMasterLogin}>
                <div className="form-group">
                  <input
                    type="password"
                    required
                    className="form-control"
                    placeholder="Clave Maestra del Sistema"
                    value={masterPassInput}
                    onChange={(e) => setMasterPassInput(e.target.value)}
                    style={{ textAlign: 'center', fontSize: '1.1rem', letterSpacing: '2px' }}
                  />
                </div>

                {authError && (
                  <div style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: 14 }}>
                    {authError}
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                  <ShieldCheck size={18} /> Desbloquear Directorio de Eventos
                </button>
              </form>
            </div>
          </div>
        ) : (
          <>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 20
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={18} color="#D4AF37" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#D4AF37', letterSpacing: '0.5px' }}>
                    MODO SUPERADMIN ACTIVO
                  </span>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Eventos Creados ({events.length})</h2>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowMasterPassModal(true)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                >
                  <KeyRound size={15} /> Clave Maestra
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                >
                  <PlusCircle size={16} /> Nuevo Evento
                </button>
              </div>
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
                    style={{ cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
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

                      {/* SuperAdmin Delete Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTargetEvent(evt);
                          setDeleteConfirmText('');
                        }}
                        className="btn btn-danger"
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          padding: '6px 10px',
                          fontSize: '0.78rem',
                          borderRadius: 10,
                          zIndex: 5
                        }}
                        title="Eliminar evento y todos sus archivos"
                      >
                        <Trash2 size={14} />
                      </button>

                      {evt.uploadsPaused && (
                        <div style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          background: 'rgba(245, 158, 11, 0.9)',
                          color: '#0E1116',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: 20
                        }}>
                          ⏸️ Subidas Pausadas
                        </div>
                      )}

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
                          📸 {evt.mediaCount || 0} recuerdos
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
                          Entrar / Administrar
                        </span>
                        <ArrowRight size={16} color="var(--theme-primary, #D4AF37)" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">PIN Principal Anfitrión *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="Ej. 1234"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">PIN Moderador / DJ (Opcional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. 0000"
                    value={moderatorPasscode}
                    onChange={(e) => setModeratorPasscode(e.target.value)}
                  />
                </div>
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

      {/* Modal Cambiar Clave Maestra */}
      {showMasterPassModal && (
        <div className="modal-backdrop" onClick={() => setShowMasterPassModal(false)}>
          <div
            className="modal-content glass-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 440, padding: 28 }}
          >
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 6 }}>
              Cambiar Clave Maestra
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: 18 }}>
              Actualiza la clave de SuperAdmin del sistema (se guardará de forma persistente).
            </p>

            <form onSubmit={handleChangeMasterPass}>
              <div className="form-group">
                <label className="form-label">Clave Maestra Actual *</label>
                <input
                  type="password"
                  required
                  className="form-control"
                  value={currentMasterPass}
                  onChange={(e) => setCurrentMasterPass(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nueva Clave Maestra *</label>
                <input
                  type="password"
                  required
                  minLength={4}
                  className="form-control"
                  placeholder="Mínimo 4 caracteres"
                  value={newMasterPass}
                  onChange={(e) => setNewMasterPass(e.target.value)}
                />
              </div>

              {masterPassFeedback && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  marginBottom: 14,
                  fontSize: '0.85rem',
                  background: masterPassFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: masterPassFeedback.type === 'success' ? '#34D399' : '#F87171'
                }}>
                  {masterPassFeedback.text}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowMasterPassModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: 12 }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: 12 }}>
                  Actualizar Clave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación de Evento */}
      {deleteTargetEvent && (
        <div className="modal-backdrop" onClick={() => setDeleteTargetEvent(null)}>
          <div
            className="modal-content glass-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 460, padding: 28, border: '1px solid rgba(239, 68, 68, 0.4)' }}
          >
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#F87171', marginBottom: 8 }}>
              ⚠️ Eliminar Evento Permanentemente
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
              Estás por eliminar el evento <strong>"{deleteTargetEvent.name}"</strong> y borrar todas sus fotos y videos del servidor. Esta acción no se puede deshacer.
            </p>

            <form onSubmit={handleConfirmDeleteEvent}>
              <div className="form-group">
                <label className="form-label">
                  Escribe <span style={{ color: '#fff', fontFamily: 'monospace' }}>{deleteTargetEvent.slug}</span> para confirmar:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="form-control"
                  placeholder={deleteTargetEvent.slug}
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setDeleteTargetEvent(null)}
                  className="btn btn-secondary"
                  style={{ padding: 12 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={deleting || deleteConfirmText.trim().toLowerCase() !== deleteTargetEvent.slug.toLowerCase()}
                  className="btn btn-danger"
                  style={{ padding: 12, fontWeight: 700 }}
                >
                  {deleting ? 'Eliminando...' : 'Eliminar Definitivamente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
