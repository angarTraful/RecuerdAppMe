import React, { useState } from 'react';
import { Palette, Check, RefreshCw, Type, Image as ImageIcon, Sparkles, Eye } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const PRESET_OPTIONS = [
  {
    id: 'elegant-gold',
    name: 'Boda de Oro & Lujo',
    primaryColor: '#D4AF37',
    secondaryColor: '#E8D5B5',
    backgroundColor: '#0E1116',
    cardBackground: 'rgba(24, 28, 36, 0.85)',
    textColor: '#F8F9FA',
    accentColor: '#F59E0B',
    fontFamily: "'Playfair Display', serif",
    headingFont: "'Cinzel', serif",
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'neon-party',
    name: 'Fiesta Neón & Club',
    primaryColor: '#EC4899',
    secondaryColor: '#06B6D4',
    backgroundColor: '#09090B',
    cardBackground: 'rgba(24, 24, 27, 0.85)',
    textColor: '#FAFAFA',
    accentColor: '#8B5CF6',
    fontFamily: "'Inter', sans-serif",
    headingFont: "'Outfit', sans-serif",
    coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'romantic-rose',
    name: 'Romance Rosa & Floral',
    primaryColor: '#E11D48',
    secondaryColor: '#FDA4AF',
    backgroundColor: '#1F1315',
    cardBackground: 'rgba(40, 24, 28, 0.88)',
    textColor: '#FFF1F2',
    accentColor: '#F43F5E',
    fontFamily: "'Cormorant Garamond', serif",
    headingFont: "'Playfair Display', serif",
    coverImage: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'rustic-boho',
    name: 'Boho Chic & Madera',
    primaryColor: '#D97706',
    secondaryColor: '#FDE68A',
    backgroundColor: '#1C1917',
    cardBackground: 'rgba(41, 37, 36, 0.88)',
    textColor: '#F5F5F4',
    accentColor: '#EAB308',
    fontFamily: "'Merriweather', serif",
    headingFont: "'Montserrat', sans-serif",
    coverImage: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'modern-clean',
    name: 'Minimalista & Moderno',
    primaryColor: '#6366F1',
    secondaryColor: '#A5B4FC',
    backgroundColor: '#0B0F19',
    cardBackground: 'rgba(17, 24, 39, 0.88)',
    textColor: '#F9FAFB',
    accentColor: '#38BDF8',
    fontFamily: "'Inter', sans-serif",
    headingFont: "'Outfit', sans-serif",
    coverImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1600&q=80'
  }
];

const FONT_OPTIONS = [
  { label: 'Elegante Clásico (Cinzel / Playfair)', heading: "'Cinzel', serif", body: "'Playfair Display', serif" },
  { label: 'Moderno Limpio (Outfit / Inter)', heading: "'Outfit', sans-serif", body: "'Inter', sans-serif" },
  { label: 'Romántico Delicado (Playfair / Cormorant)', heading: "'Playfair Display', serif", body: "'Cormorant Garamond', serif" },
  { label: 'Rústico Cálido (Montserrat / Merriweather)', heading: "'Montserrat', sans-serif", body: "'Merriweather', serif" }
];

