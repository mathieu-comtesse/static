import { createRoom } from './room.js';
import { initUI } from './ui.js';
initUI();

/* mode clair / sombre : par défaut selon l'heure, puis le choix mémorisé */
{
  const root = document.documentElement, btn = document.getElementById('theme');
  const ICON = {
    sun: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.3M12 19.2v2.3M2.5 12h2.3M19.2 12h2.3M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/></svg>',
    moon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
  };
  const apply = (t) => {
    root.dataset.theme = t;
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', t === 'dark' ? '#1a1c21' : '#e9dfcf');
    if (btn) { btn.innerHTML = t === 'dark' ? ICON.sun : ICON.moon; btn.setAttribute('aria-label', t === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'); }
  };
  let saved = null; try { saved = localStorage.getItem('cv3d-theme'); } catch (_) {}
  apply(saved === 'dark' || saved === 'light' ? saved : root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  btn && btn.addEventListener('click', () => {
    const t = root.dataset.theme === 'dark' ? 'light' : 'dark'; apply(t);
    try { localStorage.setItem('cv3d-theme', t); } catch (_) {}
  });
}

const host = document.getElementById('room');
const bubble = document.getElementById('bubble');
createRoom(host, bubble).then((room) => { window.room = room; }).catch((e) => {
  console.error(e);
  host.insertAdjacentHTML('beforeend', '<p class="hint">La pièce 3D ne peut pas s’afficher sur cet appareil.</p>');
});
