/**
 * Find ALL Auchan stores near Lège-Cap-Ferret / Arcachon basin
 */
import 'dotenv/config'
import { chromium } from 'playwright'

const SEARCHES = ['Lège-Cap-Ferret', 'Arcachon', 'La Teste-de-Buch', 'Gujan-Mestras', 'Biganos', 'Mérignac', 'Bordeaux']

async function main() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
  })
  const page = await ctx.newPage()

  await page.goto('https://www.auchan.fr', { waitUntil: 'domcontentloaded', timeout: 45000 })
  try { await page.click('#onetrust-accept-btn-handler', { timeout: 5000 }) } catch { /* */ }
  await page.waitForTimeout(1000)

  await page.click('button[class*="header"]')
  await page.waitForTimeout(1500)
  await page.waitForSelector('input[name="query"]', { timeout: 8000 })

  for (const city of SEARCHES) {
    await page.fill('input[name="query"]', city)
    await page.waitForTimeout(1200)

    // Click first suggestion
    try {
      await page.click('.geocoding__search-suggest', { timeout: 3000 })
      await page.waitForTimeout(2500)

      const stores = await page.evaluate(`(function() {
        return Array.from(document.querySelectorAll('[class*="journeyPosItem"]')).map(function(el) {
          var form = el.querySelector('.journeyChoice');
          var inputs = {};
          if (form) form.querySelectorAll('input').forEach(function(i) { inputs[i.name] = i.value; });
          return {
            name: (el.querySelector('.place-pos__name') || {}).textContent?.trim(),
            type: el.dataset.type,
            city: el.dataset.city,
            zipcode: el.dataset.zipcode,
            storeId: el.dataset.id,
            sellerId: inputs.sellerId,
            storeReference: inputs.storeReference,
            channels: inputs.channels,
            distance: (el.querySelector('[class*="pos-distance"]') || {}).textContent?.trim(),
          };
        });
      })()`)

      if ((stores as any[]).length) {
        console.log(`\n=== Results for "${city}" ===`)
        ;(stores as any[]).forEach((s: any) => console.log(`  ${s.distance || '?km'} | ${s.type} | ${s.name} (${s.zipcode} ${s.city}) | sellerId=${s.sellerId} | ref=${s.storeReference}`))
      }

      // Clear input for next search
      await page.fill('input[name="query"]', '')
      await page.waitForTimeout(500)
    } catch {
      console.log(`No suggestion for "${city}"`)
    }
  }

  await browser.close()
}
main().catch(console.error)
