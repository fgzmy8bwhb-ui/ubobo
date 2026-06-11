import { chromium } from 'playwright'
import axios from 'axios'
import { prisma } from '../prisma'
import { uploadToR2 } from '../r2'

const BASE = 'https://www.auchan.fr'

async function uploadCategoryIcon(auchanIconUrl: string, slug: string): Promise<string | null> {
  try {
    const res = await axios.get<ArrayBuffer>(auchanIconUrl, { responseType: 'arraybuffer', timeout: 15000 })
    const contentType = (res.headers['content-type'] as string) || 'image/webp'
    const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg').split(';')[0] ?? 'webp'
    const key = `auchan/categories/${slug}.${ext}`
    return await uploadToR2(key, Buffer.from(res.data), contentType)
  } catch {
    return null
  }
}

export async function scrapeAuchanCategories(): Promise<number> {
  console.log('[auchan-categories] Scraping navigation…')
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
  })
  const page = await ctx.newPage()

  let upserted = 0

  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 })

    // Accept cookies
    try {
      await page.click('#onetrust-accept-btn-handler', { timeout: 5000 })
      await page.waitForTimeout(500)
    } catch { /* already accepted */ }

    // Try to open navigation layer if needed
    try {
      await page.click(
        '[data-tracking-label="Nos rayons"], .navigation-trigger, .main-nav__trigger, [aria-label*="rayons"]',
        { timeout: 4000 },
      )
      await page.waitForTimeout(1000)
    } catch { /* nav might already be open */ }

    // Extract all category groups from the navigation layer
    const rawCategories = await page.evaluate(`(function() {
      var results = [];
      var layerGroups = document.querySelectorAll('.navigation-layer-category');
      layerGroups.forEach(function(group) {
        var groupTitle = group.querySelector('h2.navigation-layer__title--main');
        var groupName = groupTitle ? groupTitle.textContent.trim() : 'Autres';
        var nodes = group.querySelectorAll('.navigation-node-sorted[data-root-link]');
        nodes.forEach(function(node) {
          var rootLink = node.getAttribute('data-root-link') || '';
          var nodeTitle = node.getAttribute('data-node-title') || '';
          var imgEl = node.querySelector('img');
          var auchanIconUrl = imgEl ? (imgEl.getAttribute('src') || null) : null;
          if (!rootLink || rootLink === '#') return;
          results.push({
            slug: rootLink.replace(/^\\//, '').split('/')[0],
            name: nodeTitle,
            auchanUrl: '${BASE}' + rootLink,
            auchanIconUrl: auchanIconUrl,
            group: groupName,
          });
        });
      });
      return results;
    })()`) as Array<{ slug: string; name: string; auchanUrl: string; auchanIconUrl: string | null; group: string }>

    // Deduplicate by slug
    const seen = new Set<string>()
    for (const cat of rawCategories) {
      if (!cat.slug || seen.has(cat.slug)) continue
      seen.add(cat.slug)

      // Check if we already have an R2 icon for this category
      const existing = await prisma.auchanCategory.findUnique({
        where: { slug: cat.slug },
        select: { iconUrl: true },
      })

      // Upload to R2 only if:
      // - we have an Auchan icon URL
      // - and we don't already have an R2 icon stored
      let iconUrl = existing?.iconUrl ?? null
      const alreadyOnR2 = iconUrl?.includes('r2.dev') || iconUrl?.includes('cloudflarestorage')

      if (!alreadyOnR2 && cat.auchanIconUrl) {
        const r2Url = await uploadCategoryIcon(cat.auchanIconUrl, cat.slug)
        if (r2Url) {
          iconUrl = r2Url
          console.log(`  [auchan-categories] ✓ icon uploaded: ${cat.slug}`)
        } else {
          // Keep original Auchan CDN URL as fallback
          iconUrl = cat.auchanIconUrl
        }
      }

      await prisma.auchanCategory.upsert({
        where: { slug: cat.slug },
        create: { slug: cat.slug, name: cat.name, auchanUrl: cat.auchanUrl, iconUrl, group: cat.group },
        update: { name: cat.name, auchanUrl: cat.auchanUrl, iconUrl, group: cat.group, scrapedAt: new Date() },
      })
      upserted++
    }

    console.log(`[auchan-categories] ✓ ${upserted} categories upserted`)
  } finally {
    await browser.close()
  }

  return upserted
}
