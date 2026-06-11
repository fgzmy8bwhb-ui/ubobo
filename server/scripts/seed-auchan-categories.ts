/**
 * Seed Auchan categories into DB from the static list extracted from live HTML.
 * Runs icon upload to R2 for each category.
 *
 * Usage: npx tsx server/scripts/seed-auchan-categories.ts
 */

import 'dotenv/config'
import axios from 'axios'
import { prisma } from '../lib/prisma'
import { uploadToR2 } from '../lib/r2'

// Extracted from live Auchan nav HTML (June 2026)
const CATEGORIES = [
  {
    slug: 'les-halles-d-auchan',
    name: "Les halles d'Auchan",
    auchanUrl: 'https://www.auchan.fr/les-halles-d-auchan/ca-b202209050930',
    group: 'Mes courses',
    iconCdnUrl: 'https://cdn.auchan.fr/content-getmesh/api/v1/larkcontent/nodes/553336ef1c6344ae8ec4ef616ae3b384/binary/picto?version=published&cs=580257a&format=rw&quality=75',
  },
  {
    slug: 'oeufs-produits-laitiers',
    name: 'Produits laitiers, oeufs, fromages',
    auchanUrl: 'https://www.auchan.fr/oeufs-produits-laitiers/ca-n01',
    group: 'Mes courses',
    iconCdnUrl: 'https://cdn.auchan.fr/content-getmesh/api/v1/larkcontent/nodes/e3a165a5b171492992b4e818ddddc1db/binary/picto?version=published&cs=b61806e&format=rw&quality=75',
  },
  {
    slug: 'fruits-legumes',
    name: 'Fruits, légumes',
    auchanUrl: 'https://www.auchan.fr/fruits-legumes/ca-n03',
    group: 'Mes courses',
    iconCdnUrl: 'https://cdn.auchan.fr/content-getmesh/api/v1/larkcontent/nodes/53b7805dacff4d278fe40122f3866280/binary/picto?version=published&cs=a85e905&format=rw&quality=75',
  },
  {
    slug: 'boucherie-volaille-poissonnerie',
    name: 'Boucherie, volaille, poissonnerie',
    auchanUrl: 'https://www.auchan.fr/boucherie-volaille-poissonnerie/ca-n02',
    group: 'Mes courses',
    iconCdnUrl: 'https://cdn.auchan.fr/content-getmesh/api/v1/larkcontent/nodes/6fc1cc83cd7d418b8431f13ae92428e2/binary/picto?version=published&cs=bd55b52&format=rw&quality=75',
  },
  {
    slug: 'charcuterie-traiteur-pain',
    name: 'Charcuterie, traiteur',
    auchanUrl: 'https://www.auchan.fr/charcuterie-traiteur-pain/ca-n12',
    group: 'Mes courses',
    iconCdnUrl: 'https://cdn.auchan.fr/content-getmesh/api/v1/larkcontent/nodes/4348c5e9dd9540ae9c9916b58f5595a9/binary/picto?version=published&cs=ce93004&format=rw&quality=75',
  },
  {
    slug: 'pain-patisserie',
    name: 'Pain, pâtisserie',
    auchanUrl: 'https://www.auchan.fr/pain-patisserie/ca-n1203',
    group: 'Mes courses',
    iconCdnUrl: 'https://cdn.auchan.fr/content-getmesh/api/v1/larkcontent/nodes/fe71f868c47c40aab3a9e46d39c1424b/binary/picto?version=published&cs=5e7a1b0&format=rw&quality=75',
  },
  {
    slug: 'surgeles',
    name: 'Surgelés',
    auchanUrl: 'https://www.auchan.fr/surgeles/ca-n04',
    group: 'Mes courses',
    iconCdnUrl: 'https://cdn.auchan.fr/content-getmesh/api/v1/larkcontent/nodes/d9e88924248842159b5ad91d2cce47d0/binary/picto?version=published&cs=420a1d1&format=rw&quality=75',
  },
  {
    slug: 'epicerie-sucree',
    name: 'Epicerie sucrée',
    auchanUrl: 'https://www.auchan.fr/epicerie-sucree/ca-n05',
    group: 'Mes courses',
    iconCdnUrl: 'https://cdn.auchan.fr/content-getmesh/api/v1/larkcontent/nodes/470935bb66ea42f998e3bfc1b971a321/binary/picto?version=published&cs=558e905&format=rw&quality=75',
  },
  {
    slug: 'epicerie-salee',
    name: 'Epicerie salée',
    auchanUrl: 'https://www.auchan.fr/epicerie-salee/ca-n06',
    group: 'Mes courses',
    iconCdnUrl: 'https://cdn.auchan.fr/content-getmesh/api/v1/larkcontent/nodes/ceba69fb0f4e406787cd0120a24ab3f4/binary/picto?version=published&cs=e352e42&format=rw&quality=75',
  },
  {
    slug: 'boissons-sans-alcool',
    name: 'Eaux, jus, soda, thés glacés',
    auchanUrl: 'https://www.auchan.fr/boissons-sans-alcool/ca-n13',
    group: 'Mes courses',
    iconCdnUrl: 'https://cdn.auchan.fr/content-getmesh/api/v1/larkcontent/nodes/f60fac4c95704883b2a44dbc114a1a01/binary/picto?version=published&cs=d34da6e&format=rw&quality=75',
  },
  {
    slug: 'vins-bieres-alcool',
    name: 'Vins, bières, alcools',
    auchanUrl: 'https://www.auchan.fr/vins-bieres-alcool/ca-n07',
    group: 'Mes courses',
    iconCdnUrl: 'https://cdn.auchan.fr/content-getmesh/api/v1/larkcontent/nodes/e925894472e44fd0a95fcbdb5792ec83/binary/picto?version=published&cs=72f81b4&format=rw&quality=75',
  },
  {
    slug: 'hygiene-beaute-parapharmacie',
    name: 'Hygiène, beauté',
    auchanUrl: 'https://www.auchan.fr/hygiene-beaute-parapharmacie/ca-n09',
    group: 'Mes courses',
    iconCdnUrl: 'https://cdn.auchan.fr/content-getmesh/api/v1/larkcontent/nodes/0c2727db1f784147a01110888c12969c/binary/picto?version=published&cs=decbb50&format=rw&quality=75',
  },
  {
    slug: 'entretien-maison',
    name: 'Entretien, accessoires de la maison',
    auchanUrl: 'https://www.auchan.fr/entretien-maison/ca-n10',
    group: 'Mes courses',
    iconCdnUrl: 'https://cdn.auchan.fr/content-getmesh/api/v1/larkcontent/nodes/e0eae11eb12942ce958e3d7c4b9ff63c/binary/picto?version=published&cs=99e8889&format=rw&quality=75',
  },
  {
    slug: 'bebe',
    name: 'Tout pour bébé',
    auchanUrl: 'https://www.auchan.fr/bebe/ca-n08',
    group: 'Mes courses',
    iconCdnUrl: 'https://cdn.auchan.fr/content-getmesh/api/v1/larkcontent/nodes/90c5ef0dd4de412ca485607969fc9b9a/binary/picto?version=published&cs=d3d2a12&format=rw&quality=75',
  },
  {
    slug: 'animalerie',
    name: 'Animalerie',
    auchanUrl: 'https://www.auchan.fr/animalerie/ca-n11',
    group: 'Mes courses',
    iconCdnUrl: 'https://cdn.auchan.fr/content-getmesh/api/v1/larkcontent/nodes/2cd430cac719496a89249c9f02dd41a1/binary/picto?version=published&cs=e613d18&format=rw&quality=75',
  },
  {
    slug: 'produits-de-nos-regions-et-du-monde',
    name: 'Produits du monde',
    auchanUrl: 'https://www.auchan.fr/produits-de-nos-regions-et-du-monde/ca-b08',
    group: 'Mes courses',
    iconCdnUrl: 'https://cdn.auchan.fr/content-getmesh/api/v1/larkcontent/nodes/8f9d5c8ee0a9402b8c8d8fc48ae773ca/binary/picto?version=published&cs=d13590f&format=rw&quality=75',
  },
  {
    slug: 'produits-de-nos-regions',
    name: 'Produits de nos régions',
    auchanUrl: 'https://www.auchan.fr/produits-de-nos-regions/ca-b202406051513',
    group: 'Mes courses',
    iconCdnUrl: 'https://cdn.auchan.fr/content-getmesh/api/v1/larkcontent/nodes/dcb38d4ade4740e486a2568ac5160ba8/binary/picto?version=published&cs=6ab56a3&format=rw&quality=75',
  },
  {
    slug: 'bio-et-nutrition',
    name: 'Bio et nutrition',
    auchanUrl: 'https://www.auchan.fr/bio-et-nutrition/ca-b04',
    group: 'Mes courses',
    iconCdnUrl: 'https://cdn.auchan.fr/content-getmesh/api/v1/larkcontent/nodes/03eee8d236b049c8a0f6d62ae644b834/binary/picto?version=published&cs=beb57bf&format=rw&quality=75',
  },
]

