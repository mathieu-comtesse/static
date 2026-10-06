import { createRoom } from './room.js';
import { initUI } from './ui.js';
initUI();

const host = document.getElementById('room');
const bubble = document.getElementById('bubble');
createRoom(host, bubble).then((room) => { window.room = room; }).catch((e) => {
  console.error(e);
  host.insertAdjacentHTML('beforeend', '<p class="hint">La pièce 3D ne peut pas s’afficher sur cet appareil.</p>');
});
