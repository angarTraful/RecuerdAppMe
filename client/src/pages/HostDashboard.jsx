import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Lock, Palette, Image as ImageIcon, Download, Settings,
  QrCode, Trash2, Eye, EyeOff, CheckCircle, RefreshCw, BarChart3, Users, Film,
  Radio, Sparkles, Play, Pause, SkipForward, SkipBack, Cake, Send, LogOut, KeyRound, FileText
} from 'lucide-react';
import {
  fetchEvent, fetchEventMedia, fetchEventStats, updateEvent,
  verifyHostPasscode, updateMediaStatus, deleteMediaItem, getDownloadZipUrl, getDownloadMessagesUrl
} from '../utils/api';
import { emitRemoteControl } from '../utils/socket';
import { useTheme } from '../context/ThemeContext';
import ThemeCustomizer from '../components/ThemeCustomizer';

export default function HostDashboard({ slug, onOpenQr, onOpenLive, onAuthChange }) {
  const { applyTheme } = useTheme();
  const [event, setEvent] = useState(null);
  const [passcode, setPasscode] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(() => {
    return (
      sessionStorage.getItem(`host_auth_${slug}`) === 'true' ||
      sessionStorage.getItem('superadmin_auth') === 'true'
    );
  });
  const [role, setRole] = useState(() => {
    if (sessionStorage.getItem('superadmin_auth') === 'true') return 'superadmin';
    return sessionStorage.getItem(`host_role_${slug}`) || 'host';
  });
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('remote'); // remote, theme, moderation, settings
  const [stats, setStats] = useState(null);
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [liveGreetingText, setLiveGreetingText] = useState('');

  // Editable passcodes in Settings
  const [newHostPin, setNewHostPin] = useState('');
  const [newModeratorPin, setNewModeratorPin] = useState('');

  const isFullHost = role === 'host' || role === 'superadmin';

  useEffect(() => {
    loadDashboard();
  }, [slug, isAuthorized]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const evtData = await fetchEvent(slug);
      setEvent(evtData);
      setLiveGreetingText(evtData.specialGreeting || '');
      if (evtData.theme) applyTheme(evtData.theme);

      if (isAuthorized) {
        const storedPass = getStoredPasscode();
        if (storedPass) {
          try {
            const authInfo = await verifyHostPasscode(slug, storedPass);
            if (authInfo && authInfo.event) {
              setEvent(authInfo.event);
              setRole(authInfo.role || 'host');
              setNewHostPin(authInfo.event.hostPasscode || '');
              setNewModeratorPin(authInfo.event.moderatorPasscode || '');
            }
          } catch (e) {
            // Ignore if offline or fallback
          }
        }

        const [statsData, mediaData] = await Promise.all([
          fetchEventStats(slug),
          fetchEventMedia(slug, true)
        ]);
        setStats(statsData);
        setMediaList(mediaData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoteAction = (action, payload = {}) => {
    emitRemoteControl(slug, action, payload);
    setFeedback({ type: 'success', text: `Comando '${action}' enviado al proyector ✨` });
    setTimeout(() => setFeedback(null), 2500);

    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(35);
    }
  };

  const handleUpdateLiveGreeting = () => {
    if (!liveGreetingText.trim()) return;
    emitRemoteControl(slug, 'update_greeting', { greeting: liveGreetingText.trim() });
    setFeedback({ type: 'success', text: '¡Mensaje en pantalla actualizado!' });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const result = await verifyHostPasscode(slug, passcode);
      if (result && result.authorized) {
        const userRole = result.role || 'host';
        setIsAuthorized(true);
        setRole(userRole);
        sessionStorage.setItem(`host_auth_${slug}`, 'true');
        sessionStorage.setItem(`host_pass_${slug}`, passcode);
        sessionStorage.setItem(`host_role_${slug}`, userRole);
        if (userRole === 'superadmin') {
          sessionStorage.setItem('superadmin_auth', 'true');
          sessionStorage.setItem('superadmin_pass', passcode);
        }
        if (result.event) {
          setEvent(result.event);
          setNewHostPin(result.event.hostPasscode || '');
          setNewModeratorPin(result.event.moderatorPasscode || '');
        }
        if (onAuthChange) onAuthChange();
      }
    } catch (err) {
      setAuthError(err.message || 'Código incorrecto');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(`host_auth_${slug}`);
    sessionStorage.removeItem(`host_pass_${slug}`);
    sessionStorage.removeItem(`host_role_${slug}`);
    setIsAuthorized(false);
    setPasscode('');
    if (onAuthChange) onAuthChange();
    window.location.hash = `#/e/${slug}`;
  };

  const getStoredPasscode = () => {
    return (
      sessionStorage.getItem(`host_pass_${slug}`) ||
      sessionStorage.getItem('superadmin_pass') ||
      passcode ||
      ''
    );
  };

  const handleSaveTheme = async (newTheme) => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const updated = await updateEvent(slug, { theme: newTheme }, getStoredPasscode());
      setEvent(updated);
      applyTheme(newTheme);
      setFeedback({ type: 'success', text: '¡Tema guardado y aplicado con éxito!' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Error al guardar el tema' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGeneralSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      const payload = {
        name: event.name,
        date: event.date,
        welcomeMessage: event.welcomeMessage,
        instructions: event.instructions,
        specialGreeting: event.specialGreeting,
        showGreetingBanner: event.showGreetingBanner,
        allowVideos: event.allowVideos,
        requireModeration: event.requireModeration,
        uploadsPaused: Boolean(event.uploadsPaused)
      };

      if (newHostPin.trim()) {
        payload.hostPasscode = newHostPin.trim();
      }
      payload.moderatorPasscode = newModeratorPin.trim();

      const updated = await updateEvent(slug, payload, getStoredPasscode());
      setEvent(updated);
      if (newHostPin.trim() && role === 'host') {
        sessionStorage.setItem(`host_pass_${slug}`, newHostPin.trim());
      }
      setFeedback({ type: 'success', text: 'Configuración y códigos de acceso actualizados exitosamente' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Error al actualizar configuración' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (item, newStatus) => {
    try {
      await updateMediaStatus(slug, item.id, newStatus, getStoredPasscode());
      setMediaList((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, status: newStatus } : m))
      );
    } catch (err) {
      alert(err.message || 'Error actualizando estado');
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    if (!confirm('¿Estás seguro de eliminar este recuerdo permanentemente?')) return;
    try {
      await deleteMediaItem(slug, mediaId, getStoredPasscode());
      setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
    } catch (err) {
      alert(err.message || 'Error al eliminar');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}>Cargando panel de anfitrión...</div>;
  }

  // Passcode Lock Screen
  if (!isAuthorized) {
    return (
      <div className="container-narrow" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: 40 }}>
          <div style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: 'rgba(var(--primary-rgb), 0.15)',
            color: 'var(--theme-primary, #D4AF37)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Lock size={28} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>
            Acceso Anfitrión / DJ
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>
            Ingresa tu código PIN de Anfitrión Principal o el PIN de Moderador/DJ para controlar el proyector y gestionar la galería.
          </p>

          <form onSubmit={handleLogin} style={{ maxWidth: 320, margin: '0 auto' }}>
            <div className="form-group">
              <input
                type="password"
                className="form-control"
                placeholder="Ingresa tu código PIN"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoFocus
                style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px' }}
              />
            </div>

            {authError && (
              <div style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: 14 }}>
                {authError}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
              Desbloquear Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '30px 20px 80px' }}>
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 26
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={22} color="var(--theme-primary, #D4AF37)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--theme-primary, #D4AF37)', letterSpacing: '0.5px' }}>
              {role === 'superadmin'
                ? 'PANEL DE CONTROL • SUPERADMIN'
                : role === 'moderator'
                  ? 'PANEL DE CONTROL • MODERADOR / DJ'
                  : 'PANEL DE CONTROL DEL ANFITRIÓN'}
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '4px 0 0' }}>
            {event?.name}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {isFullHost && onOpenQr && (
            <button
              onClick={onOpenQr}
              className="btn btn-secondary"
              title="Ver e imprimir Tarjetas QR para las mesas"
              style={{ padding: '10px 16px', fontSize: '0.9rem' }}
            >
              <QrCode size={18} /> Tarjeta QR Mesas
            </button>
          )}

          {isFullHost && (
            <>
              <a
                href={getDownloadMessagesUrl(slug)}
                className="btn btn-secondary"
                title="Descargar libro de dedicatorias y mensajes en un archivo de texto (.txt)"
                style={{ padding: '10px 16px', fontSize: '0.9rem' }}
              >
                <FileText size={18} /> Mensajes (.txt)
              </a>
              <a
                href={getDownloadZipUrl(slug)}
                className="btn btn-secondary"
                title="Descargar álbum completo en ZIP con fotos y videos"
                style={{ padding: '10px 16px', fontSize: '0.9rem' }}
              >
                <Download size={18} /> Álbum Completo (ZIP)
              </a>
            </>
          )}

          {onOpenLive && (
            <button
              onClick={onOpenLive}
              className="btn btn-primary"
              style={{ padding: '10px 18px', fontSize: '0.9rem' }}
            >
              Iniciar Proyector
            </button>
          )}

          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            title="Cerrar sesión de anfitrión en este dispositivo"
            style={{ padding: '10px 14px', fontSize: '0.85rem' }}
          >
            <LogOut size={16} /> Salir
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 28
        }}>
          <div className="glass-card" style={{ padding: 18 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Total Recuerdos</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--theme-primary, #D4AF37)' }}>
              {stats.totalMedia}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {stats.photosCount} fotos • {stats.videosCount} videos
            </div>
          </div>

          <div className="glass-card" style={{ padding: 18 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Invitados Autores</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              {stats.uniqueGuests}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Personas compartiendo</div>
          </div>

          <div className="glass-card" style={{ padding: 18 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Me Gusta Totales</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#EF4444' }}>
              {stats.totalLikes}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reacciones en vivo</div>
          </div>

          <div className="glass-card" style={{ padding: 18 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Almacenamiento</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              {stats.totalSizeMB} MB
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Espacio utilizado</div>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {feedback && (
        <div style={{
          padding: '12px 20px',
          borderRadius: 12,
          marginBottom: 20,
          background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          color: feedback.type === 'success' ? '#34D399' : '#F87171',
          border: `1px solid ${feedback.type === 'success' ? '#10B981' : '#EF4444'}`
        }}>
          {feedback.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: 12,
        marginBottom: 24,
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveTab('remote')}
          className="btn btn-secondary"
          style={{
            background: activeTab === 'remote' ? 'var(--theme-primary, #D4AF37)' : 'transparent',
            color: activeTab === 'remote' ? '#0E1116' : 'var(--text-main)',
            border: 'none',
            fontWeight: activeTab === 'remote' ? 700 : 500
          }}
        >
          <Radio size={16} /> Control Remoto en Vivo
        </button>

        {isFullHost && (
          <button
            onClick={() => setActiveTab('theme')}
            className="btn btn-secondary"
            style={{
              background: activeTab === 'theme' ? 'var(--theme-primary, #D4AF37)' : 'transparent',
              color: activeTab === 'theme' ? '#0E1116' : 'var(--text-main)',
              border: 'none',
              fontWeight: activeTab === 'theme' ? 700 : 500
            }}
          >
            <Palette size={16} /> Personalizar Tema
          </button>
        )}

        <button
          onClick={() => setActiveTab('moderation')}
          className="btn btn-secondary"
          style={{
            background: activeTab === 'moderation' ? 'var(--theme-primary, #D4AF37)' : 'transparent',
            color: activeTab === 'moderation' ? '#0E1116' : 'var(--text-main)',
            border: 'none',
            fontWeight: activeTab === 'moderation' ? 700 : 500
          }}
        >
          <ImageIcon size={16} /> {isFullHost ? `Moderar Galería (${mediaList.length})` : `Ver Galería (${mediaList.length})`}
        </button>

        {isFullHost && (
          <button
            onClick={() => setActiveTab('settings')}
            className="btn btn-secondary"
            style={{
              background: activeTab === 'settings' ? 'var(--theme-primary, #D4AF37)' : 'transparent',
              color: activeTab === 'settings' ? '#0E1116' : 'var(--text-main)',
              border: 'none',
              fontWeight: activeTab === 'settings' ? 700 : 500
            }}
          >
            <Settings size={16} /> Ajustes del Evento
          </button>
        )}
      </div>

      {/* Tab: Remote Control */}
      {activeTab === 'remote' && (
        <div style={{ maxWidth: 650, margin: '0 auto' }}>
          <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Radio size={22} color="var(--theme-primary, #D4AF37)" />
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Control Remoto del Proyector
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  Controla la pantalla grande en tiempo real desde tu teléfono mientras disfrutas de la fiesta
                </p>
              </div>
            </div>

            {/* Main Navigation Touch Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              <button
                onClick={() => handleRemoteAction('prev')}
                className="btn btn-secondary"
                style={{ padding: '16px 10px', flexDirection: 'column', gap: 6, borderRadius: 16 }}
              >
                <SkipBack size={24} />
                <span style={{ fontSize: '0.85rem' }}>Anterior</span>
              </button>

              <button
                onClick={() => handleRemoteAction('toggle_play')}
                className="btn btn-primary"
                style={{ padding: '16px 10px', flexDirection: 'column', gap: 6, borderRadius: 16 }}
              >
                <Play size={24} />
                <span style={{ fontSize: '0.85rem' }}>Pausar / Play</span>
              </button>

              <button
                onClick={() => handleRemoteAction('next')}
                className="btn btn-secondary"
                style={{ padding: '16px 10px', flexDirection: 'column', gap: 6, borderRadius: 16 }}
              >
                <SkipForward size={24} />
                <span style={{ fontSize: '0.85rem' }}>Siguiente</span>
              </button>
            </div>

            {/* Special Event Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
              <button
                onClick={() => handleRemoteAction('confetti')}
                className="btn btn-secondary"
                style={{
                  padding: '16px',
                  borderRadius: 16,
                  border: '1.5px solid #F59E0B',
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#FBBF24',
                  fontWeight: 700
                }}
              >
                <Sparkles size={20} /> ¡Lluvia de Confeti!
              </button>

              <button
                onClick={() => handleRemoteAction('trigger_flash')}
                className="btn btn-secondary"
                style={{
                  padding: '16px',
                  borderRadius: 16,
                  border: '1.5px solid var(--theme-primary, #D4AF37)',
                  background: 'rgba(var(--primary-rgb), 0.12)',
                  color: 'var(--theme-primary, #D4AF37)',
                  fontWeight: 700
                }}
              >
                📸 Disparar Flash Fiesta (5s)
              </button>

              <button
                onClick={() => {
                  handleRemoteAction('confetti');
                  handleRemoteAction('toast', { message: '🎂 ¡MOMENTO DE LA TORTA & BRINDIS! 🥂' });
                }}
                className="btn btn-secondary"
                style={{
                  padding: '16px',
                  borderRadius: 16,
                  border: '1.5px solid #EC4899',
                  background: 'rgba(236, 72, 153, 0.12)',
                  color: '#F472B6',
                  fontWeight: 700,
                  gridColumn: '1 / -1'
                }}
              >
                <Cake size={20} /> 🎂 ¡Momento Torta & Brindis! (Confeti + Cartel)
              </button>
            </div>

            {/* Live Screen Banner updater */}
            <div style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <label className="form-label">Mensaje de Felicitación en Pantalla (En Vivo):</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. 🎉 ¡Felices 18 Joaco! 🎂"
                  value={liveGreetingText}
                  onChange={(e) => setLiveGreetingText(e.target.value)}
                />
                <button
                  onClick={handleUpdateLiveGreeting}
                  className="btn btn-primary"
                  style={{ whiteSpace: 'nowrap', padding: '10px 18px' }}
                >
                  <Send size={16} /> Mostrar
                </button>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                Se actualiza al instante en la parte superior del proyector.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Theme Customizer */}
      {activeTab === 'theme' && (
        <ThemeCustomizer
          currentTheme={event.theme}
          onSave={handleSaveTheme}
          isSaving={isSaving}
        />
      )}

      {/* Tab: Moderation */}
      {activeTab === 'moderation' && (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              {isFullHost
                ? 'Administra las fotos que aparecen en el proyector y en la galería pública. Puedes ocultar o eliminar cualquier elemento.'
                : 'Explora todas las fotos y videos del evento en tiempo real. Modo visualización para DJ/Moderador.'}
            </p>
            <button onClick={loadDashboard} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
              <RefreshCw size={14} /> Actualizar
            </button>
          </div>

          {!isFullHost && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: 18,
              fontSize: '0.85rem',
              color: 'var(--text-muted)'
            }}>
              🎧 <strong>Modo DJ / Visualización:</strong> Puedes ver en vivo todos los recuerdos subidos y sus dedicatorias. Las acciones de moderar (aprobar, ocultar y eliminar) están reservadas al Anfitrión Principal.
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16
          }}>
            {mediaList.map((item) => (
              <div key={item.id} className="glass-card" style={{ overflow: 'hidden' }}>
                <div style={{ height: 190, position: 'relative', background: '#000' }}>
                  {item.isVideo ? (
                    <video src={item.url} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <img src={item.url} alt={item.uploaderName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}

                  <div style={{ position: 'absolute', top: 10, left: 10 }}>
                    <span
                      className="badge"
                      style={{
                        background: item.status === 'approved' ? 'rgba(16, 185, 129, 0.85)' : 'rgba(239, 68, 68, 0.85)',
                        color: '#fff'
                      }}
                    >
                      {item.status === 'approved' ? 'Visible en Proyector' : 'Oculto'}
                    </span>
                  </div>
                </div>

                <div style={{ padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 700, marginBottom: 4 }}>
                    <span>{item.uploaderName}</span>
                    <span style={{ color: '#EF4444' }}>❤️ {item.likes || 0}</span>
                  </div>

                  {item.caption && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 10 }}>
                      "{item.caption}"
                    </div>
                  )}

                  {isFullHost && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      {item.status === 'approved' ? (
                        <button
                          onClick={() => handleToggleStatus(item, 'hidden')}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        >
                          <EyeOff size={14} /> Ocultar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(item, 'approved')}
                          className="btn btn-primary"
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        >
                          <Eye size={14} /> Aprobar
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteMedia(item.id)}
                        className="btn btn-danger"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        title="Eliminar permanentemente"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && isFullHost && (
        <div className="glass-card" style={{ maxWidth: 650, padding: 28 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 20 }}>
            Configuración General del Evento
          </h3>

          <form onSubmit={handleSaveGeneralSettings}>
            <div className="form-group">
              <label className="form-label">Nombre del Evento:</label>
              <input
                type="text"
                className="form-control"
                value={event.name}
                onChange={(e) => setEvent({ ...event, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fecha:</label>
              <input
                type="date"
                className="form-control"
                value={event.date}
                onChange={(e) => setEvent({ ...event, date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mensaje de Bienvenida para Invitados:</label>
              <textarea
                className="form-control"
                value={event.welcomeMessage}
                onChange={(e) => setEvent({ ...event, welcomeMessage: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mensaje Destacado de Felicitación (Proyector):</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. 🎉 ¡Felices 18 Joaco! 🎂 / 💍 ¡Vivan los Novios! 🥂"
                value={event.specialGreeting || ''}
                onChange={(e) => setEvent({ ...event, specialGreeting: e.target.value })}
              />
            </div>

            {/* Event Access PINs */}
            <div style={{
              padding: '16px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.95rem', marginBottom: 12, color: 'var(--theme-primary, #D4AF37)' }}>
                <KeyRound size={16} /> Códigos de Acceso y Roles
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">PIN Principal de Anfitrión (Control Total):</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. 1234"
                    value={newHostPin}
                    onChange={(e) => setNewHostPin(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">PIN de Moderador / DJ (Opcional):</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Vacío = desactivado (Ej. 0000)"
                    value={newModeratorPin}
                    onChange={(e) => setNewModeratorPin(e.target.value)}
                  />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                    Solo da acceso a Proyector, Control Remoto y Moderación.
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={event.showGreetingBanner !== false}
                  onChange={(e) => setEvent({ ...event, showGreetingBanner: e.target.checked })}
                />
                <span>Mostrar cápsula de felicitación en la parte superior del proyector</span>
              </label>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={event.allowVideos}
                  onChange={(e) => setEvent({ ...event, allowVideos: e.target.checked })}
                />
                <span>Permitir a los invitados subir videos (hasta 150MB)</span>
              </label>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={event.requireModeration}
                  onChange={(e) => setEvent({ ...event, requireModeration: e.target.checked })}
                />
                <span>Moderar antes de mostrar (las fotos requieren aprobación antes de proyectarse)</span>
              </label>
            </div>

            <div style={{
              marginBottom: 24,
              padding: '12px 14px',
              borderRadius: 10,
              background: event.uploadsPaused ? 'rgba(245, 158, 11, 0.14)' : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${event.uploadsPaused ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.92rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={Boolean(event.uploadsPaused)}
                  onChange={(e) => setEvent({ ...event, uploadsPaused: e.target.checked })}
                />
                <span>⏸️ Pausar recepción de nuevas fotos, videos y reacciones (Cierre de fiesta)</span>
              </label>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: 4, marginLeft: 24 }}>
                La galería seguirá abierta para que los invitados puedan ver, dar me gusta y descargar los recuerdos.
              </span>
            </div>

            {/* Direct Export Card */}
            <div style={{
              marginBottom: 24,
              padding: '16px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--theme-primary, #D4AF37)' }}>
                <Download size={18} /> Exportar Recuerdos y Dedicatorias
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                Descarga una copia de seguridad con todos los mensajes de cariño de tus invitados o el álbum fotográfico completo en máxima calidad.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a
                  href={getDownloadMessagesUrl(slug)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem', padding: '8px 14px' }}
                >
                  <FileText size={16} /> Descargar Libro de Dedicatorias (.txt)
                </a>
                <a
                  href={getDownloadZipUrl(slug)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem', padding: '8px 14px' }}
                >
                  <Download size={16} /> Descargar Álbum Completo (ZIP)
                </a>
              </div>
            </div>

            <button type="submit" disabled={isSaving} className="btn btn-primary" style={{ padding: '12px 24px' }}>
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
