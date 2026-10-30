// API helper for RecuerdAppMe

const BASE_URL = ''; // Relative URLs will be proxied by Vite in dev and served by Express in prod

export async function fetchEvent(slug) {
  const res = await fetch(`/api/events/${slug}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al cargar el evento');
  return data.event;
}

export async function fetchAllEvents() {
  const res = await fetch('/api/events');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al cargar eventos');
  return data.events || [];
}

export async function createEvent(eventData) {
  const res = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear evento');
  return data.event;
}

export async function updateEvent(slug, updates, passcode) {
  const res = await fetch(`/api/events/${slug}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...updates, passcode })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar evento');
  return data.event;
}

export async function verifyMasterPasscode(masterPasscode) {
  const res = await fetch('/api/events/master/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ masterPasscode })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Clave Maestra incorrecta');
  return data.authorized;
}

export async function updateMasterPasscode(currentPasscode, newPasscode) {
  const res = await fetch('/api/events/master/passcode', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPasscode, newPasscode })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar la Clave Maestra');
  return data;
}

export async function deleteEvent(slug, masterPasscode) {
  const res = await fetch(`/api/events/${slug}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ masterPasscode })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar el evento');
  return data;
}

export async function verifyHostPasscode(slug, passcode) {
  const res = await fetch(`/api/events/${slug}/verify-passcode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Código incorrecto');
  return data;
}

export async function fetchEventStats(slug) {
  const res = await fetch(`/api/events/${slug}/stats`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener estadísticas');
  return data.stats;
}

export async function fetchEventMedia(slug, isAdmin = false) {
  const url = isAdmin ? `/api/events/${slug}/media?admin=true` : `/api/events/${slug}/media`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al cargar archivos');
  return data.media || [];
}

export function uploadMediaFiles(slug, files, uploaderName, caption, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    for (const file of files) {
      formData.append('files', file);
    }
    formData.append('uploaderName', uploaderName || '');
    formData.append('caption', caption || '');

    xhr.open('POST', `/api/events/${slug}/media/upload`);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Error al subir archivos'));
        }
      } catch (err) {
        reject(new Error('Respuesta inválida del servidor'));
      }
    };

    xhr.onerror = () => reject(new Error('Error de conexión al subir archivos'));
    xhr.send(formData);
  });
}

export async function likeMediaItem(slug, mediaId) {
  const res = await fetch(`/api/events/${slug}/media/${mediaId}/like`, {
    method: 'POST'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al registrar me gusta');
  return data.likes;
}

export async function updateMediaStatus(slug, mediaId, status, passcode) {
  const res = await fetch(`/api/events/${slug}/media/${mediaId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, passcode })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al cambiar estado');
  return data.item;
}

export async function deleteMediaItem(slug, mediaId, passcode) {
  const res = await fetch(`/api/events/${slug}/media/${mediaId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar');
  return true;
}

export function getDownloadZipUrl(slug) {
  return `/api/download/${slug}/download-all`;
}
