import { chromium, type Page } from 'playwright'
import axios from 'axios'
import { uploadToR2 } from '../r2'
import { prisma } from '../prisma'
import type { AuchanCategory } from './categories'

// Selectors updated to match current Auchan HTML structure (2026)
// Price is now: <meta itemprop="price" content="7.20"> inside .product-thumbnail__price
// Image is now: <meta itemprop="image" content="https://cdn.auchan.fr/..."> inside <picture>
const SELECTORS = {
  card: 'article.product-thumbnail[itemtype="http://schema.org/Product"]',
  name: '.product-thumbnail__description',
  brand: '[itemprop="brand"]',
  price: 'meta[itemprop="price"]',
  image: 'meta[itemprop="image"]',
  link: 'a.product-thumbnail__details-wrapper',
  attributes: '.product-attribute',
}

interface RawProduct {
  productId: string
  name: string
  brand: string | null
  price: number | null
  currency: string
  weightVolume: string | null
  packSize: string | null
  category: string
  imageUrl: string | null
  sourceUrl: string | null
}

async function acceptCookies(page: Page) {
  try {
    await page.click('#onetrust-accept-btn-handler', { timeout: 5000 })
    await page.waitForTimeout(500)
  } catch { /* already accepted */ }
}

/**
 * Select "Auchan Click&collect Lège-Cap-Ferret" via the real UI flow to unlock prices.
 * Navigates to auchan.fr, opens the store locator, searches for Lège, then clicks
 * the Choisir button on the Lège-Cap-Ferret pickup point (ref 6375).
 */
