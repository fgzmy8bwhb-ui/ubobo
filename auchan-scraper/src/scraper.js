require('dotenv').config();
const { chromium } = require('playwright');
const { extractProductsFromPage, enrichWithProductDetails } = require('./parser');
const state = require('./state');
const { log, makeBar } = require('./logger');

/**
 * Construit l'URL d'une page de pagination.
 * Auchan utilise ?page=N
 */
function buildPageUrl(baseUrl, pageNum) {
  if (pageNum <= 1) return baseUrl;
  const u = new URL(baseUrl);
  u.searchParams.set('page', pageNum);
  return u.toString();
}

/**
 * Détecte la présence d'une page suivante via le bloc de pagination.
 */
async function hasNextPage(page) {
  return page.evaluate(() => {
    const nav = document.querySelector('.pagination-main__container');
    if (!nav) return false;
    const next = nav.querySelector('a[aria-label*="suivante"]');
    return !!next;
  });
}

async function acceptCookies(page) {
  try {
    await page.click('#onetrust-accept-btn-handler', { timeout: 5000 });
    await page.waitForTimeout(500);
  } catch { /* déjà accepté ou popin absente */ }
}

async function scrapeCategory(category, opts = {}) {
  const {
    headless = process.env.HEADLESS !== 'false',
    fetchDetails = false,    // true = récupère description + EAN sur chaque PDP (lent)
    maxPages = 1000,
    navDelayMs = +(process.env.NAV_DELAY_MS || 1500),
  } = opts;

  const browser = await chromium.launch({ headless });
  const ctx = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();

  const saved = state.load(category.slug);
  const seenIds = new Set(saved.productIds);
  const products = [];
  let pageNum = saved.lastPage + 1;

  log.info(`▶ Catégorie "${category.name}" — reprise à la page ${pageNum}`);

  await page.goto(buildPageUrl(category.url, 1), { waitUntil: 'domcontentloaded' });
  await acceptCookies(page);

  while (pageNum <= maxPages) {
    const url = buildPageUrl(category.url, pageNum);
    log.info(`  Page ${pageNum} → ${url}`);

    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: +(process.env.PAGE_TIMEOUT || 45000),
      });
      // Scroll → déclenche le lazy-load des images
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let y = 0;
          const t = setInterval(() => {
            window.scrollBy(0, 600);
            y += 600;
            if (y >= document.body.scrollHeight) { clearInterval(t); resolve(); }
          }, 150);
        });
      });
      await page.waitForTimeout(500);

      const batch = await extractProductsFromPage(page, category);
      const fresh = batch.filter((p) => p.productId && !seenIds.has(p.productId));
      fresh.forEach((p) => seenIds.add(p.productId));
      products.push(...fresh);

      log.ok(`    +${fresh.length} produits (cumulés: ${seenIds.size})`);

      // Checkpoint pour reprise
      state.save(category.slug, {
        lastPage: pageNum,
        productIds: Array.from(seenIds),
      });

      const next = await hasNextPage(page);
      if (!next || fresh.length === 0) break;

      pageNum++;
      await page.waitForTimeout(navDelayMs);
    } catch (e) {
      log.err(`    Erreur page ${pageNum}: ${e.message}. Reprise possible au prochain run.`);
      break;
    }
  }

  if (fetchDetails && products.length) {
    log.info(`  Récupération des fiches produits (description + EAN)…`);
    const bar = makeBar('  PDP');
    bar.start(products.length, 0);
    const pdpPage = await ctx.newPage();
    for (const p of products) {
      await enrichWithProductDetails(pdpPage, p);
      bar.increment();
      await pdpPage.waitForTimeout(300);
    }
    bar.stop();
    await pdpPage.close();
  }

  await browser.close();
  return products;
}

module.exports = { scrapeCategory };
