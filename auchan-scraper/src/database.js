require('dotenv').config();
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS auchan_products (
  product_id      TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  brand           TEXT,
  price           NUMERIC(10,2),
  currency        TEXT DEFAULT 'EUR',
  weight_volume   TEXT,
  pack_size       TEXT,
  ean             TEXT,
  category        TEXT,
  description     TEXT,
  image_url       TEXT,
  url             TEXT,
  scraped_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auchan_products_category ON auchan_products(category);
CREATE INDEX IF NOT EXISTS idx_auchan_products_ean ON auchan_products(ean);
`;

async function insertPostgres(products) {
  const client = new Client({
    host: process.env.PG_HOST,
    port: +process.env.PG_PORT,
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
  });
  await client.connect();
  await client.query(SCHEMA_SQL);

  const sql = `
    INSERT INTO auchan_products
      (product_id, name, brand, price, currency, weight_volume, pack_size,
       ean, category, description, image_url, url)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (product_id) DO UPDATE SET
      name=EXCLUDED.name, brand=EXCLUDED.brand, price=EXCLUDED.price,
      weight_volume=EXCLUDED.weight_volume, pack_size=EXCLUDED.pack_size,
      ean=EXCLUDED.ean, category=EXCLUDED.category,
      description=EXCLUDED.description, image_url=EXCLUDED.image_url,
      url=EXCLUDED.url, scraped_at=NOW();
  `;
  for (const p of products) {
    await client.query(sql, [
      p.productId, p.name, p.brand, p.price, p.currency,
      p.weightVolume, p.packSize, p.ean, p.category,
      p.description, p.imageUrl, p.url,
    ]);
  }
  await client.end();
}

async function insertSupabase(products) {
  const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const rows = products.map((p) => ({
    product_id: p.productId, name: p.name, brand: p.brand,
    price: p.price, currency: p.currency,
    weight_volume: p.weightVolume, pack_size: p.packSize,
    ean: p.ean, category: p.category,
    description: p.description, image_url: p.imageUrl, url: p.url,
  }));
  const { error } = await supa
    .from('auchan_products')
    .upsert(rows, { onConflict: 'product_id' });
  if (error) throw error;
}

async function importToDb(products) {
  const mode = process.env.DB_MODE || 'none';
  if (mode === 'postgres') return insertPostgres(products);
  if (mode === 'supabase') return insertSupabase(products);
  console.log('[DB] DB_MODE=none → import ignoré.');
}

module.exports = { importToDb, SCHEMA_SQL };
