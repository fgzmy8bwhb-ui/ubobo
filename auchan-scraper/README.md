# Auchan Scraper

Scraper Node.js + Playwright pour récupérer les produits d'une catégorie Auchan
et les exporter en CSV / JSON / images / base PostgreSQL ou Supabase.

## Installation

```bash
cd auchan-scraper
npm install
npx playwright install chromium
cp .env.example .env
```

Éditez `.env` selon votre cible :
- `DB_MODE=none` → exporte uniquement CSV/JSON + images
- `DB_MODE=postgres` → insère aussi dans PostgreSQL (renseignez PG_*)
- `DB_MODE=supabase` → insère dans Supabase (renseignez SUPABASE_*)

## Lancement

```bash
npm run scrape         # Scrape + CSV + JSON + images
npm run import-db      # Idem + insertion en base
```

## Catégories à scraper

Modifiez `config/categories.js`. Ajoutez autant d'objets que nécessaire :

```js
{
  slug: 'fruits-legumes',
  name: 'Fruits et légumes',
  url: 'https://www.auchan.fr/fruits-legumes/ca-n03',
}
```

## Où modifier si Auchan change son HTML

- **Sélecteurs CSS produits** → `src/parser.js` (constantes `SELECTORS` / `PDP_SELECTORS`)
- **Pagination** → `src/scraper.js` → `buildPageUrl` et `hasNextPage`
- **Délais anti-ban** → variable `NAV_DELAY_MS` dans `.env`

## Reprise sur erreur

À chaque page traitée, un checkpoint est écrit dans `output/state/<slug>.json`
(dernière page + IDs produits déjà vus). Si le script crashe, relancez-le : il
reprend automatiquement à la page suivante et déduplique.

Pour repartir de zéro : supprimez le fichier de state correspondant.

## Sortie

- `output/data/<slug>.csv` — CSV (séparateur `;`)
- `output/data/<slug>.json` — JSON pretty-printed
- `output/images/<slug>/<productId>.jpg` — images produits
- `output/state/<slug>.json` — checkpoint de reprise

## Schéma SQL

Table créée automatiquement en mode `postgres`. Pour Supabase, exécutez :

```sql
CREATE TABLE IF NOT EXISTS auchan_products (
  product_id    TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  brand         TEXT,
  price         NUMERIC(10,2),
  currency      TEXT DEFAULT 'EUR',
  weight_volume TEXT,
  pack_size     TEXT,
  ean           TEXT,
  category      TEXT,
  description   TEXT,
  image_url     TEXT,
  url           TEXT,
  scraped_at    TIMESTAMPTZ DEFAULT NOW()
);
```

## Description + EAN

Désactivés par défaut (lents : 1 requête PDP par produit). Activez en passant
`fetchDetails: true` dans `src/index.js` :

```js
const products = await scrapeCategory(cat, { fetchDetails: true });
```

## Note légale

Le scraping d'Auchan n'est pas explicitement autorisé par leurs CGU. Pour un
usage commercial, contactez-les. Code fourni à des fins éducatives.
