import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  Play, Pause, SkipForward, SkipBack, Maximize, Minimize,
  QrCode, Volume2, VolumeX, Sparkles, Settings, X, ArrowLeft,
  Crown, Heart, BellRing, BellOff, Cake
} from 'lucide-react';
import { fetchEvent, fetchEventMedia } from '../utils/api';
import { getSocket, joinEventRoom, leaveEventRoom } from '../utils/socket';
import { useTheme } from '../context/ThemeContext';
import { playCameraShutterSound, playCelebrationChime, playPopSound } from '../utils/audio';
import FloatingReactions from '../components/FloatingReactions';

export default function LiveSlideshow({ slug, onExit }) {
  const { applyTheme } = useTheme();
  const [event, setEvent] = useState(null);
  const [mediaList, setMediaList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [intervalSec, setIntervalSec] = useState(6);
  const [isMuted, setIsMuted] = useState(true);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [showHybridStrip, setShowHybridStrip] = useState(true);
  const [kenBurns, setKenBurns] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // New features state
  const [flashFiestaItem, setFlashFiestaItem] = useState(null);
  const [flashFiestaRemaining, setFlashFiestaRemaining] = useState(8);
  const [liveReactions, setLiveReactions] = useState([]);
  const [greetingText, setGreetingText] = useState('');
  const [remoteToast, setRemoteToast] = useState(null);

  const controlsTimeoutRef = useRef(null);
  const videoRef = useRef(null);
  const flashTimerRef = useRef(null);
  const mediaListRef = useRef([]);
  const currentIndexRef = useRef(0);
  const soundEffectsRef = useRef(true);
  const fullUrl = `${window.location.origin}/#/e/${slug}`;

  useEffect(() => {
    mediaListRef.current = mediaList;
  }, [mediaList]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    soundEffectsRef.current = soundEffectsEnabled;
  }, [soundEffectsEnabled]);

  const handleReactionsComplete = useCallback(() => {
    setLiveReactions((prev) => prev.slice(5));
  }, []);

  const handleNext = useCallback(() => {
    setMediaList((list) => {
      if (list.length > 0) {
        setCurrentIndex((prev) => (prev + 1) % list.length);
      }
      return list;
    });
  }, []);

  const handlePrev = useCallback(() => {
    setMediaList((list) => {
      if (list.length > 0) {
        setCurrentIndex((prev) => (prev - 1 + list.length) % list.length);
      }
      return list;
    });
  }, []);

  // Keep currentIndex within bounds if mediaList shrinks
  useEffect(() => {
    if (mediaList.length > 0 && currentIndex >= mediaList.length) {
      setCurrentIndex(0);
    }
  }, [mediaList.length, currentIndex]);

  // Find the most-voted photo (with at least 1 like)
  const mostVotedItem = mediaList.reduce((max, item) => {
    if (!item.likes) return max;
    if (!max || item.likes > max.likes) return item;
    return max;
  }, null);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [slug]);

  // Socket real-time updates (stable listener registration)
  useEffect(() => {
    const socket = getSocket();
    joinEventRoom(slug);

    const handleConnect = () => {
      joinEventRoom(slug);
    };

    // 1. New media uploaded by a guest
    const handleNewMedia = (payload) => {
      if (payload && payload.items) {
        const approvedOnly = payload.items.filter((i) => i.status === 'approved');
        if (approvedOnly.length > 0) {
          const firstNew = approvedOnly[0];

          setMediaList((prev) => {
            const added = approvedOnly.filter((i) => !prev.some((m) => m.id === i.id));
            return [...added, ...prev];
          });

          // Trigger "Efecto Flash Fiesta" for 5 seconds
          triggerFlashFiesta(firstNew);
        }
      }
    };

    // 2. Real-time live emoji reaction from guest phone
    const handleLiveReaction = (reaction) => {
      if (!reaction || !reaction.emoji) return;

      if (soundEffectsRef.current) {
        playPopSound();
      }

      const newReaction = {
        id: reaction.id || `${Date.now()}-${Math.random()}`,
        emoji: reaction.emoji,
        uploaderName: reaction.uploaderName,
        x: 10 + Math.random() * 80, // random horizontal start (10% to 90%)
        size: 1.8 + Math.random() * 1.4, // size from 1.8rem to 3.2rem
        duration: 3.2 + Math.random() * 1.5 // duration 3.2s to 4.7s
      };

      setLiveReactions((prev) => [...prev.slice(-25), newReaction]); // keep max 25 active
    };

    // 3. Remote control command sent from host mobile phone
    const handleRemoteCommand = ({ action, payload }) => {
      if (action === 'next') {
        handleNext();
      } else if (action === 'prev') {
        handlePrev();
      } else if (action === 'toggle_play') {
        setIsPlaying((p) => !p);
      } else if (action === 'play') {
        setIsPlaying(true);
      } else if (action === 'pause') {
        setIsPlaying(false);
      } else if (action === 'confetti') {
        launchPartyConfetti();
        if (soundEffectsRef.current) playCelebrationChime();
      } else if (action === 'trigger_flash') {
        const list = mediaListRef.current;
        const idx = currentIndexRef.current;
        if (list.length > 0) {
          triggerFlashFiesta(list[idx] || list[0]);
        }
      } else if (action === 'toast') {
        showNotificationToast(payload?.message || '¡Momento Especial!');
      } else if (action === 'update_greeting') {
        if (payload?.greeting) {
          setGreetingText(payload.greeting);
          showNotificationToast(`✨ Mensaje en pantalla actualizado`);
        }
      }
    };

    const handleMediaLiked = (payload) => {
      if (payload && payload.id) {
        setMediaList((prev) =>
          prev.map((m) => (m.id === payload.id ? { ...m, likes: payload.likes } : m))
        );
      }
    };

    const handleMediaDeleted = (payload) => {
      if (payload && payload.id) {
        setMediaList((prev) => prev.filter((m) => m.id !== payload.id));
      }
    };

    socket.on('connect', handleConnect);
    socket.on('new_media', handleNewMedia);
    socket.on('live_reaction', handleLiveReaction);
    socket.on('remote_command', handleRemoteCommand);
    socket.on('media_liked', handleMediaLiked);
    socket.on('media_deleted', handleMediaDeleted);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('new_media', handleNewMedia);
      socket.off('live_reaction', handleLiveReaction);
      socket.off('remote_command', handleRemoteCommand);
      socket.off('media_liked', handleMediaLiked);
      socket.off('media_deleted', handleMediaDeleted);
      leaveEventRoom(slug);
    };
  }, [slug, handleNext, handlePrev]);

  const loadData = async () => {
    try {
      const [evtData, mediaData] = await Promise.all([
        fetchEvent(slug),
        fetchEventMedia(slug)
      ]);
      setEvent(evtData);
      setMediaList(mediaData);
      setGreetingText(evtData.specialGreeting || `🎉 ¡Bienvenidos a ${evtData.name}! 🎂`);
      if (evtData.theme) applyTheme(evtData.theme);
    } catch (err) {
      console.error(err);
    }
  };

  // Launch massive party confetti (zIndex > 2000 so it renders above the slideshow-container)
  const launchPartyConfetti = () => {
    try {
      const defaults = {
        zIndex: 2500,
        colors: ['#D4AF37', '#F59E0B', '#EC4899', '#06B6D4', '#10B981', '#A855F7', '#EF4444']
      };

      confetti({
        ...defaults,
        particleCount: 140,
        spread: 110,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        confetti({
          ...defaults,
          particleCount: 90,
          angle: 60,
          spread: 85,
          origin: { x: 0.08, y: 0.7 }
        });
        confetti({
          ...defaults,
          particleCount: 90,
          angle: 120,
          spread: 85,
          origin: { x: 0.92, y: 0.7 }
        });
      }, 280);

      setTimeout(() => {
        confetti({
          ...defaults,
          particleCount: 100,
          spread: 130,
          startVelocity: 45,
          origin: { x: 0.5, y: 0.45 }
        });
      }, 600);
    } catch (e) { }
  };

  // Trigger the 5-second Flash Fiesta presentation takeover
  const triggerFlashFiesta = (item) => {
    if (!item) return;

    if (flashTimerRef.current) clearInterval(flashTimerRef.current);

    setFlashFiestaItem(item);
    setFlashFiestaRemaining(5);

    // Audio effect: Shutter click + chime
    if (soundEffectsRef.current) {
      playCameraShutterSound();
      setTimeout(() => playCelebrationChime(), 150);
    }

    // Visual Confetti burst
    launchPartyConfetti();

    // 5-second countdown
    let remaining = 5;
    flashTimerRef.current = setInterval(() => {
      remaining -= 1;
      setFlashFiestaRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(flashTimerRef.current);
        setFlashFiestaItem(null);
        // Switch main slideshow slide to this newly uploaded photo
        setCurrentIndex(0);
      }
    }, 1000);
  };

  const showNotificationToast = (text) => {
    setRemoteToast(text);
    setTimeout(() => setRemoteToast(null), 5000);
  };

  // Timer for advancing slides in normal hybrid mode
  useEffect(() => {
    if (!isPlaying || mediaList.length <= 1 || flashFiestaItem) return;

    const currentItem = mediaList[currentIndex];
    const slideDuration = currentItem?.isVideo ? 14000 : intervalSec * 1000;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % mediaList.length);
    }, slideDuration);

    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, intervalSec, mediaList.length, flashFiestaItem]);

  // Keyboard shortcuts for projector
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // Hide controls on mouse inactivity
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => { });
    }
  };

  const currentMedia = mediaList[currentIndex];
  const isCurrentMostVoted = mostVotedItem && currentMedia && mostVotedItem.id === currentMedia.id && (mostVotedItem.likes > 0);

  return (
    <div
      className="slideshow-container"
      onMouseMove={handleMouseMove}
      style={{
        backgroundColor: '#000000',
        cursor: showControls ? 'default' : 'none'
      }}
    >
      {/* Floating live emoji reactions */}
      <FloatingReactions
        reactions={liveReactions}
        onComplete={handleReactionsComplete}
      />

      {/* Top Greeting Celebratory Banner */}
      {greetingText && event?.showGreetingBanner !== false && (
        <div className="slideshow-greeting-banner">
          <Sparkles size={16} color="var(--theme-primary, #D4AF37)" />
          <span style={{
            fontSize: '1rem',
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '0.5px',
            fontFamily: event?.theme?.headingFont || 'Outfit, sans-serif'
          }}>
            {greetingText}
          </span>
        </div>
      )}

      {/* Background ambient blur */}
      {currentMedia && !currentMedia.isVideo && (
        <div
          style={{
            position: 'absolute',
            inset: -40,
            backgroundImage: `url(${currentMedia.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(65px) brightness(0.35)',
            opacity: 0.65,
            transform: 'scale(1.15)',
            transition: 'background-image 1.2s ease-in-out'
          }}
        />
      )}

      {/* Main Slide Presentation */}
      {mediaList.length === 0 ? (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 20,
          color: '#fff'
        }}>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: 12 }}>
            {event?.name || 'Presentación en Vivo'}
          </h2>
          <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.7)', maxWidth: 500, marginBottom: 30 }}>
            Escanea el código QR con tu teléfono para ser el primero en proyectar tus fotos aquí.
          </p>
          <div style={{
            background: '#fff',
            padding: 20,
            borderRadius: 20,
            boxShadow: '0 0 50px rgba(var(--primary-rgb), 0.4)'
          }}>
            <QRCodeSVG value={fullUrl} size={240} />
          </div>
        </div>
      ) : (
        <div className={`slideshow-slide active ${kenBurns && !currentMedia?.isVideo ? 'ken-burns' : ''}`}>
          {currentMedia?.isVideo ? (
            <video
              ref={videoRef}
              key={currentMedia.id}
              src={currentMedia.url}
              autoPlay
              muted={isMuted}
              loop
              playsInline
              className="slideshow-media"
            />
          ) : (
            <img
              key={currentMedia?.id}
              src={currentMedia?.url}
              alt={currentMedia?.caption || 'Foto del evento'}
              className="slideshow-media"
            />
          )}
        </div>
      )}

      {/* 5-SECOND FLASH FIESTA TAKEOVER OVERLAY */}
      {flashFiestaItem && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, rgba(14, 17, 22, 0.94) 0%, rgba(0, 0, 0, 0.98) 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1040,
            animation: 'flashFiestaPulse 2s infinite alternate, fadeIn 0.3s ease-out',
            padding: 20
          }}
        >
          {/* Top festive badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: 'linear-gradient(135deg, var(--theme-primary, #D4AF37), var(--theme-accent, #F59E0B))',
            color: '#0E1116',
            padding: '10px 28px',
            borderRadius: 30,
            fontWeight: 900,
            fontSize: '1.25rem',
            marginBottom: 20,
            boxShadow: '0 6px 30px rgba(var(--primary-rgb), 0.8)'
          }}>
            <Sparkles size={22} /> ¡FOTO RECIÉN SALIDA DEL HORNO! ({flashFiestaRemaining}s)
          </div>

          {/* Featured Card */}
          <div
            className="glass-card"
            style={{
              maxWidth: 720,
              maxHeight: '65vh',
              borderRadius: 24,
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.9), 0 0 50px rgba(var(--primary-rgb), 0.5)',
              border: '2px solid var(--theme-primary, #D4AF37)',
              position: 'relative'
            }}
          >
            {flashFiestaItem.isVideo ? (
              <video
                src={flashFiestaItem.url}
                autoPlay
                muted={isMuted}
                loop
                style={{ maxWidth: '100%', maxHeight: '55vh', objectFit: 'contain', display: 'block' }}
              />
            ) : (
              <img
                src={flashFiestaItem.url}
                alt="Foto nueva"
                style={{ maxWidth: '100%', maxHeight: '55vh', objectFit: 'contain', display: 'block' }}
              />
            )}

            <div style={{
              background: 'rgba(14, 17, 22, 0.92)',
              padding: '16px 24px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                Subida por: <span style={{ color: 'var(--theme-primary, #D4AF37)' }}>{flashFiestaItem.uploaderName}</span>
              </div>
              {flashFiestaItem.caption && (
                <div style={{ fontSize: '1.05rem', color: 'var(--theme-secondary, #E8D5B5)', fontStyle: 'italic', marginTop: 4 }}>
                  "{flashFiestaItem.caption}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Most Voted Photo Crown Indicator 👑 */}
      {isCurrentMostVoted && (
        <div style={{
          position: 'absolute',
          top: 90,
          left: 30,
          background: 'rgba(14, 17, 22, 0.88)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid #F59E0B',
          borderRadius: 30,
          padding: '8px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 8px 30px rgba(245, 158, 11, 0.4)',
          zIndex: 1015,
          animation: 'scaleUp 0.3s ease-out'
        }}>
          <Crown size={20} color="#F59E0B" fill="#F59E0B" />
          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#F8F9FA' }}>
            ¡La foto más votada! ❤️ {mostVotedItem.likes}
          </span>
        </div>
      )}

      {/* Real-Time Remote Toast Notification */}
      {remoteToast && (
        <div style={{
          position: 'absolute',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, var(--theme-primary, #D4AF37), var(--theme-accent, #F59E0B))',
          color: '#0E1116',
          padding: '12px 28px',
          borderRadius: 30,
          fontWeight: 800,
          fontSize: '1.1rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.8), 0 0 30px rgba(var(--primary-rgb), 0.7)',
          zIndex: 1050,
          animation: 'scaleUp 0.3s ease-out'
        }}>
          {remoteToast}
        </div>
      )}

      {/* Floating QR Badge in bottom-right corner */}
      {showQr && (
        <div className="slideshow-qr-badge">
          <div style={{
            background: '#FFFFFF',
            padding: 8,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <QRCodeSVG value={fullUrl} size={90} />
          </div>
          <div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: 'var(--theme-primary, #D4AF37)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <Sparkles size={12} /> ¡Comparte tus fotos!
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>
              Apunta tu cámara
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.65)' }}>
              Aparecerán aquí en vivo
            </div>
          </div>
        </div>
      )}

      {/* Caption & Guest Dedication Box in bottom-left */}
      {showCaptions && currentMedia && (
        <div className="slideshow-caption-box" style={{ bottom: showHybridStrip && mediaList.length > 1 ? 116 : 30 }}>
          <div style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span>{currentMedia.uploaderName || 'Invitado anónimo'}</span>
            {currentMedia.likes > 0 && (
              <span style={{ fontSize: '0.82rem', color: '#EF4444', fontWeight: 700 }}>
                ❤️ {currentMedia.likes}
              </span>
            )}
          </div>
          {currentMedia.caption && (
            <div style={{
              fontSize: '0.95rem',
              color: 'var(--theme-secondary, #E8D5B5)',
              fontStyle: 'italic',
              marginTop: 4,
              lineHeight: 1.4
            }}>
              "{currentMedia.caption}"
            </div>
          )}
        </div>
      )}

      {/* HYBRID MODE: BOTTOM STRIP OF RECENT PHOTOS */}
      {showHybridStrip && mediaList.length > 1 && (
        <div className="slideshow-hybrid-strip">
          {mediaList.slice(0, 18).map((item, idx) => (
            <div
              key={item.id}
              onClick={() => setCurrentIndex(idx)}
              className={`slideshow-strip-thumb ${idx === currentIndex ? 'active' : ''}`}
              title={`Por ${item.uploaderName}`}
            >
              {item.isVideo ? (
                <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <img src={item.url} alt={item.uploaderName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              {mostVotedItem && mostVotedItem.id === item.id && (
                <div style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', borderRadius: '50%', padding: 2 }}>
                  <Crown size={12} color="#F59E0B" fill="#F59E0B" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Top Header info (Fades out when mouse idle) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '20px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)',
          zIndex: 1020,
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.4s ease',
          pointerEvents: showControls ? 'auto' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {onExit && (
            <button
              onClick={onExit}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', borderRadius: 20, fontSize: '0.85rem' }}
            >
              <ArrowLeft size={16} /> Salir del Proyector
            </button>
          )}

          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              {event?.name}
            </h1>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
              {currentIndex + 1} de {mediaList.length} recuerdos en rotación • {event?.date}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Sound effects toggle */}
          <button
            onClick={() => setSoundEffectsEnabled(!soundEffectsEnabled)}
            className="btn btn-secondary btn-icon"
            title={soundEffectsEnabled ? 'Efectos de sonido activados' : 'Efectos de sonido silenciados'}
          >
            {soundEffectsEnabled ? <BellRing size={18} color="var(--theme-primary, #D4AF37)" /> : <BellOff size={18} />}
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="btn btn-secondary btn-icon"
            title="Configuración de la presentación"
          >
            <Settings size={18} />
          </button>

          <button
            onClick={toggleFullscreen}
            className="btn btn-secondary btn-icon"
            title="Pantalla Completa (F11)"
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>

      {/* Floating Bottom Control Bar (Fades out when mouse idle) */}
      <div
        style={{
          position: 'absolute',
          bottom: showHybridStrip && mediaList.length > 1 ? 95 : 25,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(14, 17, 22, 0.88)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 40,
          padding: '8px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          zIndex: 1020,
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.4s ease',
          pointerEvents: showControls ? 'auto' : 'none'
        }}
      >
        <button
          onClick={handlePrev}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}
          title="Anterior"
        >
          <SkipBack size={20} />
        </button>

        <button
          onClick={() => setIsPlaying((prev) => !prev)}
          style={{
            background: 'var(--theme-primary, #D4AF37)',
            color: '#0E1116',
            border: 'none',
            borderRadius: '50%',
            width: 38,
            height: 38,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title={isPlaying ? 'Pausar (Espacio)' : 'Reproducir (Espacio)'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <button
          onClick={handleNext}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}
          title="Siguiente"
        >
          <SkipForward size={20} />
        </button>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.2)' }} />

        {/* Video audio toggle */}
        {currentMedia?.isVideo && (
          <button
            onClick={() => setIsMuted(!isMuted)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}
            title={isMuted ? 'Activar sonido del video' : 'Silenciar video'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        )}

        {/* Confetti test button */}
        <button
          onClick={launchPartyConfetti}
          style={{ background: 'none', border: 'none', color: '#F59E0B', cursor: 'pointer', display: 'flex' }}
          title="Lanzar Confeti"
        >
          <Sparkles size={18} />
        </button>

        {/* QR toggle */}
        <button
          onClick={() => setShowQr(!showQr)}
          style={{
            background: 'none',
            border: 'none',
            color: showQr ? 'var(--theme-primary, #D4AF37)' : 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            display: 'flex'
          }}
          title="Mostrar/Ocultar QR en esquina"
        >
          <QrCode size={18} />
        </button>
      </div>

      {/* Slideshow Settings Modal */}
      {showSettings && (
        <div
          className="modal-backdrop"
          onClick={() => setShowSettings(false)}
          style={{ zIndex: 1090 }}
        >
          <div
            className="glass-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 460, padding: 24, position: 'relative' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                Ajustes del Proyector
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="btn btn-secondary btn-icon"
                style={{ width: 32, height: 32 }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Tiempo por foto (segundos):</label>
              <select
                className="form-control"
                value={intervalSec}
                onChange={(e) => setIntervalSec(Number(e.target.value))}
              >
                <option value={4}>4 segundos (rápido)</option>
                <option value={6}>6 segundos (recomendado)</option>
                <option value={8}>8 segundos</option>
                <option value={12}>12 segundos (pausado)</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={showHybridStrip}
                  onChange={(e) => setShowHybridStrip(e.target.checked)}
                />
                <span>Mostrar tira inferior híbrida de fotos recientes</span>
              </label>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={soundEffectsEnabled}
                  onChange={(e) => setSoundEffectsEnabled(e.target.checked)}
                />
                <span>Habilitar efectos de sonido de fiesta (clic de cámara y chime)</span>
              </label>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={kenBurns}
                  onChange={(e) => setKenBurns(e.target.checked)}
                />
                <span>Efecto cinematográfico Ken Burns (Zoom suave)</span>
              </label>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={showCaptions}
                  onChange={(e) => setShowCaptions(e.target.checked)}
                />
                <span>Mostrar dedicatorias y nombres de invitados</span>
              </label>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={showQr}
                  onChange={(e) => setShowQr(e.target.checked)}
                />
                <span>Mostrar tarjeta QR flotante en la esquina</span>
              </label>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
