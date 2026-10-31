import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Printer, Share2, Sparkles, Download } from 'lucide-react';

export default function QrCardModal({ event, onClose }) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef(null);

  const fullUrl = `${window.location.origin}/#/e/${event.slug}`;

  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 580, padding: 24, position: 'relative' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="btn btn-secondary btn-icon"
          style={{ position: 'absolute', top: 16, right: 16, width: 34, height: 34 }}
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(var(--primary-rgb), 0.15)',
            color: 'var(--theme-primary, #D4AF37)',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: 8
          }}>
            <Sparkles size={14} /> TARJETA PARA MESAS & CÓDIGO QR
          </div>
          <h3 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 800 }}>
            Invita a todos a subir sus fotos
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0' }}>
            Los invitados solo apuntan con su cámara y acceden sin instalar nada
          </p>
        </div>

        {/* Printable Card Area */}
        <div
          ref={cardRef}
          className="printable-card-area"
          style={{
            background: '#FFFFFF',
            color: '#111827',
            borderRadius: 20,
            padding: '24px 20px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            marginBottom: 20,
            border: '2px solid #E5E7EB'
          }}
        >
          <div className="print-cut-guide" style={{ fontSize: '0.72rem', color: '#9CA3AF', marginBottom: 10, letterSpacing: '0.5px' }}>
            ✂️ Guía de corte / Tarjeta para centro de mesa
          </div>

          <div style={{
            fontFamily: event.theme?.headingFont || 'Cinzel, serif',
            fontSize: '1.35rem',
            fontWeight: 800,
            color: '#111827',
            marginBottom: 4
          }}>
            {event.name}
          </div>

          <div style={{
            fontSize: '0.9rem',
            color: '#4B5563',
            fontStyle: 'italic',
            marginBottom: 16
          }}>
            ¡Ayúdanos a capturar cada momento inolvidable!
          </div>

          {/* QR Code */}
          <div style={{
            display: 'inline-block',
            padding: 12,
            background: '#FFFFFF',
            borderRadius: 16,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            border: '1px solid #E5E7EB',
            marginBottom: 14
          }}>
            <QRCodeSVG
              value={fullUrl}
              size={185}
              level="H"
              includeMargin={false}
              fgColor="#0E1116"
            />
          </div>

          <div style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#1F2937',
            lineHeight: 1.45,
            maxWidth: 340,
            margin: '0 auto'
          }}>
            1. Abre la cámara de tu teléfono móvil<br />
            2. Escanea el código QR de arriba<br />
            3. ¡Sube tus fotos y videos al instante!
          </div>

          <div style={{
            marginTop: 14,
            paddingTop: 10,
            borderTop: '1px dashed #D1D5DB',
            fontSize: '0.75rem',
            color: '#6B7280',
            fontWeight: 500
          }}>
            {event.theme?.monogram ? `${event.theme.monogram} • ` : ''}Proyección en vivo durante el evento
          </div>
        </div>

        {/* Copy Link Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(0, 0, 0, 0.35)',
          padding: '8px 12px',
          borderRadius: 12,
          marginBottom: 18,
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <input
            type="text"
            readOnly
            value={fullUrl}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              width: '100%',
              outline: 'none'
            }}
          />
          <button
            onClick={copyUrlToClipboard}
            className="btn btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
          >
            {copied ? <Check size={14} color="#34D399" /> : <Copy size={14} />}
            <span>{copied ? '¡Copiado!' : 'Copiar enlace'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          <button
            onClick={handlePrint}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
          >
            <Printer size={18} /> Imprimir Tarjetas
          </button>

          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '12px' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
