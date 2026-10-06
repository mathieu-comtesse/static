// Projets mis en avant sur l'accueil : image, gain chiffré, couleurs de fond (clair / sombre). Textes repris du CV (cv-mathieu_comtesse).
import { CV, PERSO } from './data.js';

export const KEY = [
  { id: 'studio', n: '01', title: 'Studio d’extracteurs PDF', sub: 'Un extracteur sans coder', gain: '3,2–6,9 k€', unit: 'de temps de développement évité par famille de documents', img: 'assets/projets/studio.jpg', url: 'projet-studio.html', bg: ['#e7efff', '#141f3a'], tags: ['Application autonome', 'Local', 'UI/UX'] },
  { id: 'cerfa', n: '02', title: 'CERFA v3', sub: 'Fiches et attestations devenues données du parc', gain: '50 k€', unit: 'de pénalités de retard identifiées', img: 'assets/projets/cerfa.jpg', url: 'projet-1.html', bg: ['#fff0df', '#2e2013'], tags: ['Fluides frigorigènes', 'Extraction en lot'] },
  { id: 'vre', n: '03', title: 'Extracteur VRE', sub: 'Rapports de vérification électrique', gain: '25 min', unit: 'gagnées par rapport, sur 7 000 à 10 000 rapports par an', img: 'assets/projets/vre.jpg', url: 'projet-vre.html', bg: ['#e6f6e9', '#12291a'], tags: ['Vérifications réglementaires', 'SharePoint'] },
  { id: 'powerbi', n: '04', title: 'Power BI · PP & MOSO', sub: 'Tableaux de bord et portail', gain: '≈ 2 h', unit: 'rendues à l’équipe chaque semaine', img: 'assets/projets/powerbi.jpg', url: 'projet-4.html', bg: ['#f1e8ff', '#241a36'], tags: ['Power BI', 'DAX', 'HTML/CSS'] },
  { id: 'terrain', n: '05', title: 'Dialogue terrain', sub: 'Processus EPM / EPTx', gain: '16', unit: 'arbitrages obtenus en réunion d’agence', img: 'assets/projets/terrain.jpg', url: 'projet-5.html', bg: ['#ffe8ec', '#2f171d'], tags: ['Audit', 'Gemba', 'Lean'] },
  { id: 'talas', n: '06', title: 'Village Talas', sub: 'Jeu sérieux ISO 45001', gain: '7 × ISO', unit: 'chapitres de la norme transformés en ateliers jouables', img: 'assets/projets/talas.jpg', url: 'projets-universitaires.html', bg: ['#e4f5f6', '#102a2c'], tags: ['Projet universitaire', '3D', 'Formation'] },
];

export const MORE = [
  { title: 'Interface commune', sub: 'Une UI/UX pour tous les outils', img: 'assets/projets/charte.jpg', url: 'projet-charte.html' },
  { title: 'Retrouver tout le suivi', sub: 'OT, équipement, bâtiment', img: 'assets/projets/suivi.jpg', url: 'projet-2.html' },
  { title: 'PP & MOSO', sub: 'Du dépôt à la consultation', img: 'assets/projets/pp.jpg', url: 'projet-3.html' },
  { title: 'Gares prioritaires', sub: 'Vigilance et criticité des gares', img: 'assets/projets/gares.jpg', url: 'projet-gares.html' },
  ...PERSO.map((p) => ({ title: p.n, sub: p.genre, img: p.img, url: p.url, pixel: true })),
];
export { CV };
