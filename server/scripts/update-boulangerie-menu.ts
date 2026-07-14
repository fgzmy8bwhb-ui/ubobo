import { prisma } from '../lib/prisma'

const RESTAURANT_SLUG = 'boulangerie-du-cap'

// Nouveaux prix des viennoiseries (+0,10€ chacune)
const VIENNOISERIE_PRICES: Record<string, number> = {
  'Croissant': 1.20,
  'Chocolatine': 1.20,
  'Pain aux Raisins': 1.50,
  'Suisse': 1.60,
  'Chausson aux Pommes': 1.90,
  'Viennoiserie aux Amandes': 3.05,
  'Brioche Tressée Sucre': 6.60,
  'Brioche Tressée Chocolat': 6.90,
}

// Renomme les articles déjà créés avec les anciens noms (préfixe "Baguette" en trop,
// "Pain du Ferret" ambigu) vers les noms corrects relevés sur l'étiquette.
const RENAMES: { from: string; to: string; price: number; description?: string }[] = [
  { from: 'Baguette Sésame', to: 'Sésame', price: 1.50 },
  { from: 'Baguette Épeautre', to: 'Épeautre', price: 1.50 },
  { from: 'Baguette Campagne', to: 'Campagne', price: 1.50 },
  { from: 'Baguette Céréales', to: 'Céréales', price: 1.50 },
  { from: 'Baguette aux Graines', to: 'Parisse Graine', price: 1.60 },
  // L'ancien "Pain du Ferret" (400g) désignait en fait le pain vendu au poids —
  // le vrai "Pain du Ferret" est une baguette à 2,20€, ajoutée séparément ci-dessous.
  { from: 'Pain du Ferret', to: 'Pain de 400g', price: 1.60, description: '' },
]

// Baguettes relevées sur l'étiquette en boutique
const BAGUETTES: { name: string; price: number; description?: string }[] = [
  { name: 'Ficelle', price: 0.70 },
  { name: 'Baguette du Ferret', price: 1.10 },
  { name: 'Baguette Festival', price: 1.30 },
  { name: 'Sésame', price: 1.50 },
  { name: 'Épeautre', price: 1.50 },
  { name: 'Campagne', price: 1.50 },
  { name: 'Céréales', price: 1.50 },
  { name: 'Parisse Graine', price: 1.60 },
  { name: 'Pain de 400g', price: 1.60 },
  { name: 'Pain du Ferret', price: 2.20 },
  { name: 'Parisse', price: 1.50 },
]

async function main() {
  const restaurant = await prisma.restaurant.findUnique({ where: { slug: RESTAURANT_SLUG } })
  if (!restaurant) {
    console.error(`Restaurant "${RESTAURANT_SLUG}" introuvable — vérifie le slug en base.`)
    process.exit(1)
  }

  // 1) Mise à jour des prix des viennoiseries existantes
  for (const [name, price] of Object.entries(VIENNOISERIE_PRICES)) {
    const res = await prisma.menuItem.updateMany({
      where: { restaurantId: restaurant.id, name },
      data: { price },
    })
    console.log(res.count > 0 ? `✓ ${name} → ${price}€` : `⚠ ${name} introuvable, ignoré`)
  }

  // 2) Renommage des articles déjà créés sous un ancien nom
  for (const r of RENAMES) {
    const res = await prisma.menuItem.updateMany({
      where: { restaurantId: restaurant.id, name: r.from },
      data: { name: r.to, price: r.price, ...(r.description !== undefined ? { description: r.description } : {}) },
    })
    if (res.count > 0) console.log(`✓ "${r.from}" renommé en "${r.to}" (${r.price}€)`)
  }

  // 3) Ajout des baguettes (skip si un article du même nom existe déjà)
  for (const b of BAGUETTES) {
    const existing = await prisma.menuItem.findFirst({
      where: { restaurantId: restaurant.id, name: b.name },
    })
    if (existing) {
      console.log(`⚠ "${b.name}" existe déjà (id ${existing.id}), non recréé`)
      continue
    }
    await prisma.menuItem.create({
      data: {
        restaurantId: restaurant.id,
        name: b.name,
        description: b.description ?? '',
        price: b.price,
        category: 'Baguettes',
        available: true,
      },
    })
    console.log(`+ ${b.name} (${b.price}€) créé`)
  }

  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
