/**
 * Extraction des produits depuis le DOM d'une page de listing Auchan.
 *
 * IMPORTANT — où modifier si Auchan change le HTML :
 *   - SELECTORS.card          : conteneur d'un produit
 *   - SELECTORS.name          : nom + marque
 *   - SELECTORS.price         : prix affiché
 *   - SELECTORS.image         : image principale
 *   - SELECTORS.link          : lien vers la fiche produit (pour description/EAN)
 *   - SELECTORS.attributes    : poids/volume/lot
 *
 * Auchan utilise schema.org/Product → on s'appuie sur itemprop quand possible
 * (plus stable que les classes CSS).
 */
const SELECTORS = {
  card: 'article.product-thumbnail[itemtype="http://schema.org/Product"]',
  name: '.product-thumbnail__description',
  brand: '[itemprop="brand"]',
  price: '[itemprop="price"]',
  image: '[itemprop="image"]',
  link: 'a.product-thumbnail__details-wrapper',
  attributes: '.product-attribute',
  productId: 'data-id',
};

/**
 * Sélecteurs pour la fiche produit (PDP). Ouverts uniquement si on veut
 * récupérer description + EAN (plus lent). Désactivable via opts.fetchDetails.
 */
const PDP_SELECTORS = {
  description: '.product-description, [itemprop="description"]',
  ean: 'td:has-text("EAN") + td, dt:has-text("EAN") + dd, [itemprop="gtin13"]',
};

/**
 * Extrait tous les produits de la page courante via page.evaluate().
 */
async function extractProductsFromPage(page, category) {
  return page.evaluate(
    ({ SEL, categoryName }) => {
      const cards = Array.from(document.querySelectorAll(SEL.card));
      return cards.map((card) => {
        const get = (sel) => card.querySelector(sel);
        const txt = (sel) => get(sel)?.textContent?.trim() || '';

        const brand = txt(SEL.brand);
        let fullName = txt(SEL.name).replace(/\s+/g, ' ').trim();
        const name = fullName.replace(brand, '').trim();

        const priceRaw = get(SEL.price)?.getAttribute('content')
          || txt('.product-price');
        const price = parseFloat(String(priceRaw).replace(',', '.')) || null;

        const imageUrl = get(SEL.image)?.getAttribute('content') || null;

        const linkEl = get(SEL.link);
        const url = linkEl ? new URL(linkEl.getAttribute('href'), location.origin).href : null;

        const attrs = Array.from(card.querySelectorAll(SEL.attributes))
          .map((a) => a.textContent.trim());
        const weightVolume = attrs.find((a) => /\d+\s*(g|kg|ml|cl|l)\b/i.test(a)) || null;
        const packSize     = attrs.find((a) => /pi[eè]ces?/i.test(a)) || null;

        const productId = card.getAttribute(SEL.productId);

        return {
          productId,
          name,
          brand,
          price,
          currency: 'EUR',
          weightVolume,
          packSize,
          imageUrl,
          url,
          category: categoryName,
          description: null,
          ean: null,
        };
      });
    },
    { SEL: SELECTORS, categoryName: category.name }
  );
}

/**
 * Récupère description + EAN sur la fiche produit (PDP).
 */
async function enrichWithProductDetails(page, product) {
  if (!product.url) return product;
  try {
    await page.goto(product.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const details = await page.evaluate((SEL) => {
      const desc = document.querySelector(SEL.description)?.textContent?.trim() || null;

      let ean = document.querySelector('[itemprop="gtin13"]')?.getAttribute('content')
              || document.querySelector('[itemprop="gtin13"]')?.textContent?.trim()
              || null;
      if (!ean) {
        const rows = document.querySelectorAll('tr, dl > div, li');
        for (const row of rows) {
          const t = row.textContent || '';
          const m = t.match(/EAN[^\d]*(\d{8,14})/i);
          if (m) { ean = m[1]; break; }
        }
      }
      return { desc, ean };
    }, PDP_SELECTORS);
    product.description = details.desc;
    product.ean = details.ean;
  } catch (e) {
    // On n'échoue pas tout le scraping pour une fiche
  }
  return product;
}

module.exports = { extractProductsFromPage, enrichWithProductDetails, SELECTORS };
