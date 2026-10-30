import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import eventsRouter from './routes/events.js';
import mediaRouter from './routes/media.js';
import downloadRouter from './routes/download.js';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

const app = express();
const server = http.createServer(app);

// Cross-origin setup to allow React Vite dev server and production clients
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded media statically
app.use('/uploads', express.static(UPLOADS_ROOT));

// API routes
app.use('/api/events', eventsRouter);
app.use('/api/events/:slug/media', mediaRouter);
app.use('/api/download', downloadRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), app: 'RecuerdAppMe Server' });
});

// Socket.IO event handling
io.on('connection', (socket) => {
  // Join specific event room for real-time updates (slideshow, gallery)
  socket.on('join_event', (slug) => {
    const room = `event:${slug}`;
    socket.join(room);
  });

  socket.on('leave_event', (slug) => {
    socket.leave(`event:${slug}`);
  });

  // Host admin room for live moderation
  socket.on('join_admin', (slug) => {
    socket.join(`admin:${slug}`);
  });

  // Real-time live emoji reactions sent by guests from their phones
  socket.on('send_reaction', ({ slug, emoji, uploaderName }) => {
    if (!slug || !emoji) return;
    const event = db.getEventBySlug(slug);
    if (!event || event.uploadsPaused) return;
    io.to(`event:${slug}`).emit('live_reaction', {
      emoji,
      uploaderName: uploaderName || 'Un invitado',
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    });
  });

  // Remote control commands sent by host smartphone to the projector screen
  socket.on('remote_control', ({ slug, action, payload }) => {
    if (!slug || !action) return;
    io.to(`event:${slug}`).emit('remote_command', {
      action,
      payload
    });
  });

  socket.on('disconnect', () => {
    // disconnected
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[RecuerdAppMe Server] Running on http://localhost:${PORT}`);
  console.log(`[RecuerdAppMe Server] Static media served at /uploads`);
});
