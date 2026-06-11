import 'dotenv/config'
import { chromium, type Page } from 'playwright'

async function acceptCookies(page: Page) {
  try { await page.click('#onetrust-accept-btn-handler', { timeout: 5000 }) } catch {}
}

async function selectStore(page: Page) {
  await page.goto('https://www.auchan.fr', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await acceptCookies(page)
  await page.click('button[class*="header"]', { timeout: 6000 })
  await page.waitForSelector('input[name="query"]', { timeout: 8000 })
  await page.fill('input[name="query"]', 'Lège-Cap-Ferret')
  await page.waitForTimeout(1200)
  await page.click('.geocoding__search-suggest', { timeout: 5000 })
  await page.waitForTimeout(2500)

  const chosen = await page.evaluate(`(function() {
    var forms = document.querySelectorAll('.journeyChoice');
    for (var i = 0; i < forms.length; i++) {
      var refInput = forms[i].querySelector('input[name="storeReference"]');
      if (refInput && refInput.value === '6375') {
        forms[i].querySelector('button.btnJourneySubmit').click();
        return 'lege-6375';
      }
    }
    var first = document.querySelector('.btnJourneySubmit');
    if (first) { first.click(); return 'fallback'; }
    return false;
  })()`)
  console.log('Store selected:', chosen)
  await page.waitForTimeout(1500)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
  })
  const page = await ctx.newPage()

  await selectStore(page)

  await page.goto('https://www.auchan.fr/epicerie-sucree/ca-n05', { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.evaluate(`(function() { window.scrollBy(0, 1200); })()`)
  await page.waitForTimeout(2000)

  const check = await page.evaluate(`(function() {
    var cards = Array.from(document.querySelectorAll('article.product-thumbnail')).slice(0, 5)
    return cards.map(function(c) {
      var meta = c.querySelector('meta[itemprop="price"]')
      return {
        id: c.dataset.id,
        outOfStock: c.classList.contains('outOfStock'),
        price: meta ? meta.getAttribute('content') : null,
      }
    })
  })()`)
  console.log('Products:', JSON.stringify(check, null, 2))

  await browser.close()
}
main().catch(console.error)
