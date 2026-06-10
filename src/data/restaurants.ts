import type { Restaurant } from '../types'

export const restaurants: Restaurant[] = [
  // ─── BOULANGERIE DU CAP ───────────────────────────────────────────────────
  {
    id: 'boulangerie-du-cap',
    name: 'La Boulangerie du Cap',
    category: 'petit-dejeuner',
    logo: '/boulangerie-du-cap-logo.png',
    estimatedTimeMin: 20,
    status: 'active',
    distanceFromCenterKm: 0.8,
    address: 'Cap Ferret, 33970',
    phone: '',
    description: 'Viennoiseries et pâtisseries fraîches du matin, préparées chaque jour par votre boulangerie locale.',
    menu: [
      // Viennoiseries
      { id: 'bdc-01', name: 'Croissant', description: 'Croissant pur beurre', price: 1.20, category: 'Viennoiseries', available: true },
      { id: 'bdc-02', name: 'Chocolatine', description: 'Pain au chocolat pur beurre', price: 1.30, category: 'Viennoiseries', available: true },
      { id: 'bdc-03', name: 'Pain aux Raisins', description: 'Crème pâtissière, raisins secs', price: 1.40, category: 'Viennoiseries', available: true },
      { id: 'bdc-04', name: 'Chausson aux Pommes', description: 'Feuilletage, compote de pommes maison', price: 1.50, category: 'Viennoiseries', available: true },
      { id: 'bdc-05', name: 'Croissant aux Amandes', description: 'Croissant fourré crème d\'amandes, amandes effilées', price: 1.80, category: 'Viennoiseries', available: true },
      { id: 'bdc-06', name: 'Pain au Lait', description: 'Moelleux, légèrement sucré', price: 0.90, category: 'Viennoiseries', available: true },
      { id: 'bdc-07', name: 'Brioche Individuelle', description: 'Brioche dorée et filante', price: 1.50, category: 'Viennoiseries', available: true },
      // Pâtisseries
      { id: 'bdc-08', name: 'Éclair au Chocolat', description: 'Pâte à choux, crème chocolat, glaçage', price: 2.80, category: 'Pâtisseries', available: true },
      { id: 'bdc-09', name: 'Éclair au Café', description: 'Pâte à choux, crème café, glaçage', price: 2.80, category: 'Pâtisseries', available: true },
      { id: 'bdc-10', name: 'Madeleine (x2)', description: 'Madeleines maison', price: 1.00, category: 'Pâtisseries', available: true },
      { id: 'bdc-11', name: 'Financier', description: 'Beurre noisette, amandes', price: 1.20, category: 'Pâtisseries', available: true },
      { id: 'bdc-12', name: 'Tarte aux Fraises (part)', description: 'Sablé, crème, fraises fraîches', price: 4.50, category: 'Pâtisseries', available: true },
      { id: 'bdc-13', name: 'Tarte Citron Meringuée (part)', description: 'Citron acidulé, meringue italienne', price: 4.00, category: 'Pâtisseries', available: true },
      { id: 'bdc-14', name: 'Macaron (pièce)', description: 'Framboise, vanille, chocolat ou café', price: 1.80, category: 'Pâtisseries', available: true },
      // Tartines & Boissons
      { id: 'bdc-15', name: 'Tartine Beurre & Confiture', description: 'Demi-baguette, beurre demi-sel, confiture maison', price: 2.50, category: 'Tartines', available: true },
      { id: 'bdc-16', name: 'Tartine Beurre & Miel', description: 'Demi-baguette, beurre, miel toutes fleurs', price: 2.50, category: 'Tartines', available: true },
      { id: 'bdc-17', name: 'Café Allongé', description: 'Café noir allongé', price: 2.00, category: 'Boissons', available: true },
      { id: 'bdc-18', name: 'Café Crème', description: 'Espresso + lait chaud', price: 2.50, category: 'Boissons', available: true },
      { id: 'bdc-19', name: 'Jus d\'Orange Frais', description: 'Oranges pressées à la commande', price: 3.50, category: 'Boissons', available: true },
      { id: 'bdc-20', name: 'Chocolat Chaud', description: 'Chocolat noir fondu, lait', price: 2.80, category: 'Boissons', available: true },
    ],
  },

  // ─── POISSONNERIE LUCINE ──────────────────────────────────────────────────
  {
    id: 'poissonnerie-lucine',
    name: 'Poissonnerie Lucine',
    category: 'fruits-de-mer',
    estimatedTimeMin: 30,
    status: 'active',
    distanceFromCenterKm: 1.2,
    address: 'Cap Ferret, 33970',
    phone: '',
    description: 'Produits de la mer ultra-frais, sélectionnés chaque matin directement auprès des pêcheurs du bassin.',
    menu: [
      // Plateaux
      { id: 'pl-01', name: 'Plateau Royal', description: 'Homard, langoustines (6), crevettes roses, tourteau, bulots — pour 2', price: 85.00, category: 'Plateaux', available: true },
      { id: 'pl-02', name: 'Plateau Découverte', description: 'Tourteau, crevettes roses, bulots, bigorneaux — pour 2', price: 38.00, category: 'Plateaux', available: true },
      { id: 'pl-03', name: 'Plateau Enfant', description: 'Crevettes, bigorneaux, œufs de caille — pour 1', price: 14.00, category: 'Plateaux', available: true },
      // À la pièce
      { id: 'pl-04', name: 'Demi-Homard Cuit', description: 'Homard breton, mayonnaise maison', price: 28.00, category: 'À la pièce', available: true },
      { id: 'pl-05', name: 'Langoustines (6 pcs)', description: 'Cuites, avec mayonnaise', price: 18.00, category: 'À la pièce', available: true },
      { id: 'pl-06', name: 'Crevettes Roses 500g', description: 'Pêche du jour, cuites', price: 12.00, category: 'À la pièce', available: true },
      { id: 'pl-07', name: 'Tourteau Cuit', description: 'Environ 600g, cuit à l\'eau de mer', price: 16.00, category: 'À la pièce', available: true },
      { id: 'pl-08', name: 'Bulots 500g', description: 'Cuits, avec mayonnaise', price: 8.00, category: 'À la pièce', available: true },
      { id: 'pl-09', name: 'Bigorneaux 500g', description: 'Cuits', price: 6.00, category: 'À la pièce', available: true },
      { id: 'pl-10', name: 'Moules Fraîches 1kg', description: 'Moules de bouchot, à cuisiner', price: 9.00, category: 'À la pièce', available: true },
      { id: 'pl-11', name: 'Saumon Fumé 100g', description: 'Fumé artisanal, tranché fin', price: 14.00, category: 'Poisson', available: true },
      { id: 'pl-12', name: 'Filets de Bar (2 pcs)', description: 'Bar de ligne, levé le matin', price: 22.00, category: 'Poisson', available: true },
    ],
  },

  // ─── LA CABANE (HUÎTRES) ─────────────────────────────────────────────────
  {
    id: 'la-cabane',
    name: 'La Kabane',
    category: 'huitres',
    estimatedTimeMin: 25,
    status: 'active',
    distanceFromCenterKm: 0.5,
    address: 'Cap Ferret, 33970',
    phone: '',
    description: 'Huîtres du bassin d\'Arcachon, élevées dans nos parcs à quelques mètres d\'ici. La fraîcheur garantie.',
    menu: [
      // Huîtres
      { id: 'cab-01', name: 'Huîtres n°3 (6 pcs)', description: 'Calibre n°3 — dégustation', price: 8.00, category: 'Huîtres', available: true },
      { id: 'cab-02', name: 'Huîtres n°3 (12 pcs)', description: 'Calibre n°3 — dégustation', price: 15.00, category: 'Huîtres', available: true },
      { id: 'cab-03', name: 'Huîtres n°2 (12 pcs)', description: 'Calibre n°2 — charnues', price: 18.00, category: 'Huîtres', available: true },
      { id: 'cab-04', name: 'Huîtres n°1 (12 pcs)', description: 'Calibre n°1 — généreuses', price: 21.00, category: 'Huîtres', available: true },
      { id: 'cab-05', name: 'Plateau Dégustation (24 pcs)', description: 'Assortiment n°1, n°2, n°3 — pour 2-4 personnes', price: 32.00, category: 'Huîtres', available: true },
      // Préparations
      { id: 'cab-06', name: 'Huîtres Gratinées (6 pcs)', description: 'Beurre d\'herbes, chapelure — servies chaudes', price: 14.00, category: 'Préparations', available: true },
      { id: 'cab-07', name: 'Huîtres au Chorizo (6 pcs)', description: 'Légèrement gratinées, touche de chorizo ibérique', price: 15.00, category: 'Préparations', available: true },
      // Accompagnements
      { id: 'cab-08', name: 'Pain, Beurre & Citron', description: 'Pain de seigle, beurre demi-sel, 2 citrons', price: 3.00, category: 'Accompagnements', available: true },
      { id: 'cab-09', name: 'Saucisson & Pain', description: 'Saucisson artisanal, pain de campagne', price: 6.00, category: 'Accompagnements', available: true },
      { id: 'cab-10', name: 'Vin Blanc 75cl', description: 'Entre-Deux-Mers — accord parfait', price: 12.00, category: 'Boissons', available: true },
      { id: 'cab-11', name: 'Eau Minérale 1,5L', description: 'Evian', price: 2.50, category: 'Boissons', available: true },
    ],
  },
]
