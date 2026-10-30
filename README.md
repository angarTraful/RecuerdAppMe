# 📸 RecuerdAppMe

**RecuerdAppMe** es una aplicación web moderna y completa para eventos (bodas, cumpleaños, fiestas de 18, corporativos) donde los invitados pueden escanear un código QR o ingresar a un enlace para subir fotos y videos en tiempo real, con dedicatorias y sin necesidad de registrarse. 

Además, incluye un **Modo Proyector Híbrido en Vivo (Live Slideshow)** para proyectar las fotos en pantallas gigantes durante la fiesta, **reacciones flotantes en vivo**, **Efecto Flash Fiesta**, **Control Remoto Móvil desde el celular del anfitrión**, personalizador de temas y descarga en ZIP.

---

## 🌟 Características Principales

### 📱 1. Experiencia de Invitados (Cero Fricción)
- **Acceso Directo con QR o Enlace**: Sin descargar apps ni crear contraseñas.
- **Barra de Reacciones en Vivo**: Botones rápidos (❤️, 🎉, 🔥, 🎂, 🥂, 👏) para enviar reacciones animadas flotantes que suben en tiempo real por la pantalla gigante con sonido sutil.
- **Subida Múltiple**: Carga de fotos y videos (hasta 150MB) desde el carrete o la cámara.
- **Dedicatoria & Nombre**: Los invitados pueden firmar con su nombre o apodo y dejar un mensaje afectuoso.
- **Barra de Progreso y Confetti**: Animación de celebración al subir con éxito.
- **Galería Interactiva**: Vista tipo mural con filtros (Todos / Fotos / Videos), botón de Me Gusta (❤️) y visualizador Lightbox en alta resolución.

### 📽️ 2. Modo Presentación en Vivo (Proyector / Pantalla de Fiesta)
- **Modo Híbrido Inteligente**:
  - Diapositiva principal en alta resolución con zoom cinemático Ken Burns y fondo ambiental desenfocado dinámico.
  - Tira inferior interactiva con las últimas fotos subidas y selección táctil rápida.
  - Insignia de **Corona Dorada 👑** para la foto más votada del evento.
- **Efecto Flash Fiesta (5 segundos)**:
  - En cuanto un invitado sube una foto, la pantalla se transforma durante 5 segundos con un destello festivo, sonido de obturador de cámara ("¡Clic-flash!"), lluvia de confeti y un banner destacado: *"✨ ¡Foto recién salida del horno de [Nombre]!"*.
- **Reacciones Flotantes en Vivo**:
  - Los emojis enviados por los invitados desde sus teléfonos flotan suavemente por la pantalla en tiempo real.
- **Cápsula de Felicitación Destacada**:
  - Banner en la parte superior del proyector con mensaje de celebración personalizable (ej. *"🎉 ¡Felices 18 Joaco! 🎂"* o *"💍 ¡Vivan los Novios! 🥂"*).
- **Código QR Flotante**:
  - Insignia elegante en la esquina inferior con el código QR para que los invitados sigan escaneando y subiendo fotos durante toda la noche.

### 🎮 3. Control Remoto Móvil del Anfitrión (Smartphone Remote)
- **Controla el Proyector desde tu Teléfono Celular**:
  - Botones táctiles grandes para **Pausar / Reproducir**, **Foto Anterior** y **Foto Siguiente**.
  - **🎊 ¡Lluvia de Confeti!**: Dispara una explosión de confeti en la pantalla grande al instante.
  - **📸 Disparar Flash Fiesta**: Destaca la foto actual en el centro durante 5 segundos.
  - **🎂 ¡Momento Torta & Brindis!**: Lanza confeti masivo y proyecta un cartel de felicitaciones.
  - **Editor de Mensaje en Vivo**: Cambia el texto proyectado en pantalla en cualquier momento de la fiesta sin tocar la laptop.

### 🎨 4. Temas Personalizados por el Anfitrión
- **Presets de Estilo Listos para Usar**:
  - *Boda de Oro & Lujo* (Dorado, marfil, tipografía serif elegante).
  - *Fiesta Neón & Night Club* (Tonos oscuros con cian y fucsia vibrante).
  - *Romance Rosa & Floral* (Pasteles románticos y tipografía delicada).
  - *Boho Chic & Madera* (Terracota, verde salvia y estilo rústico).
  - *Minimalista & Moderno* (Blanco y negro sofisticado).
- **Control Total**:
  - Selector de colores primario, secundario, fondo, texto y acento.
  - Selección de tipografías de Google Fonts (Cinzel, Playfair Display, Outfit, Cormorant Garamond, Merriweather, etc.).
  - Banner o foto de portada personalizada.
  - Monograma o iniciales del evento (ej. `V & M`).
  - Vista previa interactiva en tiempo real antes de guardar.

### 🛡️ 5. Panel de Control del Anfitrión (Admin)
- **Protección con Código PIN**: Acceso exclusivo para los organizadores (por defecto `1234`).
- **Métricas en Vivo**: Total de recuerdos, fotos vs. videos, personas únicas y likes acumulados.
- **Moderación de Contenido**: Ocultar o eliminar fotos/videos inapropiados con un solo clic.
- **Generador de Tarjetas de Mesa Imprimibles**: Tarjetas diseñadas para imprimir y colocar en las mesas con el código QR y las instrucciones.
- **Descarga Completa en ZIP**: Descarga un archivo ZIP organizado con todas las fotos, videos y un archivo de texto `DEDICATORIAS_DE_INVITADOS.txt` con todos los mensajes dejados por los invitados.

---

## 🛠️ Stack Tecnológico

- **Backend**: Node.js + Express
  - **WebSockets**: Socket.IO para sincronización instantánea con el proyector y control remoto móvil.
  - **Subida de Archivos**: Multer con almacenamiento por evento y soporte de archivos grandes.
  - **Base de Datos**: Almacenamiento JSON persistente y atómico con copias de seguridad.
  - **Compresión**: Archiver para generación en streaming de archivos ZIP.
- **Frontend**: React 18 + Vite
  - **Audio Sintetizado**: Web Audio API para efectos de sonido sin dependencias de archivos externos.
  - **Diseño**: Vanilla CSS con tokens y variables CSS dinámicas inyectadas en tiempo real.
  - **Iconos**: Lucide React.
  - **Códigos QR**: QRCode SVG y Canvas.
  - **Efectos**: Canvas-Confetti y animaciones Ken Burns.

---

## 🚀 Cómo Iniciar la Aplicación

### Requisitos
- Node.js (v18 o superior)
- npm

### 1. Iniciar Servidores (Backend y Frontend a la vez)
En la raíz del proyecto ejecuta:
```bash
npm run dev
```

Esto iniciará:
- **Backend API & WebSockets**: [http://localhost:4000](http://localhost:4000)
- **Frontend Web**: [http://localhost:3000](http://localhost:3000)

### 2. Acceso a las Pantallas
- **Página de Inicio / Crear Eventos**: `http://localhost:3000/#/`
- **Vista de Invitados (Joaco 18 años)**: `http://localhost:3000/#/e/joaco-18-anos`
- **Modo Proyector en Vivo**: `http://localhost:3000/#/e/joaco-18-anos/live`
- **Control Remoto del Anfitrión**: `http://localhost:3000/#/e/joaco-18-anos/admin` (PIN por defecto: `1234`)
