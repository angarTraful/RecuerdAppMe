import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Camera, Image as ImageIcon, Video, X, CheckCircle, AlertCircle, Sparkles, Hash } from 'lucide-react';
import confetti from 'canvas-confetti';
import { uploadMediaFiles } from '../utils/api';

const QUICK_TAGS = ['#Pista', '#Amigos', '#Familia', '#Mesa', '#Selfie', '#Brindis', '#Carioca'];

export default function MediaUploader({
  slug,
  allowVideos = true,
  guestName = '',
  onGuestNameChange,
  onRequireName,
  onUploadSuccess
}) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploaderName, setUploaderName] = useState(() => guestName || localStorage.getItem('recuerdapp_name') || '');
  const [tagsInput, setTagsInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);
  const cameraPhotoInputRef = useRef(null);
  const cameraVideoInputRef = useRef(null);
  const nameInputRef = useRef(null);

  // Sync with parent guestName state
  useEffect(() => {
    if (guestName && guestName !== uploaderName) {
      setUploaderName(guestName);
    }
  }, [guestName]);

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

    // If guest hasn't entered their name yet, guide them to the name input
    if (!uploaderName.trim()) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 150);
    }
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

  const handleToggleTag = (tag) => {
    const currentTags = tagsInput
      .split(/[\s,]+/)
      .map(t => t.trim())
      .filter(Boolean);

    if (currentTags.includes(tag)) {
      setTagsInput(currentTags.filter(t => t !== tag).join(' '));
    } else {
      setTagsInput([...currentTags, tag].join(' '));
    }
  };

  const performUpload = async (nameToUse) => {
    setIsUploading(true);
    setUploadProgress(0);
    setStatusMessage(null);

    try {
      const result = await uploadMediaFiles(
        slug,
        selectedFiles,
        nameToUse,
        '',
        (progress) => setUploadProgress(progress),
        tagsInput
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
      setTagsInput('');

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

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      alert('Por favor selecciona al menos una foto o video.');
      return;
    }

    const cleanName = uploaderName.trim();
    if (!cleanName) {
      if (onRequireName) {
        onRequireName((enteredName) => {
          setUploaderName(enteredName);
          performUpload(enteredName);
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Por favor ingresa tu nombre o apodo antes de subir tus recuerdos.'
        });
        nameInputRef.current?.focus();
      }
      return;
    }

    await performUpload(cleanName);
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
        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            handleFilesChosen(e.target.files);
            e.target.value = '';
          }}
          multiple
          accept={allowVideos ? 'image/*,video/*' : 'image/*'}
          style={{ display: 'none' }}
        />

        {/* Direct Mobile Camera Photo Input */}
        <input
          type="file"
          ref={cameraPhotoInputRef}
          onChange={(e) => {
            handleFilesChosen(e.target.files);
            e.target.value = '';
          }}
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
        />

        {/* Direct Mobile Camera Video Input */}
        {allowVideos && (
          <input
            type="file"
            ref={cameraVideoInputRef}
            onChange={(e) => {
              handleFilesChosen(e.target.files);
              e.target.value = '';
            }}
            accept="video/*"
            capture="environment"
            style={{ display: 'none' }}
          />
        )}

        {/* Quick Camera & Gallery Action Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: allowVideos ? 'repeat(auto-fit, minmax(150px, 1fr))' : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 14
        }}>
          <button
            type="button"
            onClick={() => cameraPhotoInputRef.current?.click()}
            disabled={isUploading}
            className="btn btn-primary"
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              fontSize: '0.95rem'
            }}
          >
            <Camera size={20} />
            <span>Tomar Foto Ahora</span>
          </button>

          {allowVideos && (
            <button
              type="button"
              onClick={() => cameraVideoInputRef.current?.click()}
              disabled={isUploading}
              className="btn btn-secondary"
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(var(--primary-rgb), 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                fontSize: '0.95rem'
              }}
            >
              <Video size={20} color="var(--theme-primary, #D4AF37)" />
              <span>Grabar Video</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="btn btn-secondary"
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              fontSize: '0.95rem'
            }}
          >
            <ImageIcon size={20} />
            <span>Elegir de la Galería</span>
          </button>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragOver ? 'var(--theme-primary, #D4AF37)' : 'rgba(255, 255, 255, 0.18)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '20px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            background: isDragOver ? 'rgba(var(--primary-rgb), 0.08)' : 'rgba(0, 0, 0, 0.2)',
            transition: 'all 0.2s ease',
            marginBottom: 18
          }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 8px',
            color: 'var(--theme-primary, #D4AF37)'
          }}>
            <UploadCloud size={24} />
          </div>

          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>
            O toca aquí / arrastra varios archivos de tu galería
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
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

        {/* Hashtags Input & Category Badges */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Hash size={16} color="var(--theme-primary, #D4AF37)" />
              <span>Hashtags para clasificar tus fotos:</span>
            </label>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Opcional</span>
          </div>

          <input
            type="text"
            className="form-control"
            placeholder="Ej. #Pista #Mesa3 #Amigos..."
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            disabled={isUploading}
            style={{ marginBottom: 8 }}
          />

          {/* Quick Clickable Suggestions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: 2 }}>Sugeridos:</span>
            {QUICK_TAGS.map((tag) => {
              const isSelected = tagsInput.toLowerCase().includes(tag.toLowerCase());
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 14,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    border: isSelected ? '1px solid var(--theme-primary, #D4AF37)' : '1px solid rgba(255, 255, 255, 0.15)',
                    background: isSelected ? 'rgba(var(--primary-rgb), 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    color: isSelected ? 'var(--theme-primary, #D4AF37)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* If guest name is not yet entered, prompt inline as fallback */}
        {!uploaderName.trim() && (
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Tu Nombre o Apodo *:</label>
            <input
              ref={nameInputRef}
              type="text"
              required
              className="form-control"
              placeholder="Ej. Mesa 1, Marcela, Familia Gómez..."
              value={uploaderName}
              onChange={(e) => {
                setUploaderName(e.target.value);
                if (onGuestNameChange) onGuestNameChange(e.target.value);
              }}
              disabled={isUploading}
            />
          </div>
        )}

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
