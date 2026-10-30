import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Video, X, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { uploadMediaFiles } from '../utils/api';

export default function MediaUploader({ slug, allowVideos = true, onUploadSuccess }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploaderName, setUploaderName] = useState(() => localStorage.getItem('recuerdapp_name') || '');
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef(null);

  // Save guest name to localStorage for seamless repeat uploads
  useEffect(() => {
    if (uploaderName.trim()) {
      localStorage.setItem('recuerdapp_name', uploaderName.trim());
    }
  }, [uploaderName]);

  const handleFilesChosen = (files) => {
    if (!files || files.length === 0) return;

    const validFiles = [];
    const newPreviews = [];

    Array.from(files).forEach((file) => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');

      if (!isImage && !isVideo) {
        alert(`El archivo "${file.name}" no es una imagen ni video.`);
        return;
      }

      if (isVideo && !allowVideos) {
        alert('Este evento solo tiene habilitada la subida de fotos.');
        return;
      }

      validFiles.push(file);
      newPreviews.push({
        file,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1),
        url: URL.createObjectURL(file),
        isVideo
      });
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
    setStatusMessage(null);
  };

  const removeFile = (index) => {
    // Revoke object URL to avoid memory leaks
    if (previews[index]) {
      URL.revokeObjectURL(previews[index].url);
    }
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFilesChosen(e.dataTransfer.files);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      alert('Por favor selecciona al menos una foto o video.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setStatusMessage(null);

    try {
      const result = await uploadMediaFiles(
        slug,
        selectedFiles,
        uploaderName,
        caption,
        (progress) => setUploadProgress(progress)
      );

      // Trigger celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#D4AF37', '#F59E0B', '#EC4899', '#06B6D4', '#10B981']
      });

      setStatusMessage({
        type: 'success',
        text: result.pendingModeration
          ? '¡Tus fotos fueron enviadas al anfitrión para moderación! 🎉'
          : '¡Subida exitosa! Ya se están proyectando en la pantalla del evento ✨'
      });

      // Clear state
      previews.forEach((p) => URL.revokeObjectURL(p.url));
      setSelectedFiles([]);
      setPreviews([]);
      setCaption('');

      if (onUploadSuccess) {
        onUploadSuccess(result.items);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Ocurrió un error al subir tus archivos'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'rgba(var(--primary-rgb), 0.15)',
          color: 'var(--theme-primary, #D4AF37)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Sparkles size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Comparte tus recuerdos</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Tus fotos y videos se proyectarán en vivo en la pantalla
          </p>
        </div>
      </div>

      <form onSubmit={handleUploadSubmit}>
        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragOver ? 'var(--theme-primary, #D4AF37)' : 'rgba(255, 255, 255, 0.18)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '28px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            background: isDragOver ? 'rgba(var(--primary-rgb), 0.08)' : 'rgba(0, 0, 0, 0.2)',
            transition: 'all 0.2s ease',
            marginBottom: 18
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFilesChosen(e.target.files)}
            multiple
            accept={allowVideos ? 'image/*,video/*' : 'image/*'}
            style={{ display: 'none' }}
          />

          <div style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            color: 'var(--theme-primary, #D4AF37)'
          }}>
            <UploadCloud size={28} />
          </div>

          <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>
            Toca aquí o arrastra tus fotos y videos
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Admite JPG, PNG, WEBP {allowVideos ? 'y videos MP4/MOV hasta 150MB' : ''} • Selección múltiple
          </div>
        </div>

        {/* Selected files previews */}
        {previews.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, color: 'var(--theme-secondary, #E8D5B5)' }}>
              Archivos seleccionados ({previews.length}):
            </div>
            <div style={{
              display: 'flex',
              gap: 10,
              overflowX: 'auto',
              paddingBottom: 8
            }}>
              {previews.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'relative',
                    width: 80,
                    height: 80,
                    borderRadius: 10,
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  {item.isVideo ? (
                    <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <img src={item.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}

                  {item.isVideo && (
                    <div style={{ position: 'absolute', bottom: 2, left: 2, background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: '2px 4px' }}>
                      <Video size={10} color="#fff" />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'rgba(0, 0, 0, 0.75)',
                      color: '#fff',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Tu Nombre o Apodo (Opcional):</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej. Tía Marcela, Gonzalo, Familia Silva..."
              value={uploaderName}
              onChange={(e) => setUploaderName(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Dedicatoria o Mensaje (Opcional):</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej. ¡Muchas felicidades en su día! ❤️"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={isUploading}
            />
          </div>
        </div>

        {/* Progress bar */}
        {isUploading && (
          <div style={{ margin: '14px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
              <span>Subiendo archivos...</span>
              <span style={{ fontWeight: 700 }}>{uploadProgress}%</span>
            </div>
            <div style={{ width: '100%', height: 8, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 4, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--theme-primary, #D4AF37), var(--theme-accent, #F59E0B))',
                  transition: 'width 0.2s ease'
                }}
              />
            </div>
          </div>
        )}

        {/* Feedback message */}
        {statusMessage && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 10,
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.9rem',
            background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: statusMessage.type === 'success' ? '#34D399' : '#F87171',
            border: `1px solid ${statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}>
            {statusMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
          disabled={isUploading || selectedFiles.length === 0}
        >
          {isUploading ? (
            `Subiendo (${uploadProgress}%)...`
          ) : (
            `Subir ${selectedFiles.length > 0 ? `${selectedFiles.length} archivo(s)` : 'fotos / videos'}`
          )}
        </button>
      </form>
    </div>
  );
}
