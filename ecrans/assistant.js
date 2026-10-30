/* Assistant SoftAccounting IA : bouton rond en bas à droite (« Ouvrir l'assistant »), fenêtre de conversation de la charte Softwell.
   Réponses simulées par règles, à partir des données en mémoire de la maquette (exercices, clôtures, à nouveaux, banques) ;
   rien n'est envoyé hors du navigateur. Ne pas nommer de fonction « $$ » (build.cjs). */
(function () {
  var css = '.ai-pan{position:fixed;right:24px;bottom:92px;z-index:1101;width:380px;max-width:calc(100vw - 32px);height:min(600px,calc(100vh - 120px));display:flex;flex-direction:column;background:#fff;border:1px solid #E1E5EE;border-radius:14px;box-shadow:0 18px 44px rgba(11,19,50,.28);overflow:hidden;font-family:var(--font-sans);color:#353944}' +
    '.ai-pan[hidden]{display:none}' +
    '.ai-th{display:flex;align-items:center;gap:12px;padding:14px 16px;background:#0B1332;color:#fff}.ai-th .ai-lg{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:#2E427B;font-size:18px;flex:none}' +
    '.ai-th b{display:block;font:600 15px var(--font-heading);line-height:1.2}.ai-th small{display:block;font-size:12px;color:#C9D1EA}.ai-th .ai-t{flex:1;min-width:0}' +
    '.ai-th button{height:32px;border:1px solid rgba(255,255,255,.3);border-radius:8px;background:rgba(255,255,255,.1);color:#fff;font:600 12px var(--font-sans);padding:0 12px;cursor:pointer}.ai-th button:hover{background:rgba(255,255,255,.2)}.ai-th .ai-min{width:32px;padding:0;border-radius:50%;font-size:16px}' +
    '.ai-th button:focus-visible,.ai-sg button:focus-visible,.ai-lien:focus-visible,.ai-env:focus-visible,.ai-in:focus-visible{outline:3px solid #2E427B;outline-offset:2px}' +
    '.ai-ms{flex:1;overflow:auto;padding:16px;background:#F5F7F9;display:flex;flex-direction:column;gap:12px}' +
    '.ai-m{display:flex;gap:8px;align-items:flex-end;max-width:100%}.ai-m.u{justify-content:flex-end}' +
    '.ai-av{display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#0B1332;color:#fff;font-size:14px;flex:none}' +
    '.ai-b{max-width:82%;padding:12px 14px;border-radius:14px;background:#fff;border:1px solid #E9EBF0;font-size:13px;line-height:1.5;box-shadow:0 1px 2px rgba(11,19,50,.06)}.ai-b p{margin:0 0 6px}.ai-b p:last-of-type{margin-bottom:0}' +
    '.ai-m.u .ai-b{background:#2E427B;border-color:#2E427B;color:#fff}' +
    '.ai-b ul{margin:6px 0 0;padding-left:18px}.ai-b li{margin:2px 0}.ai-b small{display:block;margin-top:6px;font-size:11px;color:#8A90A0;text-align:right}.ai-m.u .ai-b small{color:#C9D1EA}' +
    '.ai-tb{width:100%;margin:8px 0 2px;border-collapse:collapse;font-size:12px}.ai-tb th{padding:5px 6px;background:#F5F7F9;border-bottom:1px solid #E9EBF0;text-align:right;font-weight:700;font-size:11px;color:#5B606D}.ai-tb th:first-child,.ai-tb td:first-child{text-align:left;white-space:normal}.ai-tb td{padding:5px 6px;white-space:nowrap;border-bottom:1px solid #F1F2F5;text-align:right;font-variant-numeric:tabular-nums}.ai-tb .b{font-weight:700;background:#FAFBFC}.ai-bon{color:#047857;font-weight:600}.ai-att{color:#9A6B00;font-weight:600}.ai-mau{color:#B63132;font-weight:600}.ai-b.l{max-width:94%}' +
    '.ai-pan.ai-full{top:0;left:0;right:0;bottom:0;width:100vw;max-width:none;height:100vh;border-radius:0;border:0}' +
    '.ai-full .ai-ms{padding:24px max(24px,calc((100% - 900px)/2))}.ai-full .ai-sg,.ai-full .ai-sf,.ai-full .ai-pd{padding-left:max(24px,calc((100% - 900px)/2));padding-right:max(24px,calc((100% - 900px)/2))}' +
    '.ai-full .ai-b{max-width:72%;font-size:14px}.ai-full .ai-b.l{max-width:94%}.ai-full .ai-tb{font-size:13px}.ai-full .ai-ch svg{max-width:600px}' +
    '.ai-ch{margin:10px 0 2px;padding:10px 10px 6px;border:1px solid #E9EBF0;border-radius:10px;background:#fff}.ai-ch figcaption{margin:0 0 4px;font:700 12px var(--font-sans);color:#0B1332}.ai-ch svg{display:block;width:100%;height:auto}.ai-ch text{font-family:var(--font-sans)}' +
    '.ai-lgd{display:flex;flex-wrap:wrap;gap:4px 12px;margin:2px 0 0;font-size:11px;color:#474C58}.ai-lgd span{display:inline-flex;align-items:center;gap:5px}.ai-lgd i{width:10px;height:10px;border-radius:2px;display:inline-block}' +
    '.ai-lien{display:inline-flex;align-items:center;gap:4px;margin:8px 8px 0 0;padding:6px 10px;border:1px solid #2E427B;border-radius:8px;background:#fff;color:#2E427B;font:600 12px var(--font-sans);text-decoration:none;cursor:pointer}.ai-lien:hover{background:#E3EBFE}' +
    '.ai-pt{display:flex;gap:4px;padding:4px 2px}.ai-pt i{width:7px;height:7px;border-radius:50%;background:#8A90A0;animation:aipt 1s infinite ease-in-out}.ai-pt i:nth-child(2){animation-delay:.15s}.ai-pt i:nth-child(3){animation-delay:.3s}@keyframes aipt{0%,80%,100%{opacity:.25}40%{opacity:1}}' +
    '.ai-sg{padding:12px 16px 4px;border-top:1px solid #E9EBF0;background:#fff}.ai-sg h3{margin:0 0 8px;font:700 11px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:#5B606D}.ai-sg div{display:flex;flex-wrap:wrap;gap:8px;max-height:92px;overflow:auto;padding:2px}' +
    '.ai-sg button{min-height:30px;padding:0 12px;border:1px solid #C5CAD6;border-radius:999px;background:#fff;color:#353944;font:500 12px var(--font-sans);cursor:pointer}.ai-sg button:hover{background:#E3EBFE;border-color:#2E427B;color:#2E427B}' +
    '.ai-sf{display:flex;gap:8px;padding:12px 16px 4px;background:#fff}.ai-in{flex:1;min-width:0;height:44px;box-sizing:border-box;border:1px solid #878D9A;border-radius:10px;padding:0 12px;font:13px var(--font-sans);color:#353944;background:#fff}' +
    '.ai-env{width:44px;height:44px;flex:none;border:0;border-radius:50%;background:#2E427B;color:#fff;font-size:18px;cursor:pointer}.ai-env:disabled{background:#C5CAD6;cursor:not-allowed}' +
    '.ai-pd{margin:0;padding:6px 16px 12px;background:#fff;text-align:center;font-size:11px;color:#8A90A0}' +
    '@media (max-width:640px){.ai-pan{right:16px;bottom:84px}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var SUGG = ['Comment clôturer un exercice ?', 'Inventaire de la base', 'Top 5 tiers', 'Qualité des données', 'Comptes par classe', 'Graphique du bilan', 'Graphique des résultats', 'Analyse financière', 'Analyse comptable', 'Ratios de rentabilité', 'Équilibre financier (FR, BFR)', 'Anomalies comptables', 'Exercices à clôturer', 'Clôtures périodiques', 'À nouveaux', 'États financiers', 'Balance générale', 'Rapprochement bancaire', 'Banques et comptes émetteurs', 'Où saisir une écriture ?'];
  var LIENS = {
    cloture: [['clotannuelle', 'Clôture annuelle'], ['exercices', 'Exercices comptables']],
    periodes: [['clotmens', 'Clôture mensuelle'], ['clotper', 'Clôture périodique']],
    anouveaux: [['anouveaux', 'À nouveau']],
    etats: [['bilparam', 'Bilan'], ['crparam', 'Compte de résultat'], ['erparam', 'Emplois et ressources'], ['tftparam', 'Flux de trésorerie']],
    balance: [['balance', 'Balance générale'], ['balaux', 'Balance auxiliaire'], ['glg', 'Grand livre']],
    rapprochement: [['rapprochement', 'Configuration'], ['pointage', 'Pointage'], ['situation', 'Situation']],
    banques: [['banques', 'Liste des banques']],
    ecritures: [['ecritures', "Saisie d'écritures"]],
    devise: [['devise', 'Devises']],
    plans: [['plans', 'Configuration des plans']],
    tiers: [['tiers', 'Tiers']]
  };

  window.AI_OUTILS = { esc: esc, tab: tab, barres: barres, anneau: anneau, Pc: Pc, lg: lg };
  var pan = document.createElement('section'); pan.className = 'ai-pan'; pan.hidden = true; pan.setAttribute('role', 'dialog'); pan.setAttribute('aria-label', 'Assistant SoftAccounting IA');
  pan.innerHTML = '<header class="ai-th"><span class="ai-lg"><i class="ti ti-sparkles" aria-hidden="true"></i></span><div class="ai-t"><b>SoftAccounting IA</b><small>Assistant comptable</small></div>' +
    '<button type="button" class="ai-min" data-ai-pe aria-label="Plein écran" title="Plein écran"><i class="ti ti-arrows-maximize" aria-hidden="true"></i></button><button type="button" data-ai-eff>Effacer</button><button type="button" class="ai-min" data-ai-min aria-label="Réduire l\'assistant"><i class="ti ti-minus" aria-hidden="true"></i></button></header>' +
    '<div class="ai-ms" data-ai-ms role="log" aria-live="polite"></div>' +
    '<div class="ai-sg"><h3>Suggestions</h3><div data-ai-sg></div></div>' +
    '<form class="ai-sf" data-ai-f><input class="ai-in" data-ai-in type="text" placeholder="Posez votre question..." aria-label="Votre question" autocomplete="off"><button class="ai-env" type="submit" data-ai-env aria-label="Envoyer" disabled><i class="ti ti-send" aria-hidden="true"></i></button></form>' +
    '<p class="ai-pd">Données internes uniquement — Aucune IA externe</p>';
  document.body.appendChild(pan);
  var ms = pan.querySelector('[data-ai-ms]'), inp = pan.querySelector('[data-ai-in]'), env = pan.querySelector('[data-ai-env]');
  pan.querySelector('[data-ai-sg]').innerHTML = SUGG.map(function (t) { return '<button type="button" data-ai-s>' + t + '</button>'; }).join('');

  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function heure() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function liens(k) { return (LIENS[k] || []).map(function (l) { return '<a class="ai-lien" href="#' + l[0] + '">' + l[1] + ' <i class="ti ti-arrow-right" aria-hidden="true"></i></a>'; }).join(''); }
  function bulle(html, user) {
    var m = document.createElement('div'); m.className = 'ai-m' + (user ? ' u' : '');
    m.innerHTML = (user ? '' : '<span class="ai-av"><i class="ti ti-robot" aria-hidden="true"></i></span>') + '<div class="ai-b' + (html.indexOf('ai-tb') > -1 || html.indexOf('ai-ch') > -1 ? ' l' : '') + '">' + html + '<small>' + heure() + '</small></div>';
    ms.appendChild(m); ms.scrollTop = ms.scrollHeight; return m;
  }
  function accueil() { bulle('<p>Bonjour ! Je suis votre assistant SoftAccounting.</p><p>Je vous guide sur toutes les fonctionnalités du logiciel, même les plus reculées, et j\'analyse la base de données.</p><p>Essayez : « où paramétrer les devises ? », « ouvre la balance auxiliaire », « combien de tiers ? ».</p><p>Utilisez les suggestions pour voir des exemples.</p>'); }

  function exercices() { try { return (window.EXERCICES_API && window.EXERCICES_API.liste()) || []; } catch (e) { return []; } }

  /* Données financières simulées (en MGA) : de quoi illustrer les analyses ; cohérentes avec le résultat net du tableau de flux */
  var FIN = {
    N: { immo: 1240e6, stocks: 210e6, clients: 520e6, autresCreances: 95e6, treso: 380e6, cp: 1310.4e6, df: 620e6, fourn: 330e6, fisc: 140e6, autresDettes: 44.6e6, ca: 3150e6, chExpl: 2905e6, dotations: 12.6e6, resFin: -62e6, impots: 97.6e6 },
    N1: { immo: 1180e6, stocks: 185e6, clients: 470e6, autresCreances: 90e6, treso: 310e6, cp: 1225e6, df: 600e6, fourn: 295e6, fisc: 105e6, autresDettes: 10e6, ca: 2780e6, chExpl: 2575e6, dotations: 11.1e6, resFin: -60e6, impots: 80.8e6 }
  };
  function calc(d) {
    var r = {}; r.resExpl = d.ca - d.chExpl; r.resNet = r.resExpl + d.resFin - d.impots; r.ebe = r.resExpl + d.dotations;
    r.circ = d.stocks + d.clients + d.autresCreances; r.dettesCT = d.fourn + d.fisc + d.autresDettes; r.totalActif = d.immo + r.circ + d.treso;
    r.fr = d.cp + d.df - d.immo; r.bfr = r.circ - r.dettesCT; r.tn = r.fr - r.bfr;
    r.autonomie = d.cp / r.totalActif; r.endettement = d.df / d.cp; r.liquidite = (r.circ + d.treso) / r.dettesCT;
    r.margeNette = r.resNet / d.ca; r.margeExpl = r.resExpl / d.ca; r.margeEbe = r.ebe / d.ca; r.roe = r.resNet / d.cp; r.roa = r.resNet / r.totalActif;
    r.dsoj = d.clients / d.ca * 365; r.dpoj = d.fourn / d.chExpl * 365; return r;
  }
  var RN = calc(FIN.N), RP = calc(FIN.N1);
  function Mn(v) { return (v / 1e6).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' M'; }
  function Pc(v) { return (v * 100).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'; }
  function Nb(v, u) { return v.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + (u || ''); }
  function lg(cl, txt) { return '<span class="ai-' + cl + '">' + txt + '</span>'; }
  function tab(entetes, lignes) {
    return '<table class="ai-tb"><thead><tr>' + entetes.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + lignes.map(function (l) { return '<tr' + (l.b ? ' class="b"' : '') + '>' + l.c.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }
  function pasVar(a, b, pct) { var v = pct ? (a - b) * 100 : (a / b - 1) * 100; return (v >= 0 ? '+' : '') + v.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + (pct ? ' pt' : ' %'); }
  var SIM = '<small style="text-align:left">Données simulées de la maquette (MGA).</small>';


  /* Graphiques SVG intégrés aux réponses (barres groupées, anneau) — couleurs de la charte */
  var PAL = ['#2E427B', '#C26A0E', '#0E8A6B', '#8A90A0', '#B63132'];
  function legende(noms, cols) { return '<div class="ai-lgd">' + noms.map(function (n, i) { return '<span><i style="background:' + cols[i % cols.length] + '"></i>' + esc(n) + '</span>'; }).join('') + '</div>'; }
  function barres(titre, cats, series, fmt) {
    var W = 340, H = 210, L = 46, T = 14, B = 40, R = 8, pw = W - L - R, ph = H - T - B, max = 0;
    series.forEach(function (se) { se.v.forEach(function (v) { if (v > max) max = v; }); });
    var pas = Math.pow(10, Math.floor(Math.log(max || 1) / Math.LN10)), top = Math.ceil(max / pas) * pas; if (top / pas < 3) { pas = pas / 2; top = Math.ceil(max / pas) * pas; }
    var g = '', i, k;
    for (i = 0; i <= 4; i++) { var val = top * i / 4, y = T + ph - ph * i / 4; g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '" stroke="#E9EBF0"/><text x="' + (L - 5) + '" y="' + (y + 3) + '" font-size="9" text-anchor="end" fill="#5B606D">' + fmt(val) + '</text>'; }
    var gw = pw / cats.length, bw = Math.min(26, (gw - 10) / series.length);
    cats.forEach(function (c, ci) {
      var x0 = L + gw * ci + (gw - bw * series.length) / 2;
      series.forEach(function (se, si) {
        var v = se.v[ci], h = ph * v / top, x = x0 + bw * si, y = T + ph - h;
        g += '<rect x="' + x + '" y="' + y + '" width="' + (bw - 2) + '" height="' + Math.max(h, 0) + '" rx="2" fill="' + PAL[si % PAL.length] + '"><title>' + esc(se.nom + ' — ' + c + ' : ' + fmt(v)) + '</title></rect>';
        if (cats.length * series.length <= 8) g += '<text x="' + (x + (bw - 2) / 2) + '" y="' + (y - 3) + '" font-size="8.5" text-anchor="middle" fill="#353944">' + fmt(v) + '</text>';
      });
      var mots = String(c).split(' '), ligne1 = mots.slice(0, Math.ceil(mots.length / 2)).join(' '), ligne2 = mots.slice(Math.ceil(mots.length / 2)).join(' ');
      g += '<text x="' + (L + gw * ci + gw / 2) + '" y="' + (H - B + 13) + '" font-size="9" text-anchor="middle" fill="#353944">' + esc(ligne1) + '</text>' + (ligne2 ? '<text x="' + (L + gw * ci + gw / 2) + '" y="' + (H - B + 24) + '" font-size="9" text-anchor="middle" fill="#353944">' + esc(ligne2) + '</text>' : '');
    });
    return '<figure class="ai-ch"><figcaption>' + esc(titre) + '</figcaption><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(titre) + '">' + g + '</svg>' + (series.length > 1 ? legende(series.map(function (x) { return x.nom; }), PAL) : '') + '</figure>';
  }
  function anneau(titre, parts, fmt) {
    var tot = 0, r = 52, C = 2 * Math.PI * r, off = 0, g = '', lg2 = '';
    parts.forEach(function (p) { tot += p[1]; });
    parts.forEach(function (p, i) {
      var len = C * p[1] / tot;
      g += '<circle cx="80" cy="80" r="' + r + '" fill="none" stroke="' + PAL[i % PAL.length] + '" stroke-width="26" stroke-dasharray="' + len + ' ' + (C - len) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 80 80)"><title>' + esc(p[0] + ' : ' + fmt(p[1]) + ' (' + Pc(p[1] / tot) + ')') + '</title></circle>';
      off += len;
      lg2 += '<g transform="translate(168 ' + (26 + i * 26) + ')"><rect width="10" height="10" rx="2" fill="' + PAL[i % PAL.length] + '"/><text x="16" y="9" font-size="10" fill="#353944">' + esc(p[0]) + '</text><text x="16" y="21" font-size="9" fill="#5B606D">' + fmt(p[1]) + ' · ' + Pc(p[1] / tot) + '</text></g>';
    });
    g += '<text x="80" y="78" font-size="9" text-anchor="middle" fill="#5B606D">Total</text><text x="80" y="92" font-size="11" font-weight="700" text-anchor="middle" fill="#0B1332">' + fmt(tot) + '</text>';
    return '<figure class="ai-ch"><figcaption>' + esc(titre) + '</figcaption><svg viewBox="0 0 340 ' + Math.max(160, 40 + parts.length * 26) + '" role="img" aria-label="' + esc(titre) + '">' + g + lg2 + '</svg></figure>';
  }
  function m0(v) { return Math.round(v).toLocaleString('fr-FR'); }
  function pc0(v) { return v.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + '%'; }
  function grEquilibre() { var a = RN, b = RP; return barres('Équilibre financier (millions MGA)', ['FR', 'BFR', 'Trésorerie nette', 'Résultat net'], [{ nom: 'N', v: [a.fr / 1e6, a.bfr / 1e6, a.tn / 1e6, a.resNet / 1e6] }, { nom: 'N-1', v: [b.fr / 1e6, b.bfr / 1e6, b.tn / 1e6, b.resNet / 1e6] }], m0); }
  function grRentab() { var a = RN, b = RP; return barres('Marges et rentabilité (%)', ['Marge nette', 'Marge expl.', 'ROE', 'ROA'], [{ nom: 'N', v: [a.margeNette * 100, a.margeExpl * 100, a.roe * 100, a.roa * 100] }, { nom: 'N-1', v: [b.margeNette * 100, b.margeExpl * 100, b.roe * 100, b.roa * 100] }], pc0); }
  function grResultat() { var a = FIN.N, b = FIN.N1; return barres('Activité et résultats (millions MGA)', ['Chiffre d\'affaires', 'Charges d\'expl.', 'Résultat d\'expl.', 'Résultat net'], [{ nom: 'N', v: [a.ca / 1e6, a.chExpl / 1e6, RN.resExpl / 1e6, RN.resNet / 1e6] }, { nom: 'N-1', v: [b.ca / 1e6, b.chExpl / 1e6, RP.resExpl / 1e6, RP.resNet / 1e6] }], m0); }
  function grPassif() { var a = FIN.N; return anneau('Structure du passif — N (millions MGA)', [['Capitaux propres', a.cp / 1e6], ['Dettes financières', a.df / 1e6], ['Fournisseurs', a.fourn / 1e6], ['Dettes fiscales et sociales', a.fisc / 1e6], ['Autres dettes', a.autresDettes / 1e6]], m0); }
  function grActif() { var a = FIN.N; return anneau('Structure de l\'actif — N (millions MGA)', [['Immobilisations', a.immo / 1e6], ['Stocks', a.stocks / 1e6], ['Créances', (a.clients + a.autresCreances) / 1e6], ['Trésorerie', a.treso / 1e6]], m0); }
  function grBalance() { var c = ['Cl. 1', 'Cl. 2', 'Cl. 3', 'Cl. 4', 'Cl. 5', 'Cl. 6', 'Cl. 7']; return barres('Balance par classe (millions MGA)', c, [{ nom: 'Solde débiteur', v: [0, 1240, 210, 615, 380, 3064.6, 0] }, { nom: 'Solde créditeur', v: [1845, 0, 0, 514.6, 0, 0, 3150] }], m0); }
  function graphiques(t) {
    if (/(structure|actif|passif|bilan|composition|repartition)/.test(t)) return '<p>Voici la structure du bilan :</p>' + grActif() + grPassif() + SIM + liens('etats');
    if (/(rentab|marge|roe|roa)/.test(t)) return '<p>Voici les marges et la rentabilité :</p>' + grRentab() + SIM + liens('etats');
    if (/(equilibre|roulement|bfr|tresorerie)/.test(t)) return '<p>Voici l\'équilibre financier :</p>' + grEquilibre() + SIM + liens('etats');
    if (/(balance|classe|comptab|solde)/.test(t)) return '<p>Voici la balance par classe :</p>' + grBalance() + SIM + liens('balance');
    if (/(resultat|chiffre|charge|produit|activite|evolution|ca\b)/.test(t)) return '<p>Voici l\'activité et les résultats :</p>' + grResultat() + SIM + liens('etats');
    return '<p>Voici une vue graphique de l\'analyse financière :</p>' + grResultat() + grEquilibre() + grPassif() + SIM + liens('etats');
  }

  function analyseFinanciere(mode) {
    var n = RN, p = RP;
    var ratios = [
      { c: ['Marge nette', Pc(n.margeNette), Pc(p.margeNette)] }, { c: ['Marge d\'exploitation', Pc(n.margeExpl), Pc(p.margeExpl)] },
      { c: ['Rentabilité financière (ROE)', Pc(n.roe), Pc(p.roe)] }, { c: ['Rentabilité économique (ROA)', Pc(n.roa), Pc(p.roa)] }
    ];
    if (mode === 'rentab') {
      return '<p><b>Rentabilité</b> — exercice N vs N-1 :</p>' + tab(['Ratio', 'N', 'N-1'], ratios.concat([{ c: ['EBE', Mn(n.ebe), Mn(p.ebe)] }, { c: ['Résultat net', Mn(n.resNet), Mn(p.resNet)] }])) +
        '<p>Le chiffre d\'affaires progresse de ' + pasVar(FIN.N.ca, FIN.N1.ca) + ' et le résultat net de ' + pasVar(n.resNet, p.resNet) + ' : ' + lg('bon', 'la rentabilité s\'améliore') + ', portée par la marge d\'exploitation (' + pasVar(n.margeExpl, p.margeExpl, 1) + ').</p>' + grRentab() + SIM + liens('etats');
    }
    if (mode === 'equilibre') {
      return '<p><b>Équilibre financier</b> — N vs N-1 :</p>' + tab(['Indicateur', 'N', 'N-1'], [{ c: ['Fonds de roulement (FR)', Mn(n.fr), Mn(p.fr)] }, { c: ['Besoin en fonds de roulement (BFR)', Mn(n.bfr), Mn(p.bfr)] }, { b: 1, c: ['Trésorerie nette (FR − BFR)', Mn(n.tn), Mn(p.tn)] }]) +
        '<p>Le FR finance entièrement le BFR et dégage ' + Mn(n.tn) + ' de trésorerie : ' + lg('bon', 'équilibre sain') + '. Le BFR représente ' + Nb(n.bfr / FIN.N.ca * 365, ' jours') + ' de chiffre d\'affaires.</p>' + grEquilibre() + SIM + liens('etats');
    }
    var tendanceLiq = n.liquidite < p.liquidite ? 'en léger recul mais très confortable' : 'en hausse';
    return '<p><b>Analyse financière</b> — exercice N vs N-1 :</p>' + tab(['Indicateur', 'N', 'N-1'], [
      { c: ['Chiffre d\'affaires', Mn(FIN.N.ca), Mn(FIN.N1.ca)] }, { c: ['Résultat net', Mn(n.resNet), Mn(p.resNet)] }, { c: ['Fonds de roulement', Mn(n.fr), Mn(p.fr)] }, { c: ['BFR', Mn(n.bfr), Mn(p.bfr)] }, { b: 1, c: ['Trésorerie nette', Mn(n.tn), Mn(p.tn)] },
      { c: ['Autonomie financière', Pc(n.autonomie), Pc(p.autonomie)] }, { c: ['Endettement (dettes fin. / CP)', Pc(n.endettement), Pc(p.endettement)] }, { c: ['Liquidité générale', Nb(n.liquidite), Nb(p.liquidite)] }, { c: ['Marge nette', Pc(n.margeNette), Pc(p.margeNette)] }, { c: ['Délai clients', Nb(n.dsoj, ' j'), Nb(p.dsoj, ' j')] }]) +
      '<ul><li>' + lg('bon', 'Structure solide') + ' : autonomie financière de ' + Pc(n.autonomie) + ' (seuil usuel : 50 %).</li><li>' + lg('bon', 'Liquidité') + ' ' + tendanceLiq + ' (' + Nb(n.liquidite) + ').</li><li>' + lg('bon', 'Rentabilité') + ' en progrès : résultat net ' + pasVar(n.resNet, p.resNet) + '.</li><li>' + lg('att', 'À surveiller') + ' : le délai clients reste proche de ' + Math.round(n.dsoj) + ' jours ; les dettes fiscales et sociales augmentent de ' + pasVar(FIN.N.fisc, FIN.N1.fisc) + '.</li></ul>' + grEquilibre() + grPassif() + SIM + liens('etats');
  }

  function analyseComptable(mode) {
    var cls = [['1 — Capitaux', 0, 1845e6], ['2 — Immobilisations', 1240e6, 0], ['3 — Stocks', 210e6, 0], ['4 — Tiers', 615e6, 514.6e6], ['5 — Trésorerie', 380e6, 0], ['6 — Charges', 3064.6e6, 0], ['7 — Produits', 0, 3150e6]];
    var td = 0, tc = 0; cls.forEach(function (c) { td += c[1]; tc += c[2]; });
    var ex = []; try { ex = (window.EXERCICES_API && window.EXERCICES_API.liste()) || []; } catch (e) {}
    var nonClot = ex.filter(function (r) { return !r.cloture; }).length;
    var pc = window.PERIODES_CLOTUREES || {}, nm = 0; Object.keys(pc).forEach(function (a) { nm += Object.keys(pc[a] || {}).length; });
    var controles = [
      ['Balance équilibrée (débit = crédit)', Math.abs(td - tc) < 1 ? lg('bon', 'OK') : lg('mau', 'Écart ' + Mn(td - tc))],
      ['Compte d\'attente 471 non soldé', lg('att', '12,4 M à apurer')],
      ['Écritures clients non lettrées', lg('att', '18 écritures')],
      ['Tiers à solde anormal (client créditeur, fournisseur débiteur)', lg('att', '3 tiers')],
      ['Exercices non clôturés', nonClot ? lg('att', nonClot + ' exercice(s)') : lg('bon', 'Aucun')],
      ['Mois clôturés', nm ? lg('bon', nm + ' mois') : lg('att', 'Aucun mois clôturé')]
    ];
    if (mode === 'anomalies') {
      return '<p><b>Contrôles de cohérence comptable</b> :</p>' + tab(['Contrôle', 'Résultat'], controles.map(function (c) { return { c: c }; })) +
        '<p>Priorité : apurer le compte 471, lettrer les écritures clients puis régulariser les tiers à solde anormal avant la clôture.</p>' + SIM + liens('balance');
    }
    return '<p><b>Analyse comptable</b> — balance par classe :</p>' + tab(['Classe', 'Solde débiteur', 'Solde créditeur'], cls.map(function (c) { return { c: [c[0], c[1] ? Mn(c[1]) : '—', c[2] ? Mn(c[2]) : '—'] }; }).concat([{ b: 1, c: ['Total', Mn(td), Mn(tc)] }])) +
      '<p>Balance ' + (Math.abs(td - tc) < 1 ? lg('bon', 'équilibrée') : lg('mau', 'déséquilibrée')) + '. Résultat avant clôture : produits ' + Mn(3150e6) + ' − charges ' + Mn(3064.6e6) + ' = <b>' + Mn(3150e6 - 3064.6e6) + '</b>.</p>' +
      '<p>Comptes les plus mouvementés : 411100 Clients, 701000 Ventes, 512100 Banque, 401100 Fournisseurs, 607000 Achats.</p>' + grBalance() + SIM + liens('balance');
  }

  function reponse(q) {
    var t = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    var ex, n;
    var pl = window.AI_PLUGINS || [];
    for (var pi = 0; pi < pl.length; pi++) { var ph = pl[pi](q, t); if (ph) return ph; }
    if (/(graphi|graphe|courbe|histogramme|camembert|diagramme|illustr|visualis|schema)/.test(t)) return graphiques(t);
    if (/(anomalie|incoherence|controle|coherence)/.test(t)) return analyseComptable('anomalies');
    if (/(rentab|marge|\broe\b|\broa\b|\bebe\b)/.test(t)) return analyseFinanciere('rentab');
    if (/(equilibre|fonds de roulement|\bfr\b|bfr|tresorerie nette)/.test(t)) return analyseFinanciere('equilibre');
    if (/(financ|ratio|solvab|liquidit|autonomie|diagnostic)/.test(t) && /analys|ratio|solvab|liquidit|autonomie|diagnostic/.test(t) && !/etats? financier/.test(t)) return analyseFinanciere();
    if (/(analyse|balance par classe|soldes?)/.test(t) && !/etat/.test(t)) return analyseComptable();
    if (/(a nouveau|report)/.test(t)) {
      try { n = Object.keys(window.A_NOUVEAUX || {}).length; } catch (e) { n = 0; }
      return '<p>' + (n ? n + ' jeu(x) d\'à nouveaux (site / exercice) sont en mémoire, provisoires ou définitifs.' : 'Aucun à nouveau n\'est encore généré.') + '</p><p>La génération provisoire se fait depuis l\'écran À nouveau ; la clôture annuelle les remplace par les à nouveaux définitifs.</p>' + liens('anouveaux');
    }
    if (/(periodique|mensuel|periode)/.test(t) && /(clot|period|mensuel)/.test(t)) {
      var pc = window.PERIODES_CLOTUREES || {}, nm = 0; Object.keys(pc).forEach(function (a) { nm += Object.keys(pc[a] || {}).length; });
      var cp = (window.CLOTURES_PERIODIQUES || []).length;
      return '<ul><li>Clôtures mensuelles : <b>' + nm + '</b> mois clôturé(s)</li><li>Clôtures périodiques : <b>' + cp + '</b> période(s) clôturée(s)</li></ul><p>Chaque clôture se réactive depuis son écran, si l\'option est activée dans Clôture comptable.</p>' + liens('periodes');
    }
    if (/(clot|exercice)/.test(t)) {
      ex = exercices();
      if (!ex.length) return '<p>Les exercices ne sont pas encore chargés. Ouvrez Exercices comptables.</p>' + liens('cloture');
      var ouverts = ex.filter(function (r) { return !r.cloture; }), cours = ex.filter(function (r) { return r.cours; })[0];
      return '<p>' + ex.length + ' exercice(s) : <b>' + (ex.length - ouverts.length) + '</b> clôturé(s), <b>' + ouverts.length + '</b> à clôturer.</p>' +
        (cours ? '<p>Exercice en cours : <b>' + esc(cours.annee) + '</b> (' + esc(cours.debut) + ' – ' + esc(cours.fin) + ').</p>' : '') +
        (ouverts.length ? '<ul>' + ouverts.slice(0, 5).map(function (r) { return '<li>' + esc(r.annee) + ' — non clôturé</li>'; }).join('') + '</ul><p>Un exercice ne peut être clôturé que si les précédents le sont.</p>' : '') + liens('cloture');
    }
    if (/(etat|bilan|resultat|flux|emploi|ressource|tresorerie)/.test(t)) return '<p>Les états financiers se paramètrent puis s\'éditent dans le même module : un bouton en haut à droite bascule de l\'un à l\'autre.</p>' + liens('etats');
    if (/(balance|grand livre|journaux?)/.test(t)) return '<p>Les états comptables sont disponibles avec critères d\'édition (exercice, période, sites, devise) :</p>' + liens('balance');
    if (/(rapproch|pointage|releve)/.test(t)) return '<p>Le rapprochement bancaire se fait en trois temps : configuration, pointage du relevé, puis situation.</p>' + liens('rapprochement');
    if (/(banque|emetteur|iban|e-payment|epayment|paiement)/.test(t)) {
      var nb = 0; try { nb = (window.BANQUES && (window.BANQUES.length || Object.keys(window.BANQUES).length)) || 0; } catch (e) {}
      return '<p>' + (nb ? nb + ' banque(s) paramétrée(s). ' : '') + 'La récupération Soft e-Payment synchronise les comptes émetteurs depuis la liste des banques.</p>' + liens('banques');
    }
    if (/(ecriture|saisir|saisie|piece|comptabiliser)/.test(t)) return '<p>La saisie d\'écritures se fait par journal, avec contrôle d\'équilibre débit / crédit et filtres par code et libellé sur chaque liste.</p>' + liens('ecritures');
    if (/(devise|monnaie|change|taux)/.test(t)) return '<p>Les monnaies de l\'entité (monnaie locale et jusqu\'à 3 devises) se paramètrent dans Informations générales ; elles déterminent les colonnes de montants.</p>' + liens('devise');
    if (/(plan|compte general|racine)/.test(t)) return '<p>Les plans (comptable, activité, budget, géographique, financier…) se configurent puis se saisissent :</p>' + liens('plans');
    if (/(tiers|fournisseur|client)/.test(t)) return '<p>Les tiers (clients, fournisseurs) se gèrent dans la saisie des tiers.</p>' + liens('tiers');
    if (/(bonjour|salut|hello|merci)/.test(t)) return '<p>Avec plaisir ! Que souhaitez-vous savoir ?</p>';
    var fb = window.AI_FALLBACK && window.AI_FALLBACK(q, t); if (fb) return fb;
    return '<p>Je n\'ai pas bien compris. Je peux vous guider sur toutes les fonctionnalités du logiciel (« comment clôturer un exercice ? », « où paramétrer les devises ? »), analyser la base de données (« inventaire », « qualité des données », « top 5 tiers ») ou produire des analyses et graphiques financiers.</p><p>Essayez une suggestion ci-dessous.</p>';
  }

  var occupe = false;
  function poser(q) {
    q = q.trim(); if (!q || occupe) return;
    bulle(esc(q), true); occupe = true;
    var tp = bulle('<span class="ai-pt"><i></i><i></i><i></i></span>');
    setTimeout(function () { tp.remove(); bulle(reponse(q)); occupe = false; }, 550);
  }
  function plein(o) {
    pan.classList.toggle('ai-full', o);
    var b = pan.querySelector('[data-ai-pe]'); b.setAttribute('aria-label', o ? 'Quitter le plein écran' : 'Plein écran'); b.title = o ? 'Quitter le plein écran' : 'Plein écran';
    b.innerHTML = '<i class="ti ti-arrows-' + (o ? 'minimize' : 'maximize') + '" aria-hidden="true"></i>';
    ms.scrollTop = ms.scrollHeight;
  }
  function ouvrir(o) {
    if (!o) plein(false);
    pan.hidden = !o;
    document.querySelectorAll('button[aria-label="Ouvrir l\'assistant"]').forEach(function (b) { b.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    if (o) setTimeout(function () { inp.focus(); }, 30);
  }
  accueil();
  pan.querySelector('[data-ai-f]').addEventListener('submit', function (e) { e.preventDefault(); var v = inp.value; inp.value = ''; env.disabled = true; poser(v); });
  inp.addEventListener('input', function () { env.disabled = !inp.value.trim(); });
  pan.querySelector('[data-ai-pe]').addEventListener('click', function () { plein(!pan.classList.contains('ai-full')); inp.focus(); });
  pan.querySelector('[data-ai-min]').addEventListener('click', function () { ouvrir(false); });
  pan.querySelector('[data-ai-eff]').addEventListener('click', function () { ms.innerHTML = ''; accueil(); });
  pan.addEventListener('click', function (e) { var s = e.target.closest('[data-ai-s]'); if (s) poser(s.textContent); });
  document.addEventListener('click', function (e) { var b = e.target.closest('button[aria-label="Ouvrir l\'assistant"]'); if (b) { e.preventDefault(); ouvrir(pan.hidden); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pan.hidden) { if (pan.classList.contains('ai-full')) plein(false); else ouvrir(false); } });
})();
