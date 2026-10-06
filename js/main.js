import { createRoom } from './room.js';
import { initUI } from './ui.js';
import { initTheme } from './theme.js';
import { initHome } from './home.js';
initUI();
initTheme();

const host = document.getElementById('room');
const bubble = document.getElementById('bubble');
let roomRef = null;
initHome(() => roomRef);
createRoom(host, bubble).then((room) => { window.room = room; roomRef = room; }).catch((e) => {
  console.error(e);
  host.insertAdjacentHTML('beforeend', '<p class="hint">La pièce 3D ne peut pas s’afficher sur cet appareil.</p>');
});
