import { PRESET_PLAYLISTS } from '../constants/playlists.js';

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Checks whether Spotify credentials are configured in the environment.
 */
export function isSpotifyConfigured() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  return Boolean(clientId && clientSecret && clientId.trim() && clientSecret.trim());
}

/**
 * Fetches or returns cached Spotify access token via Client Credentials flow.
 */
async function getAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) return null;

  // Return cached token if valid for at least another 60 seconds
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[Spotify Service] Error authenticating with Spotify API:', res.status, errText);
      return null;
    }

    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
    return cachedToken;
  } catch (err) {
    console.error('[Spotify Service] Exception during Spotify token fetch:', err.message);
    return null;
  }
}

/**
 * Searches songs on Spotify API. If not configured or fails, falls back gracefully to local party presets.
 */
export async function searchTracks(query, limit = 12) {
  const cleanQuery = (query || '').trim();
  if (!cleanQuery) return { source: 'empty', results: [], isConfigured: isSpotifyConfigured() };

  // Try Spotify API if configured
  if (isSpotifyConfigured()) {
    try {
      const token = await getAccessToken();
      if (token) {
        const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(cleanQuery)}&type=track&limit=${limit}&market=AR`;
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          const items = data.tracks?.items || [];
          const results = items.map((track) => ({
            id: track.id,
            title: track.name,
            artist: track.artists.map((a) => a.name).join(', '),
            album: track.album?.name || '',
            coverUrl: track.album?.images?.[0]?.url || track.album?.images?.[1]?.url || null,
            durationSec: Math.round((track.duration_ms || 180000) / 1000),
            previewUrl: track.preview_url || null,
            spotifyUrl: track.external_urls?.spotify || null,
            uri: track.uri,
            source: 'spotify'
          }));

          return {
            source: 'spotify',
            isConfigured: true,
            results
          };
        } else {
          console.warn('[Spotify Service] Search request failed, status:', res.status);
        }
      }
    } catch (err) {
      console.error('[Spotify Service] Search exception:', err.message);
    }
  }

  // Graceful fallback to local party playlists
  const allLocalTracks = Object.values(PRESET_PLAYLISTS).flatMap((p) => p.tracks || []);
  const lowerQ = cleanQuery.toLowerCase();
  const matched = allLocalTracks.filter((t) =>
    t.title.toLowerCase().includes(lowerQ) ||
    t.artist.toLowerCase().includes(lowerQ) ||
    t.genre.toLowerCase().includes(lowerQ)
  );

  return {
    source: 'local',
    isConfigured: isSpotifyConfigured(),
    results: matched.slice(0, limit).map((t) => ({
      ...t,
      coverUrl: null,
      spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(`${t.title} ${t.artist}`)}`,
      source: 'local'
    }))
  };
}

