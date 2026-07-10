// Commandes test — à lancer avec: npx tsx prisma/seed-orders.ts
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
dotenv.config()

const prisma = new PrismaClient()

async function main() {
  console.log('🛒 Création des commandes test...')

  const boulangerie = await prisma.restaurant.findUnique({ where: { slug: 'boulangerie-du-cap' } })
  const alice = await prisma.restaurant.findUnique({ where: { slug: 'alice' } })
  const kabane = await prisma.restaurant.findUnique({ where: { slug: 'la-cabane' } })

  if (!boulangerie || !alice || !kabane) {
    console.error('Restaurants introuvables — lance npm run db:seed avant')
    process.exit(1)
  }

  const menuBoulangerie = await prisma.menuItem.findMany({ where: { restaurantId: boulangerie.id } })
  const menuAlice = await prisma.menuItem.findMany({ where: { restaurantId: alice.id } })
  const menuKabane = await prisma.menuItem.findMany({ where: { restaurantId: kabane.id } })

  const item = (menu: typeof menuBoulangerie, name: string) =>
    menu.find((m) => m.name.toLowerCase().includes(name.toLowerCase()))

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const orders = [
    // Commande 1 — Boulangerie, livrée
    {
      orderNumber: 'TEST-001',
      restaurantId: boulangerie.id,
      status: 'DELIVERED' as const,
      subtotal: 5.20,
      deliveryFee: 5.00,
      total: 10.20,
      discount: 0,
      customerName: 'Marie Dupont',
      customerPhone: '06 12 34 56 78',
      customerEmail: 'marie@example.com',
      deliveryAddress: '12 Allée des Mouettes, Cap Ferret 33970',
      deliveryDistanceKm: 0.8,
      paymentMethod: 'CARD' as const,
      paymentStatus: 'PAID' as const,
      deliveryDate: today,
      deliverySlot: '09:00',
      notes: 'Sonner à la porte bleue',
      items: [
        { menuItemId: item(menuBoulangerie, 'Croissant')?.id, name: 'Croissant', price: 1.10, quantity: 2 },
        { menuItemId: item(menuBoulangerie, 'Chocolatine')?.id, name: 'Chocolatine', price: 1.10, quantity: 1 },
        { menuItemId: item(menuBoulangerie, 'Pain aux Raisins')?.id, name: 'Pain aux Raisins', price: 1.40, quantity: 2 },
      ],
    },
    // Commande 2 — Boulangerie, en cours
    {
      orderNumber: 'TEST-002',
      restaurantId: boulangerie.id,
      status: 'PREPARING' as const,
      subtotal: 9.55,
      deliveryFee: 5.00,
      total: 14.55,
      discount: 0,
      customerName: 'Thomas Leroy',
      customerPhone: '06 98 76 54 32',
      customerEmail: 'thomas@example.com',
      deliveryAddress: '5 Rue des Pins, Cap Ferret 33970',
      deliveryDistanceKm: 1.1,
      paymentMethod: 'CASH' as const,
      paymentStatus: 'PENDING' as const,
      deliveryDate: today,
      deliverySlot: '09:30',
      notes: '',
      items: [
        { menuItemId: item(menuBoulangerie, 'Pain Complet')?.id, name: 'Pain Complet', price: 2.80, quantity: 1 },
        { menuItemId: item(menuBoulangerie, 'Pain Multigraines')?.id, name: 'Pain Multigraines', price: 3.10, quantity: 1 },
        { menuItemId: item(menuBoulangerie, 'Brioche Tressée Sucre')?.id, name: 'Brioche Tressée Sucre', price: 6.50, quantity: 1 },
      ],
    },
    // Commande 3 — Alice, en attente
    {
      orderNumber: 'TEST-003',
      restaurantId: alice.id,
      status: 'PAID' as const,
      subtotal: 53.80,
      deliveryFee: 5.00,
      total: 58.80,
      discount: 0,
      customerName: 'Sophie Martin',
      customerPhone: '06 55 44 33 22',
      customerEmail: 'sophie@example.com',
      deliveryAddress: '8 Avenue du Bassin, Cap Ferret 33970',
      deliveryDistanceKm: 0.6,
      paymentMethod: 'CARD' as const,
      paymentStatus: 'PAID' as const,
      deliveryDate: tomorrow,
      deliverySlot: '11:00',
      notes: 'Pour un apéro ce soir',
      items: [
        { menuItemId: item(menuAlice, 'Les Sauterelles')?.id, name: 'Les Sauterelles – Lionel Gosseaume', price: 9.90, quantity: 2 },
        { menuItemId: item(menuAlice, 'Fleurs de Graville')?.id, name: 'Fleurs de Graville', price: 17.90, quantity: 1 },
        { menuItemId: item(menuAlice, 'Champagne A.Bergère — Brut')?.id, name: 'Champagne A.Bergère — Brut', price: 33.00, quantity: 1 },
      ],
    },
    // Commande 4 — La Kabane, annulée
    {
      orderNumber: 'TEST-004',
      restaurantId: kabane.id,
      status: 'CANCELLED' as const,
      subtotal: 32.00,
      deliveryFee: 5.00,
      total: 37.00,
      discount: 0,
      customerName: 'Lucas Bernard',
      customerPhone: '06 11 22 33 44',
      customerEmail: 'lucas@example.com',
      deliveryAddress: '3 Chemin du Phare, Cap Ferret 33970',
      deliveryDistanceKm: 1.5,
      paymentMethod: 'CARD' as const,
      paymentStatus: 'REFUNDED' as const,
      deliveryDate: today,
      deliverySlot: '12:00',
      notes: '',
      items: [
        { menuItemId: item(menuKabane, 'Huîtres n°3 (12')?.id, name: 'Huîtres n°3 (12 pcs)', price: 15.00, quantity: 1 },
        { menuItemId: item(menuKabane, 'Vin Blanc')?.id, name: 'Vin Blanc 75cl', price: 12.00, quantity: 1 },
        { menuItemId: item(menuKabane, 'Pain, Beurre')?.id, name: 'Pain, Beurre & Citron', price: 3.00, quantity: 1 },
      ],
    },
    // Commande 5 — Boulangerie, prête
    {
      orderNumber: 'TEST-005',
      restaurantId: boulangerie.id,
      status: 'ON_THE_WAY' as const,
      subtotal: 28.00,
      deliveryFee: 5.00,
      total: 33.00,
      discount: 0,
      customerName: 'Isabelle Moreau',
      customerPhone: '06 77 88 99 00',
      customerEmail: 'isabelle@example.com',
      deliveryAddress: '22 Boulevard de la Plage, Cap Ferret 33970',
      deliveryDistanceKm: 0.3,
      paymentMethod: 'CARD' as const,
      paymentStatus: 'PAID' as const,
      deliveryDate: today,
      deliverySlot: '10:00',
      notes: 'Laisser devant la grille',
      items: [
        { menuItemId: item(menuBoulangerie, 'Tourtière aux Pommes')?.id, name: 'Tourtière aux Pommes', price: 28.00, quantity: 1 },
      ],
    },
  ]

  for (const order of orders) {
    const { items, ...orderData } = order
    await prisma.order.upsert({
      where: { orderNumber: orderData.orderNumber },
      update: {},
      create: {
        ...orderData,
        items: {
          create: items
            .filter((i) => i.menuItemId)
            .map((i) => ({
              menuItemId: i.menuItemId!,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
            })),
        },
      },
    })
    console.log(`  ✓ Commande ${orderData.orderNumber} (${orderData.customerName}) — ${orderData.status}`)
  }

  console.log('✅ Commandes test créées')
}

main().catch(console.error).finally(() => prisma.$disconnect())