export default function ThemeCustomizer({ currentTheme = {}, onSave, isSaving = false }) {
  const { applyTheme } = useTheme();
  const [themeState, setThemeState] = useState({
    preset: currentTheme.preset || 'elegant-gold',
    primaryColor: currentTheme.primaryColor || '#D4AF37',
    secondaryColor: currentTheme.secondaryColor || '#E8D5B5',
    backgroundColor: currentTheme.backgroundColor || '#0E1116',
    cardBackground: currentTheme.cardBackground || 'rgba(24, 28, 36, 0.85)',
    textColor: currentTheme.textColor || '#F8F9FA',
    accentColor: currentTheme.accentColor || '#F59E0B',
    fontFamily: currentTheme.fontFamily || "'Playfair Display', serif",
    headingFont: currentTheme.headingFont || "'Cinzel', serif",
    borderRadius: currentTheme.borderRadius || '16px',
    coverImage: currentTheme.coverImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
    monogram: currentTheme.monogram || ''
  });

  const handlePresetSelect = (preset) => {
    const updated = {
      ...themeState,
      preset: preset.id,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      backgroundColor: preset.backgroundColor,
      cardBackground: preset.cardBackground,
      textColor: preset.textColor,
      accentColor: preset.accentColor,
      fontFamily: preset.fontFamily,
      headingFont: preset.headingFont,
      coverImage: preset.coverImage
    };
    setThemeState(updated);
    applyTheme(updated);
  };

  const handleCustomChange = (field, value) => {
    const updated = { ...themeState, [field]: value };
    setThemeState(updated);
    applyTheme(updated);
  };

  const handleFontChange = (heading, body) => {
    const updated = { ...themeState, headingFont: heading, fontFamily: body };
    setThemeState(updated);
    applyTheme(updated);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
      {/* Controls Column */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Palette size={22} color="var(--theme-primary, #D4AF37)" />
          <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Personalizador del Tema</h3>
        </div>

        {/* Presets */}
        <div style={{ marginBottom: 24 }}>
          <label className="form-label">Elige un estilo prediseñado:</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PRESET_OPTIONS.map((preset) => {
              const isSelected = themeState.preset === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: `1.5px solid ${isSelected ? preset.primaryColor : 'rgba(255, 255, 255, 0.1)'}`,
                    background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.25)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: preset.primaryColor,
                      boxShadow: `0 0 10px ${preset.primaryColor}80`
                    }} />
                    <span style={{ fontWeight: isSelected ? 700 : 500, fontSize: '0.92rem' }}>
                      {preset.name}
                    </span>
                  </div>
                  {isSelected && <Check size={18} color={preset.primaryColor} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Colors */}
        <div style={{ marginBottom: 24 }}>
          <label className="form-label">Ajuste fino de colores:</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Color Principal:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={themeState.primaryColor}
                  onChange={(e) => handleCustomChange('primaryColor', e.target.value)}
                  style={{ width: 36, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  type="text"
                  className="form-control"
                  style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                  value={themeState.primaryColor}
                  onChange={(e) => handleCustomChange('primaryColor', e.target.value)}
                />
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Color Fondo:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={themeState.backgroundColor}
                  onChange={(e) => handleCustomChange('backgroundColor', e.target.value)}
                  style={{ width: 36, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  type="text"
                  className="form-control"
                  style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                  value={themeState.backgroundColor}
                  onChange={(e) => handleCustomChange('backgroundColor', e.target.value)}
                />
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Acento / Destacados:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={themeState.accentColor}
                  onChange={(e) => handleCustomChange('accentColor', e.target.value)}
                  style={{ width: 36, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  type="text"
                  className="form-control"
                  style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                  value={themeState.accentColor}
                  onChange={(e) => handleCustomChange('accentColor', e.target.value)}
                />
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Color Texto:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={themeState.textColor}
                  onChange={(e) => handleCustomChange('textColor', e.target.value)}
                  style={{ width: 36, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  type="text"
                  className="form-control"
                  style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                  value={themeState.textColor}
                  onChange={(e) => handleCustomChange('textColor', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tipografía */}
        <div style={{ marginBottom: 24 }}>
          <label className="form-label">Estilo de Tipografía:</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {FONT_OPTIONS.map((f, i) => (
              <label
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: themeState.headingFont === f.heading ? 'rgba(var(--primary-rgb), 0.15)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${themeState.headingFont === f.heading ? 'var(--theme-primary, #D4AF37)' : 'transparent'}`,
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                <input
                  type="radio"
                  name="fontFamilyOption"
                  checked={themeState.headingFont === f.heading}
                  onChange={() => handleFontChange(f.heading, f.body)}
                />
                <span style={{ fontFamily: f.heading, fontWeight: 700 }}>{f.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Imagen de Portada */}
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">URL de Foto de Portada / Banner:</label>
          <input
            type="url"
            className="form-control"
            value={themeState.coverImage}
            onChange={(e) => handleCustomChange('coverImage', e.target.value)}
            placeholder="https://images.unsplash.com/..."
          />
        </div>

        {/* Monograma / Iniciales */}
        <div className="form-group" style={{ marginBottom: 24 }}>
          <label className="form-label">Iniciales o Monograma (Opcional):</label>
          <input
            type="text"
            className="form-control"
            value={themeState.monogram}
            onChange={(e) => handleCustomChange('monogram', e.target.value)}
            placeholder="Ej. S & M, Mis 15, Boda 2026..."
            maxLength={15}
          />
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={() => onSave(themeState)}
          className="btn btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
          disabled={isSaving}
        >
          {isSaving ? 'Guardando tema...' : 'Guardar y Aplicar Tema'}
        </button>
      </div>

      {/* Live Preview Column */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Eye size={18} color="var(--theme-primary, #D4AF37)" />
          <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Vista Previa en Vivo</h4>
        </div>

        {/* Simulated mobile card */}
        <div
          style={{
            maxWidth: 380,
            margin: '0 auto',
            borderRadius: 24,
            border: '2px solid rgba(255, 255, 255, 0.15)',
            background: themeState.backgroundColor,
            color: themeState.textColor,
            fontFamily: themeState.fontFamily,
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden'
          }}
        >
          {/* Simulated Hero */}
          <div
            style={{
              position: 'relative',
              height: 180,
              backgroundImage: `url(${themeState.coverImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'flex-end',
              padding: 16
            }}
          >
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 80%)'
            }} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              {themeState.monogram && (
                <div style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 20,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: themeState.primaryColor,
                  color: '#0E1116',
                  marginBottom: 4
                }}>
                  {themeState.monogram}
                </div>
              )}
              <h3 style={{
                fontFamily: themeState.headingFont,
                margin: 0,
                fontSize: '1.3rem',
                color: '#fff',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)'
              }}>
                Boda de Valentina & Mateo
              </h3>
            </div>
          </div>

          {/* Simulated Body */}
          <div style={{ padding: 18 }}>
            <div style={{
              background: themeState.cardBackground,
              borderRadius: themeState.borderRadius,
              padding: 16,
              marginBottom: 14,
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{
                fontFamily: themeState.headingFont,
                fontSize: '1rem',
                fontWeight: 700,
                color: themeState.primaryColor,
                marginBottom: 6
              }}>
                ¡Bienvenidos a nuestro día!
              </div>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.4, margin: 0, opacity: 0.9 }}>
                Captura cada risa, cada baile y cada momento especial para proyectarlo en pantalla.
              </p>
            </div>

            <button
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: themeState.borderRadius,
                background: `linear-gradient(135deg, ${themeState.primaryColor}, ${themeState.accentColor})`,
                color: '#0E1116',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: `0 4px 14px ${themeState.primaryColor}50`
              }}
            >
              📸 Subir Fotos & Videos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
