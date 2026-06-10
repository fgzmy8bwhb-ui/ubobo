#!/usr/bin/env node
require('dotenv').config();
const categories = require('../config/categories');
const { scrapeCategory } = require('./scraper');
const { exportJson, exportCsv } = require('./exporter');
const { downloadAll } = require('./imageDownloader');
const { importToDb } = require('./database');
const { log, makeBar } = require('./logger');

async function run() {
  const mode = process.argv[2] || 'scrape';

  for (const cat of categories) {
    log.info(`\n========== ${cat.name} (${cat.slug}) ==========`);

    // 1) Scraping
    const products = await scrapeCategory(cat, {
      fetchDetails: false,  // ← passez à true pour description + EAN (plus lent)
    });
    log.ok(`Total produits récupérés : ${products.length}`);

    // 2) Export CSV + JSON
    const csv = exportCsv(products, cat.slug);
    const json = exportJson(products, cat.slug);
    log.ok(`CSV  → ${csv}`);
    log.ok(`JSON → ${json}`);

    // 3) Téléchargement des images
    log.info(`Téléchargement des images…`);
    const bar = makeBar('  IMG');
    bar.start(products.length, 0);
    await downloadAll(
      products,
      cat.slug,
      +(process.env.IMAGE_CONCURRENCY || 5),
      (done) => bar.update(done)
    );
    bar.stop();

    // 4) Import en base (si configuré)
    if (mode === 'import-db' || (process.env.DB_MODE && process.env.DB_MODE !== 'none')) {
      log.info(`Import en base (mode=${process.env.DB_MODE})…`);
      await importToDb(products);
      log.ok(`Import terminé.`);
    }
  }
  log.ok('\n✓ Tous les imports sont terminés.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
