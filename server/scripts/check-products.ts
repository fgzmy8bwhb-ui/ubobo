import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function main() {
  const total = await prisma.auchanProduct.count()
  const withPrice = await prisma.auchanProduct.count({ where: { price: { not: null } } })
  const withImage = await prisma.auchanProduct.count({ where: { imageUrl: { not: null } } })
  const sample = await prisma.auchanProduct.findFirst({ where: { price: { not: null } }, select: { productId: true, name: true, price: true, imageUrl: true, category: true } })
  const noPrice = await prisma.auchanProduct.findFirst({ where: { price: null }, select: { productId: true, name: true, sourceUrl: true, category: true } })
  console.log({ total, withPrice, withImage })
  console.log('sample with price:', sample)
  console.log('sample without price:', noPrice)
  await prisma.$disconnect()
}
main().catch(console.error)
