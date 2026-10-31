import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    const socketUrl = import.meta.env.VITE_API_URL || undefined;
    socket = io(socketUrl, {
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('[Socket] Conectado al servidor en tiempo real:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Desconectado del servidor');
    });
  }
  return socket;
}

export function joinEventRoom(slug) {
  const s = getSocket();
  s.emit('join_event', slug);
}

export function leaveEventRoom(slug) {
  const s = getSocket();
  s.emit('leave_event', slug);
}

export function joinAdminRoom(slug) {
  const s = getSocket();
  s.emit('join_admin', slug);
}

export function emitReaction(slug, emoji, uploaderName) {
  const s = getSocket();
  s.emit('send_reaction', { slug, emoji, uploaderName });
}

export function emitDedication(slug, author, message) {
  const s = getSocket();
  s.emit('send_dedication', { slug, author, message });
}

export function emitRemoteControl(slug, action, payload = {}) {
  const s = getSocket();
  s.emit('remote_control', { slug, action, payload });
}
