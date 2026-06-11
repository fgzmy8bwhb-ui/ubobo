/**
 * Delete all products without price, then trigger a fresh scrape.
 * Usage: npx tsx server/scripts/reset-and-scrape.ts
 */
import 'dotenv/config'
import { prisma } from '../lib/prisma'
import { runAuchanScraper } from '../lib/auchan/scraper'

async function main() {
  const deleted = await prisma.auchanProduct.deleteMany({ where: { price: null } })
  console.log(`[reset] Deleted ${deleted.count} products without price`)

  const total = await prisma.auchanProduct.count()
  console.log(`[reset] ${total} products remaining in DB`)

  console.log('[reset] Starting fresh scrape with store selection...')
  await runAuchanScraper()

  await prisma.$disconnect()
}
main().catch(console.error)
