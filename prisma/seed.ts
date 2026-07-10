// UBOBO — Database seed
// Populates the dev database with:
//  - Default AppSettings (delivery fee config)
//  - Admin user (from ENV)
//  - Restaurants + menu items (from existing src/data/restaurants.ts)
//  - A demo promotion banner
//
// Run: `npm run db:seed` (also automatically via `npm run db:reset`).

import { PrismaClient, type RestaurantCategory, type RestaurantStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'
import { restaurants as mockRestaurants } from '../src/data/restaurants'

dotenv.config()

const prisma = new PrismaClient()

function mapCategory(c: string): RestaurantCategory {
  const map: Record<string, RestaurantCategory> = {
    'petit-dejeuner': 'PETIT_DEJEUNER',
    'apero':          'APERO',
    'courses':        'COURSES',
    'patisserie':     'PATISSERIE',
  }
  return map[c] ?? 'PETIT_DEJEUNER'
}

function mapStatus(s: string): RestaurantStatus {
  const map: Record<string, RestaurantStatus> = {
    active: 'ACTIVE',
    coming_soon: 'COMING_SOON',
    partner_pending: 'PARTNER_PENDING',
  }
  return map[s] ?? 'COMING_SOON'
}

async function main() {
  console.log('🌱 Seeding UBOBO database...')

  // --- 1. AppSettings (singleton) ---
  await prisma.appSettings.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      appName: 'UBOBO',
      defaultLocale: 'fr',
      currency: 'EUR',
      currencySymbol: '€',
      deliveryBaseFee: 4.0,
      deliveryPerKmFee: 1.0,
      deliveryFreeAbove: null,
      deliveryMinOrder: 0,
      deliveryMaxDistanceKm: 4,
      serviceFeeRate: 0,
      acceptingOrders: true,
      notifyAdminOnNewOrder: true,
    },
    update: {},
  })
  console.log('  ✓ AppSettings')

  // --- 2. Admin user ---
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@ubobo.fr'
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123'
  const passwordHash = await bcrypt.hash(adminPassword, 10)
  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: 'Administrateur UBOBO',
      passwordHash,
      role: 'ADMIN',
      locale: 'fr',
    },
    update: { passwordHash, role: 'ADMIN' },
  })
  console.log(`  ✓ Admin user (${adminEmail} / ${adminPassword})`)

  // --- 3. Restaurants + menus ---
  for (const r of mockRestaurants) {
    const restaurant = await prisma.restaurant.upsert({
      where: { slug: r.id },
      create: {
        slug: r.id,
        name: r.name,
        category: mapCategory(r.category),
        status: mapStatus(r.status),
        logo: r.logo ?? null,
        coverImage: r.coverImage ?? null,
        description: r.description ?? null,
        distanceFromCenterKm: r.distanceFromCenterKm,
        address: r.address,
        phone: r.phone ?? null,
        isFeatured: r.id === 'boulangerie-du-cap',
      },
      update: {
        name: r.name,
        category: mapCategory(r.category),
        status: mapStatus(r.status),
        logo: r.logo ?? null,
        coverImage: r.coverImage ?? null,
        description: r.description ?? null,
        distanceFromCenterKm: r.distanceFromCenterKm,
        address: r.address,
        phone: r.phone ?? null,
      },
    })

    // Replace menu (delete then recreate, simpler than diffing for seed)
    await prisma.menuItem.deleteMany({ where: { restaurantId: restaurant.id } })

    for (const [idx, m] of r.menu.entries()) {
      await prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          name: m.name,
          description: m.description ?? '',
          price: m.price,
          category: m.category,
          available: m.available,
          image: m.image ?? null,
          optionsJson: m.options ? JSON.stringify(m.options) : null,
          position: idx,
        },
      })
    }

    console.log(`  ✓ ${r.name} (${r.menu.length} items)`)
  }

  // --- 4. Sample promotion banner ---
  await prisma.promotion.upsert({
    where: { code: 'CAPFERRET10' },
    create: {
      code: 'CAPFERRET10',
      title: 'Bienvenue à UBOBO !',
      description: '10% de réduction sur votre première commande au Cap Ferret',
      type: 'PERCENT',
      value: 10,
      minSubtotal: 15,
      isActive: true,
      bannerColor: '#0A6E8A',
    },
    update: {},
  })

  await prisma.promotion.upsert({
    where: { code: 'FREEDELIVERY' },
    create: {
      code: 'FREEDELIVERY',
      title: 'Livraison offerte',
      description: 'Livraison gratuite dès 25€ de commande',
      type: 'FREE_DELIVERY',
      value: 0,
      minSubtotal: 25,
      isActive: true,
      bannerColor: '#F2A61D',
    },
    update: {},
  })
  console.log('  ✓ Promotions')

  // --- 5. Sample reviews on Chez Nounours (so the UI has something to show) ---
  const cn = await prisma.restaurant.findUnique({ where: { slug: 'chez-nounours' } })
  if (cn) {
    // create a few anonymous customer users for demo reviews
    const reviewerEmails = ['marie@example.com', 'thomas@example.com', 'lea@example.com']
    for (const email of reviewerEmails) {
      await prisma.user.upsert({
        where: { email },
        create: { email, name: email.split('@')[0], role: 'CUSTOMER' },
        update: {},
      })
    }
    const users = await prisma.user.findMany({ where: { email: { in: reviewerEmails } } })
    const reviewData = [
      { rating: 5, comment: 'Les meilleurs sandwiches du Cap Ferret. Le hot-dog est légendaire !' },
      { rating: 4, comment: 'Très bon snack, frites maison délicieuses. Livraison rapide.' },
      { rating: 5, comment: 'Top, comme toujours depuis 30 ans !' },
    ]
    // Wipe demo reviews for these users so re-running seed stays idempotent
    await prisma.review.deleteMany({
      where: { restaurantId: cn.id, userId: { in: users.map(u => u.id) } },
    })
    for (let i = 0; i < users.length; i++) {
      await prisma.review.create({
        data: {
          userId: users[i].id,
          restaurantId: cn.id,
          rating: reviewData[i].rating,
          comment: reviewData[i].comment,
        },
      })
    }
    // refresh aggregate
    const reviews = await prisma.review.findMany({ where: { restaurantId: cn.id } })
    if (reviews.length > 0) {
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      await prisma.restaurant.update({
        where: { id: cn.id },
        data: { averageRating: avg, reviewCount: reviews.length },
      })
    }
    console.log(`  ✓ ${reviews.length} sample reviews`)
  }

  console.log('✅ Seed complete\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
