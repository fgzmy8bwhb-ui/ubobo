const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

const DATA_DIR = path.resolve(__dirname, '../output/data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const FIELDS = [
  'productId', 'name', 'brand', 'price', 'currency',
  'weightVolume', 'packSize', 'ean', 'category',
  'description', 'imageUrl', 'url',
];

function exportJson(products, slug) {
  const file = path.join(DATA_DIR, `${slug}.json`);
  fs.writeFileSync(file, JSON.stringify(products, null, 2));
  return file;
}

function exportCsv(products, slug) {
  const file = path.join(DATA_DIR, `${slug}.csv`);
  const parser = new Parser({ fields: FIELDS, delimiter: ';' });
  fs.writeFileSync(file, parser.parse(products));
  return file;
}

module.exports = { exportJson, exportCsv };