async function uploadIcon(cdnUrl: string, slug: string): Promise<string | null> {
  try {
    const res = await axios.get<ArrayBuffer>(cdnUrl, { responseType: 'arraybuffer', timeout: 15000 })
    const contentType = (res.headers['content-type'] as string) || 'image/webp'
    const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg').split(';')[0] ?? 'webp'
    const key = `auchan/categories/${slug}.${ext}`
    const url = await uploadToR2(key, Buffer.from(res.data), contentType)
    return url
  } catch (err) {
    console.warn(`  ✗ upload failed for ${slug}:`, (err as Error).message)
    return null
  }
}

async function main() {
  console.log(`[seed] Seeding ${CATEGORIES.length} Auchan categories…`)
  let seeded = 0

  for (const cat of CATEGORIES) {
    // Check if already has R2 icon
    const existing = await prisma.auchanCategory.findUnique({
      where: { slug: cat.slug },
      select: { iconUrl: true },
    })
    const alreadyOnR2 = existing?.iconUrl?.includes('r2.dev') || existing?.iconUrl?.includes('cloudflarestorage')

    let iconUrl: string | null = existing?.iconUrl ?? null

    if (!alreadyOnR2) {
      process.stdout.write(`  uploading icon: ${cat.slug}… `)
      const r2Url = await uploadIcon(cat.iconCdnUrl, cat.slug)
      if (r2Url) {
        iconUrl = r2Url
        console.log('✓')
      } else {
        iconUrl = cat.iconCdnUrl  // fallback to Auchan CDN
        console.log('⚠ fallback to CDN')
      }
    } else {
      console.log(`  skipping icon (already on R2): ${cat.slug}`)
    }

    await prisma.auchanCategory.upsert({
      where: { slug: cat.slug },
      create: { slug: cat.slug, name: cat.name, auchanUrl: cat.auchanUrl, iconUrl, group: cat.group },
      update: { name: cat.name, auchanUrl: cat.auchanUrl, iconUrl, group: cat.group, scrapedAt: new Date() },
    })
    seeded++
  }

  console.log(`[seed] ✓ ${seeded} categories seeded`)
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