async function selectStore(page: Page) {
  try {
    await page.goto('https://www.auchan.fr', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await acceptCookies(page)

    // Open store selector
    await page.click('button[class*="header"]', { timeout: 6000 })
    await page.waitForSelector('input[name="query"]', { timeout: 8000 })

    // Type city and wait for autocomplete
    await page.fill('input[name="query"]', 'Lège-Cap-Ferret')
    await page.waitForTimeout(1200)

    // Click first autocomplete suggestion
    await page.click('.geocoding__search-suggest', { timeout: 5000 })
    await page.waitForTimeout(2500)

    // Find and click "Choisir" for the Lège-Cap-Ferret store (ref 6375)
    // The form has input[name="storeReference"][value="6375"]
    const chosen = await page.evaluate(`(function() {
      var forms = document.querySelectorAll('.journeyChoice');
      for (var i = 0; i < forms.length; i++) {
        var refInput = forms[i].querySelector('input[name="storeReference"]');
        if (refInput && refInput.value === '6375') {
          forms[i].querySelector('button.btnJourneySubmit').click();
          return true;
        }
      }
      // Fallback: click the first available store
      var first = document.querySelector('.btnJourneySubmit');
      if (first) { first.click(); return 'fallback'; }
      return false;
    })()`)

    console.log('  [auchan-scraper] store selected:', chosen)
    await page.waitForTimeout(1500)
  } catch (e) {
    console.warn('  [auchan-scraper] selectStore failed (prices may be missing):', (e as Error).message)
  }
}

// Pass as string to avoid esbuild __name helper injection
async function scrollFull(page: Page) {
  await page.evaluate(`(async function() {
    await new Promise(function(resolve) {
      var y = 0;
      var t = setInterval(function() {
        window.scrollBy(0, 600);
        y += 600;
        if (y >= document.body.scrollHeight) { clearInterval(t); resolve(); }
      }, 150);
    });
  })()`)
}

async function hasNextPage(page: Page): Promise<boolean> {
  return page.evaluate(`(function() {
    var nav = document.querySelector('.pagination-main__container');
    if (!nav) return false;
    return !!nav.querySelector('a[aria-label*="suivante"]');
  })()`) as Promise<boolean>
}

function buildPageUrl(baseUrl: string, pageNum: number): string {
  if (pageNum <= 1) return baseUrl
  const u = new URL(baseUrl)
  u.searchParams.set('page', String(pageNum))
  return u.toString()
}

async function extractProducts(page: Page, category: AuchanCategory): Promise<RawProduct[]> {
  const sel = JSON.stringify(SELECTORS)
  const catName = JSON.stringify(category.name)

  return page.evaluate(`(function() {
    var SEL = ${sel};
    var categoryName = ${catName};
    var cards = Array.from(document.querySelectorAll(SEL.card));
    return cards.map(function(card) {
      function get(s) { return card.querySelector(s); }
      function txt(s) { var el = get(s); return el ? (el.textContent || '').trim() : ''; }

      var brand = txt(SEL.brand) || null;
      var fullName = txt(SEL.name).replace(/\\s+/g, ' ').trim();
      var name = brand ? fullName.replace(brand, '').trim() : fullName;

      var priceEl = get(SEL.price);
      var priceRaw = priceEl ? (priceEl.getAttribute('content') || txt('.product-price')) : txt('.product-price');
      var price = parseFloat(String(priceRaw).replace(',', '.')) || null;

      var imageEl = get(SEL.image);
      var imageUrl = imageEl ? (imageEl.getAttribute('content') || null) : null;

      var linkEl = get(SEL.link);
      var href = linkEl ? linkEl.getAttribute('href') : null;
      var sourceUrl = href ? new URL(href, location.origin).href : null;

      var productId = card.dataset ? card.dataset.id : null;

      var attrs = Array.from(card.querySelectorAll(SEL.attributes)).map(function(a) {
        return (a.textContent || '').trim();
      });
      var weightVolume = attrs.find(function(a) { return /g|kg|ml|cl|l\\b/i.test(a); }) || null;
      var packSize = attrs.find(function(a) { return /x\\d|\\d\\s*pi.ce/i.test(a); }) || null;

      return { productId: productId, name: name, brand: brand, price: price, currency: 'EUR',
               weightVolume: weightVolume, packSize: packSize, category: categoryName,
               imageUrl: imageUrl, sourceUrl: sourceUrl };
    }).filter(function(p) { return p.productId && p.name; });
  })()`) as Promise<RawProduct[]>
}

async function uploadImageToR2(imageUrl: string, productId: string): Promise<string | null> {
  try {
    const res = await axios.get<ArrayBuffer>(imageUrl, { responseType: 'arraybuffer', timeout: 15000 })
    const contentType = (res.headers['content-type'] as string) || 'image/jpeg'
    const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
    const key = `auchan/${productId}.${ext}`
    return await uploadToR2(key, Buffer.from(res.data), contentType)
  } catch {
    return null
  }
}

interface ScrapeStats { created: number; updated: number; unchanged: number }

async function syncProduct(p: RawProduct): Promise<'created' | 'updated' | 'unchanged'> {
  const existing = await prisma.auchanProduct.findUnique({
    where: { productId: p.productId },
    select: { name: true, brand: true, price: true, weightVolume: true, imageUrl: true, disabled: true },
  })

  // Skip disabled products entirely — don't re-enable or update them
  if (existing?.disabled) return 'unchanged'

  if (!existing) {
    // New product — upload image and insert
    const imageUrl = p.imageUrl ? await uploadImageToR2(p.imageUrl, p.productId) : null
    await prisma.auchanProduct.create({ data: { ...p, imageUrl } })
    return 'created'
  }

  // Detect what changed
  const priceChanged  = p.price !== null && p.price !== existing.price
  const nameChanged   = p.name !== existing.name
  const brandChanged  = p.brand !== existing.brand
  const weightChanged = p.weightVolume !== existing.weightVolume
  const needsImage    = !existing.imageUrl && !!p.imageUrl

  if (!priceChanged && !nameChanged && !brandChanged && !weightChanged && !needsImage) {
    // Nothing changed — just bump scrapedAt silently (no image re-upload, no write if recent)
    return 'unchanged'
  }

  // Upload image only if missing
  const imageUrl = existing.imageUrl ?? (needsImage ? await uploadImageToR2(p.imageUrl!, p.productId) : null)

  await prisma.auchanProduct.update({
    where: { productId: p.productId },
    data: {
      ...(nameChanged   ? { name: p.name }              : {}),
      ...(brandChanged  ? { brand: p.brand }             : {}),
      ...(priceChanged  ? { price: p.price }             : {}),
      ...(weightChanged ? { weightVolume: p.weightVolume } : {}),
      ...(imageUrl      ? { imageUrl }                   : {}),
      scrapedAt: new Date(),
    },
  })
  return 'updated'
}

async function scrapeCategory(category: AuchanCategory): Promise<ScrapeStats> {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
  })
  const page = await ctx.newPage()
  const stats: ScrapeStats = { created: 0, updated: 0, unchanged: 0 }

  try {
    // Select Auchan Drive Biganos first to unlock prices
    await selectStore(page)

    await page.goto(buildPageUrl(category.url, 1), { waitUntil: 'domcontentloaded', timeout: 45000 })

    let pageNum = 1
    const seen = new Set<string>()

    while (true) {
      if (pageNum > 1) {
        await page.goto(buildPageUrl(category.url, pageNum), { waitUntil: 'domcontentloaded', timeout: 45000 })
      }
      await scrollFull(page)
      await page.waitForTimeout(500)

      const products = await extractProducts(page, category)
      const fresh = products.filter((p) => p.productId && !seen.has(p.productId))
      fresh.forEach((p) => seen.add(p.productId))

      for (const p of fresh) {
        const result = await syncProduct(p)
        stats[result]++
      }

      console.log(
        `  [auchan] ${category.slug} p.${pageNum}` +
        ` → +${stats.created} new | ~${stats.updated} upd | =${stats.unchanged} same`,
      )

      if (!(await hasNextPage(page)) || fresh.length === 0) break
      pageNum++
      await page.waitForTimeout(+(process.env.SCRAPER_NAV_DELAY_MS ?? 1500))
    }
  } finally {
    await browser.close()
  }

  return stats
}

