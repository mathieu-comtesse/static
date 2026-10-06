import { KEY, MORE, CV } from './projects-data.js';
import { initFlip } from './flip.js';
import { initReveal } from './theme.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Projets : une section par projet, bande de tuiles de part et d'autre d'une carte (titre, gain, bouton), fond coloré qui change à mi-écran */
function renderProjects(host) {
  const crop = (img, pos, extra = '') => `style="${extra}background-image:url('${img}');background-position:${pos}"`;
  const POS = [['0% 0%', '100% 0%'], ['0% 100%', '100% 100%']];
  host.innerHTML = KEY.map((p, i) => `
    <section class="project-section" data-bg="${i}" style="--bgl:${p.bg[0]};--bgd:${p.bg[1]}" aria-label="${esc(p.title)}">
      <div class="project-strip">
        <div class="tile reveal" ${crop(p.img, POS[0][0], '--enter-x:-120px;--delay:.12s;')}></div>
        <div class="tile reveal" ${crop(p.img, POS[1][0], '--enter-x:-70px;--delay:.06s;')}></div>
        <article class="pcard reveal" style="--enter-x:0px">
          <span class="pnum">${p.n}</span>
          <h2>${esc(p.title)}<span>${esc(p.sub)}</span></h2>
          <div class="pimg" ${crop(p.img, '50% 0%')}></div>
          <strong class="pgain">${esc(p.gain)}</strong>
          <p class="punit">${esc(p.unit)}</p>
          <div class="ptags">${p.tags.map((t) => `<i>${esc(t)}</i>`).join('')}</div>
          <a class="btn dark" href="${CV}${p.url}">Voir le projet</a>
        </article>
        <div class="tile reveal" ${crop(p.img, POS[0][1], '--enter-x:70px;--delay:.06s;')}></div>
        <div class="tile reveal" ${crop(p.img, POS[1][1], '--enter-x:120px;--delay:.12s;')}></div>
      </div>
    </section>`).join('');
}

/* Autres projets : on fait défiler sur les côtés, à la molette (horizontale) ou en glissant */
function renderRail(host) {
  host.innerHTML = `<header class="section-head reveal"><span>Tous les projets</span><p>Faites défiler sur les côtés</p></header>
    <div class="rail" tabindex="0" aria-label="Autres projets, défilement horizontal">${MORE.map((m, i) => `
      <a class="rcard reveal" style="--enter-x:80px;--delay:${Math.min(i, 5) * 0.05}s" href="${CV}${m.url}"><div class="rimg${m.pixel ? ' px' : ''}" style="background-image:url('${m.img}')"></div><b>${esc(m.title)}</b><span>${esc(m.sub)}</span></a>`).join('')}</div>`;
  const rail = host.querySelector('.rail');
  let down = null;
  rail.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = { x: e.clientX, s: rail.scrollLeft, moved: 0 }; });
  window.addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - down.x; down.moved = Math.max(down.moved, Math.abs(dx)); if (down.moved > 4) { rail.classList.add('drag'); rail.scrollLeft = down.s - dx; } });
  window.addEventListener('pointerup', () => { down = null; setTimeout(() => rail.classList.remove('drag'), 0); });
  rail.addEventListener('click', (e) => { if (rail.classList.contains('drag')) e.preventDefault(); }, true);
  // la molette verticale fait défiler la bande tant qu'elle n'est pas en butée, puis rend la main à la page
  rail.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    const max = rail.scrollWidth - rail.clientWidth, next = rail.scrollLeft + e.deltaY;
    if ((e.deltaY > 0 && rail.scrollLeft < max - 1) || (e.deltaY < 0 && rail.scrollLeft > 1)) { e.preventDefault(); rail.scrollLeft = Math.max(0, Math.min(max, next)); }
  }, { passive: false });
}

/* fond : la couleur du projet prend le relais au milieu de l'écran ; la pièce 3D baisse sa caméra quand l'en-tête s'éloigne */
function initScroll(getRoom) {
  const sections = () => [...document.querySelectorAll('.project-section')];
  let queued = false;
  const update = () => {
    queued = false;
    let active = null;
    for (const s of sections()) { if (s.getBoundingClientRect().top <= innerHeight * 0.5) active = s; else break; }
    const dark = document.documentElement.dataset.theme === 'dark';
    document.body.style.setProperty('--project-background', active ? (dark ? active.style.getPropertyValue('--bgd') : active.style.getPropertyValue('--bgl')) : 'var(--bg)');
    const host = document.getElementById('room');
    const room = getRoom(); if (host && room) { const r = host.getBoundingClientRect(); const p = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height * 0.85))); room.setScroll && room.setScroll(1 - (1 - p) * (1 - p)); }
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', queue, { passive: true }); addEventListener('resize', queue);
  new MutationObserver(queue).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  update();
}

export function initHome(getRoom) {
  renderProjects(document.getElementById('projects'));
  renderRail(document.getElementById('more'));
  initFlip(); initReveal();
  initScroll(getRoom);
}
