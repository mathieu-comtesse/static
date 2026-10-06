import { MUSIC } from './data.js';

/* Juke-box : au lancement du vinyle, un titre est tiré au hasard dans MUSIC et joué par le lecteur intégré Spotify (iFrame API).
 * Pas de connexion à demander : le lecteur joue des extraits de 30 s, ou les titres entiers si Spotify est déjà connecté dans le navigateur. */
const uriOf = (s) => { const m = /(?:open\.spotify\.com\/(?:intl-[a-z]+\/)?|spotify:)(track|album|playlist|episode)[/:]([A-Za-z0-9]+)/.exec(s); return m ? `spotify:${m[1]}:${m[2]}` : null; };

export function createJukebox() {
  const tracks = MUSIC.map(uriOf).filter(Boolean);
  let bag = [], last = null, ctrl = null, api = null, loading = false, on = false;
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;left:16px;bottom:16px;width:min(320px,calc(100vw - 32px));z-index:30;display:none;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.25)';
  const slot = document.createElement('div'); box.append(slot); document.body.append(box);
  const next = () => {
    if (!bag.length) { bag = [...tracks].sort(() => Math.random() - 0.5); if (bag.length > 1 && bag[bag.length - 1] === last) bag.unshift(bag.pop()); }
    last = bag.pop(); return last;
  };
  function play() { const u = next(); if (ctrl) { ctrl.loadUri(u); ctrl.play(); } }
  function init() {
    if (ctrl || loading) return; loading = true;
    window.onSpotifyIframeApiReady = (A) => {
      api = A;
      A.createController(slot, { uri: next(), width: '100%', height: 80 }, (c) => {
        ctrl = c; loading = false;
        c.addListener('ready', () => { if (on) c.play(); });
        c.addListener('playback_update', (e) => { const d = e.data; if (on && d && d.duration && d.isPaused && d.position >= d.duration - 800) play(); });
      });
    };
    const sc = document.createElement('script'); sc.src = 'https://open.spotify.com/embed/iframe-api/v1'; sc.async = true; document.body.append(sc);
  }
  return {
    get available() { return tracks.length > 0; },
    start() { if (!tracks.length) return; on = true; box.style.display = 'block'; if (ctrl) play(); else init(); },
    stop() { on = false; box.style.display = 'none'; if (ctrl) ctrl.pause(); },
  };
}
