const fs = require('fs');
const path = require('path');
const axios = require('axios');
const pLimit = require('p-limit');

const IMG_DIR = path.resolve(__dirname, '../output/images');
fs.mkdirSync(IMG_DIR, { recursive: true });

function filenameFromUrl(url, productId) {
  const ext = (url.match(/\.(jpe?g|png|webp|avif)/i) || [, 'jpg'])[1];
  return `${productId}.${ext.toLowerCase()}`;
}

async function downloadOne(url, productId, categorySlug) {
  if (!url) return null;
  const dir = path.join(IMG_DIR, categorySlug);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, filenameFromUrl(url, productId));

  if (fs.existsSync(file)) return file; // déjà téléchargée → reprise OK

  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
  fs.writeFileSync(file, res.data);
  return file;
}

async function downloadAll(products, categorySlug, concurrency = 5, onProgress) {
  const limit = pLimit(concurrency);
  let done = 0;
  await Promise.all(
    products.map((p) =>
      limit(async () => {
        try { await downloadOne(p.imageUrl, p.productId, categorySlug); }
        catch (e) { /* ignore : pas de blocage */ }
        done++;
        onProgress?.(done);
      })
    )
  );
}

module.exports = { downloadAll };
