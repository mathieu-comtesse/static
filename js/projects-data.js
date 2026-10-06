// Projets de l'accueil : projets pro (image, gain chiffré, fiche synthétique tirée de data.js) et projets perso (aperçus pixélisés).
import { CV, PERSO, PRO } from './data.js';

const byId = Object.fromEntries(PRO.map((p) => [p.id, p]));
const P = (id, title, sub, gain, unit, img, pro) => ({ id, title, sub, gain, unit, img, pro: byId[pro] || null });

export const PRO_CARDS = [
  P('studio', 'Studio d’extracteurs PDF', 'Un extracteur sans coder', '3,2–6,9 k€', 'de temps de développement évité par famille de documents', 'assets/projets/studio.jpg', 'projet-studio'),
  P('cerfa', 'CERFA v3', 'Fiches et attestations devenues données du parc', '50 k€', 'de pénalités de retard identifiées', 'assets/projets/cerfa.jpg', 'projet-1'),
  P('vre', 'Extracteur VRE', 'Rapports de vérification électrique', '25 min', 'gagnées par rapport, sur 7 000 à 10 000 rapports par an', 'assets/projets/vre.jpg', 'projet-vre'),
  P('powerbi', 'Power BI · PP & MOSO', 'Tableaux de bord et portail', '≈ 2 h', 'rendues à l’équipe chaque semaine', 'assets/projets/powerbi.jpg', 'projet-4'),
  P('terrain', 'Dialogue terrain', 'Processus EPM / EPTx', '16', 'arbitrages obtenus en réunion d’agence', 'assets/projets/terrain.jpg', 'projet-5'),
  P('talas', 'Village Talas', 'Jeu sérieux ISO 45001', '7 × ISO', 'chapitres de la norme transformés en ateliers jouables', 'assets/projets/talas.jpg', 'projet-universitaire'),
  P('pp', 'PP & MOSO', 'Du dépôt à la consultation', 'Quelques s', 'pour retrouver un plan, son PDF et son échéance', 'assets/projets/pp.jpg', 'projet-3'),
  P('suivi', 'Retrouver tout le suivi', 'OT, équipement, bâtiment', '1 vue', 'pour tout le suivi d’un équipement ou d’un bâtiment', 'assets/projets/suivi.jpg', 'projet-2'),
  P('gares', 'Gares prioritaires', 'Vigilance et criticité des gares', '1 classement', 'des gares par criticité, mis à jour sans ressaisie', 'assets/projets/gares.jpg', 'projet-gares'),
  P('charte', 'Interface commune', 'Une UI/UX pour tous les outils', '1 charte', 'commune à tous les outils construits', 'assets/projets/charte.jpg', 'projet-charte'),
];

export const PERSO_CARDS = PERSO.map((p) => ({ id: p.id, title: p.n, sub: p.genre, desc: p.desc, img: p.img, url: p.url, pixel: true }));
export { CV };
