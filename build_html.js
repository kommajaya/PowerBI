// build_html.js — parse Retail Sales CSVs and embed them into dashboard_template.html
// Usage: node build_html.js
// Output: D:\PBI\SalesDashboard\SalesDashboard.html  (single self-contained file)

'use strict';
const fs = require('fs');
const path = require('path');

const SRC = path.join(process.env.USERPROFILE, 'Downloads', 'SalesData');
const OUT = path.join(__dirname, 'SalesDashboard.html');

/* ---------- RFC 4180 CSV parser ---------- */
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (inQ) {
      if (c === '"') {
        if (n === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else if (c === '"') {
      inQ = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && n === '\n') i++;
      row.push(field); field = ''; inQ = false;
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function readTable(file) {
  const text = fs.readFileSync(path.join(SRC, file), 'utf8').replace(/^\uFEFF/, '');
  const rows = parseCSV(text);
  const header = rows[0];
  const data = [];
  for (let i = 1; i < rows.length; i++) {
    const rec = {};
    for (let h = 0; h < header.length; h++) rec[header[h].trim()] = (rows[i][h] || '').trim();
    data.push(rec);
  }
  return data;
}

function num(v) { const n = parseFloat(v); return isFinite(n) ? n : 0; }
function intStr(v) { return parseInt(v, 10).toString(); }

/* ---------- load sources ---------- */
const facts = readTable('FactSales.csv');
const products = readTable('DimProducts.csv');
const stores = readTable('DimStores.csv');

// Name lookup maps (index-keyed dims in order of first appearance)
const DIMS = { channel:[], category:[], subcategory:[], brand:[], color:[],
               country:[], state:[], storeSize:[], product:[], store:[] };
const dimIndex = {};
function dim(cat, value) {
  const key = cat + '|' + value;
  if (!(key in dimIndex)) { dimIndex[key] = DIMS[cat].length; DIMS[cat].push(value); }
  return dimIndex[key];
}

const prodByKey = {}, storeByKey = {};
for (const p of products) prodByKey[intStr(p.ProductKey)] = p;
for (const s of stores) storeByKey[intStr(s.StoreKey)] = s;

const rows = [];
for (const f of facts) {
  const sk = intStr(f.StoreKey);
  const pk = intStr(f.ProductKey);
  const p = prodByKey[pk] || {};
  const s = storeByKey[sk] || {};
  const d = new Date(f['Order Date']);
  const year = isFinite(d.getTime()) ? d.getFullYear() : 2016;
  const quarter = isFinite(d.getTime()) ? Math.floor(d.getMonth() / 3) + 1 : 1;
  rows.push([
    f['Order Number'] || '',
    f.CustomerKey || '',
    year,
    quarter,
    dim('channel', s.Channel || 'Unknown'),          // channel
    (p.Category !== undefined) ? dim('category', p.Category) : dim('category', 'Unknown'),      // category
    (p.Subcategory !== undefined) ? dim('subcategory', p.Subcategory) : dim('subcategory', 'Unknown'), // subcategory
    (p.Brand !== undefined) ? dim('brand', p.Brand) : dim('brand', 'Unknown'),            // brand
    (p.Color !== undefined) ? dim('color', p.Color) : dim('color', 'Unknown'),            // color
    (s.Country !== undefined) ? dim('country', s.Country) : dim('country', 'Unknown'),        // country
    (s.State !== undefined) ? dim('state', s.State) : dim('state', 'Unknown'),            // state
    (s['Store Size Band'] !== undefined) ? dim('storeSize', s['Store Size Band']) : dim('storeSize', 'Unknown'), // storeSize
    (p['Product Name'] !== undefined) ? dim('product', p['Product Name']) : dim('product', 'Unknown'),      // product
    (s['Store Name'] !== undefined) ? dim('store', s['Store Name']) : dim('store', 'Unknown'),          // store
    num(f.Quantity),
    num(f['Line Sales']),
    num(f['Line Cost']),
  ]);
}

/* ---------- inject into template ---------- */
const payload = JSON.stringify({ dims: DIMS, rows: rows }).replace(/</g, '\\u003c');
let tpl = fs.readFileSync(path.join(__dirname, 'dashboard_template.html'), 'utf8');
if (!tpl.includes('__DATA__')) throw new Error('Template missing __DATA__ marker');
tpl = tpl.replace('__DATA__', payload);
fs.writeFileSync(OUT, tpl, 'utf8');

console.log('Wrote', OUT);
console.log('  facts:', rows.length, '| dims:',
  Object.keys(DIMS).map(k => k + '=' + DIMS[k].length).join(', '));
console.log('  size:', (fs.statSync(OUT).size / 1024).toFixed(1) + ' KB');