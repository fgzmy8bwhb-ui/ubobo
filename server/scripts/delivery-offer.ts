import { prisma } from '../lib/prisma'

async function main() {
  const mode = process.argv[2]
  if (mode === 'apply') {
    await prisma.appSettings.upsert({
      where: { id: 'singleton' },
      update: { deliveryBaseFee: 5, deliveryPerKmFee: 0 },
      create: { id: 'singleton', deliveryBaseFee: 5, deliveryPerKmFee: 0 },
    })
    console.log('Applied: flat 5€ delivery')
  } else if (mode === 'revert') {
    await prisma.appSettings.update({
      where: { id: 'singleton' },
      data: { deliveryBaseFee: 3, deliveryPerKmFee: 1 },
    })
    console.log('Reverted to normal delivery pricing (3€ + 1€/min)')
  } else {
    console.log('Usage: apply | revert')
  }
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
