const h = require('fs').readFileSync('SoftCompta_Administration_entite_publication.html', 'utf8');
const re = /(?<![A-Za-zÀ-ÿ])(RAKOTO|RANDRIA|RAZAFI|RASOLO|RAMIAN|RAMAH|RAJAO|RATOVO|RABEM|RANAIVO|ANDRIA|VINCENT|SISSOKO|Ihasimbelo|Faly|Jacquis|Valery)[A-Za-zÀ-ÿ]*/g;
const out = {};
for (const m of h.matchAll(re)) { const k = m[0]; if (!out[k]) out[k] = h.slice(Math.max(0, m.index - 50), m.index + 50).replace(/\s+/g, ' '); }
for (const [k, v] of Object.entries(out)) console.log(k, '=>', v);
let bad = 0, n = 0;
for (const m of h.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)) { n++; try { new Function(m[1]); } catch (e) { bad++; } }
console.log('scripts', n, 'erreurs', bad);