async function loadCategories(): Promise<AuchanCategory[]> {
  const dbCats = await prisma.auchanCategory.findMany({
    where: { group: 'Mes courses' },
    orderBy: { name: 'asc' },
  })
  if (dbCats.length > 0) {
    return dbCats.map((c) => ({ slug: c.slug, name: c.name, url: c.auchanUrl }))
  }
  // Fallback to static list if DB is empty
  const { AUCHAN_CATEGORIES } = await import('./categories')
  return AUCHAN_CATEGORIES
}

export async function runAuchanScraper(): Promise<void> {
  console.log('[auchan-scraper] Starting nightly scrape...')

  // Step 1: refresh categories from Auchan nav
  try {
    const { scrapeAuchanCategories } = await import('./category-scraper')
    await scrapeAuchanCategories()
  } catch (err) {
    console.warn('[auchan-scraper] Category scrape failed, using existing:', (err as Error).message)
  }

  // Step 2: scrape products for each category
  const categories = await loadCategories()
  const total = { created: 0, updated: 0, unchanged: 0 }
  for (const cat of categories) {
    try {
      const s = await scrapeCategory(cat)
      total.created   += s.created
      total.updated   += s.updated
      total.unchanged += s.unchanged
      console.log(
        `[auchan-scraper] ✓ ${cat.name}: +${s.created} new | ~${s.updated} updated | =${s.unchanged} unchanged`,
      )
    } catch (err) {
      console.error(`[auchan-scraper] ✗ ${cat.name}:`, (err as Error).message)
    }
  }
  console.log(
    `[auchan-scraper] Done. Total: +${total.created} new | ~${total.updated} updated | =${total.unchanged} unchanged`,
  )
}
