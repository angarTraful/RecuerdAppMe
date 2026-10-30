import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import QrCardModal from './components/QrCardModal';
import Home from './pages/Home';
import GuestUpload from './pages/GuestUpload';
import LiveSlideshow from './pages/LiveSlideshow';
import HostDashboard from './pages/HostDashboard';
import { fetchEvent } from './utils/api';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(() => parseRoute());
  const [currentEvent, setCurrentEvent] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);

  // Helper to parse window.location.hash
  function parseRoute() {
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (!hash) return { page: 'home' };

    // Format: e/:slug, e/:slug/live, e/:slug/admin
    const parts = hash.split('/');
    if (parts[0] === 'e' && parts[1]) {
      const slug = parts[1];
      const sub = parts[2];
      if (sub === 'live') return { page: 'live', slug };
      if (sub === 'admin') return { page: 'admin', slug };
      return { page: 'guest', slug };
    }

    return { page: 'home' };
  }

  useEffect(() => {
    const handleHashChange = () => {
      const route = parseRoute();
      setCurrentRoute(route);
      if (route.slug) {
        fetchEvent(route.slug)
          .then((evt) => setCurrentEvent(evt))
          .catch(() => setCurrentEvent(null));
      } else {
        setCurrentEvent(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // initial check

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (path) => {
    window.location.hash = path;
  };

  const handleTabChange = (tab) => {
    if (!currentRoute.slug) return;
    if (tab === 'guest') navigateTo(`#/e/${currentRoute.slug}`);
    if (tab === 'live') navigateTo(`#/e/${currentRoute.slug}/live`);
    if (tab === 'admin') navigateTo(`#/e/${currentRoute.slug}/admin`);
  };

  return (
    <ThemeProvider>
      <div className="themed-app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Hide Navbar in Live Presentation mode so the projector screen is 100% immersive */}
        {currentRoute.page !== 'live' && (
          <Navbar
            event={currentEvent}
            currentTab={currentRoute.page}
            onTabChange={handleTabChange}
            onOpenQr={() => setShowQrModal(true)}
          />
        )}

        {/* Routed views */}
        <div style={{ flex: 1 }}>
          {currentRoute.page === 'home' && (
            <Home onSelectEvent={(slug) => navigateTo(`#/e/${slug}`)} />
          )}

          {currentRoute.page === 'guest' && (
            <GuestUpload
              slug={currentRoute.slug}
              onOpenQr={() => setShowQrModal(true)}
              onOpenLive={() => navigateTo(`#/e/${currentRoute.slug}/live`)}
            />
          )}

          {currentRoute.page === 'live' && (
            <LiveSlideshow
              slug={currentRoute.slug}
              onExit={() => navigateTo(`#/e/${currentRoute.slug}`)}
            />
          )}

          {currentRoute.page === 'admin' && (
            <HostDashboard
              slug={currentRoute.slug}
              onOpenQr={() => setShowQrModal(true)}
              onOpenLive={() => navigateTo(`#/e/${currentRoute.slug}/live`)}
            />
          )}
        </div>

        {/* Global QR & Printable Tent Card Modal */}
        {showQrModal && currentEvent && (
          <QrCardModal
            event={currentEvent}
            onClose={() => setShowQrModal(false)}
          />
        )}
      </div>
    </ThemeProvider>
  );
}
