const fs = require('fs');
const j = JSON.parse(fs.readFileSync('ecrans/journal_donnees.json', 'utf8').replace(/^﻿/, ''));
const g = JSON.parse(fs.readFileSync('ecrans/glg_donnees.js', 'utf8').match(/window\.GLG_COMPTES=(\[[\s\S]*\]);?\s*$/m)[1]);
const T = [];
j.forEach((r) => T.push(r.l));
g.forEach((c) => { T.push(c.l); c.L.forEach((l) => T.push(l.split('\t')[8] || '')); });
['MIONJO', 'HARSON', 'CHAD', 'KUROILIER', 'WARNNERS', 'OSY', 'SOA', 'JUX', 'NANISANA', 'FETRA', 'FIVOARANA', 'NALY', 'SOLINSKI', 'TAFIKA', 'FANANTENANA', 'TANDRANO', 'MIARINA', 'JOMA', 'MOSI', 'FANOMEZANA', 'TSIKY', 'ROJO', 'MARIA', 'LOVA', 'HERY', 'SAIDA', 'POLO', 'JENNY', 'CHRISTIAN', 'FALY', 'WILLIAM', 'GINOT', 'MAHEFA', 'KANTO', 'DALIA', 'TOMBO', 'RIVO', 'ONJA', 'HAINGO', 'NIRINA'].forEach((w) => {
  const re = new RegExp('\\b' + w + '\\b', 'i');
  const t = T.find((x) => re.test(x));
  if (t) console.log(w, '=>', t.replace(/\s+/g, ' ').slice(0, 120));
});
