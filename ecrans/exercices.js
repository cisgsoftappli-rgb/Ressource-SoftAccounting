// Écran « Exercices comptables » (capture) : sélection, exercice en cours, suppression et filtres.
// Le formulaire ouvert par « Ajouter » / « Modifier » n'a pas été capturé : ces boutons
// l'indiquent dans la ligne d'information au lieu d'ouvrir une saisie inventée.
(function () {
  var root = document.querySelector('[data-screen="exercices"] app-multi-exercices');
  if (!root) return;
  var $ = function (s) { return root.querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || root).querySelectorAll(s)); };

  var toolbar = $$('.content > div:first-child > button');
  var BTN = {};
  toolbar.forEach(function (b) { BTN[b.textContent.trim()] = b; });
  var info = $('.ti-info-circle').parentNode.querySelector('span:last-of-type');
  var infoDefaut = info.textContent;
  var tbody = $('tbody');
  var filtres = $$('thead tr:nth-child(2) input, thead tr:nth-child(2) select');
  var recherche = $('.search-input');
  var selected = null;

  var CHECK_ON = 'background-color: rgb(230, 241, 251); border-color: rgb(62, 151, 255);';
  var CHECK_OFF = 'background-color: transparent; border-color: rgb(211, 209, 199);';

  function rows() { return $$('tr', tbody); }
  function cell(tr, i) { return tr.cells[i]; }
  function enCours(tr) { return !!cell(tr, 5).querySelector('.ti-check'); }
  function toIso(fr) { var p = fr.trim().split('/'); return p[2] + '-' + p[1] + '-' + p[0]; }
  function statut(tr) {
    var t = cell(tr, 4).textContent.trim();
    return t === 'Ouvert' ? 'OUVERT' : t === 'Préparatoire' ? 'PREPARATOIRE' : 'CLOTURE_TOTALE';
  }
  function actions(tr) { return $$('td:last-child button', tr); } // [en cours, modifier, supprimer]

  function message(txt) {
    info.textContent = txt;
    clearTimeout(message.t);
    message.t = setTimeout(function () { info.textContent = infoDefaut; }, 5000);
  }

  function refresh() {
    rows().forEach(function (tr) {
      var cours = enCours(tr), a = actions(tr);
      a[0].disabled = cours;
      a[0].title = cours ? 'Déjà en cours' : 'Définir comme en cours';
      a[2].disabled = cours;
      a[2].title = cours ? 'Un exercice « En cours » ne peut pas être supprimé.' : 'Supprimer';
      tr.style.background = tr === selected ? '#e6f1fb' : '';
    });
    BTN['Modifier'].disabled = !selected;
    BTN['Supprimer'].disabled = !selected || enCours(selected);
  }

  function definirEnCours(tr) {
    rows().forEach(function (r) {
      var box = cell(r, 5).querySelector('span');
      var on = r === tr;
      box.setAttribute('style', on ? CHECK_ON : CHECK_OFF);
      box.innerHTML = on ? '<i class="ti ti-check text-[#3e97ff] text-[13px]"></i>' : '';
    });
    refresh();
    message('L\'exercice ' + cell(tr, 0).textContent.trim() + ' est maintenant l\'exercice en cours.');
  }

  function supprimer(tr) {
    var annee = cell(tr, 0).textContent.trim();
    if (enCours(tr) || !window.confirm('Supprimer l\'exercice ' + annee + ' ?')) return;
    if (selected === tr) selected = null;
    tr.remove();
    refresh();
    message('Exercice ' + annee + ' supprimé.');
  }

  function formulaireAbsent() {
    message('Le formulaire de saisie d\'un exercice n\'est pas encore dans la maquette : il faut une capture de l\'écran ouvert par « Ajouter ».');
  }

  function filtrer() {
    var annee = filtres[0].value.trim(), debut = filtres[1].value, fin = filtres[2].value;
    var st = filtres[3].value, cours = filtres[4].value;
    var q = recherche.value.trim().toLowerCase();
    rows().forEach(function (tr) {
      var ok = (!annee || cell(tr, 0).textContent.indexOf(annee) >= 0) &&
        (!debut || toIso(cell(tr, 2).textContent) >= debut) &&
        (!fin || toIso(cell(tr, 3).textContent) <= fin) &&
        (st === 'tous' || statut(tr) === st) &&
        (cours === 'tous' || (cours === 'oui') === enCours(tr)) &&
        (!q || tr.textContent.toLowerCase().indexOf(q) >= 0);
      tr.style.display = ok ? '' : 'none';
    });
  }

  tbody.addEventListener('click', function (e) {
    var tr = e.target.closest('tr');
    if (!tr) return;
    var btn = e.target.closest('button');
    if (btn) {
      var a = actions(tr), i = a.indexOf(btn);
      if (i === 0) definirEnCours(tr);
      if (i === 1) { selected = tr; refresh(); formulaireAbsent(); }
      if (i === 2) supprimer(tr);
      return;
    }
    selected = selected === tr ? null : tr;
    refresh();
  });
  BTN['Ajouter'].addEventListener('click', formulaireAbsent);
  BTN['Modifier'].addEventListener('click', formulaireAbsent);
  BTN['Supprimer'].addEventListener('click', function () { if (selected) supprimer(selected); });
  BTN['Imprimer'].addEventListener('click', function () { window.print(); });
  $('[title="Rafraîchir"]').addEventListener('click', function () {
    filtres.forEach(function (f) { f.value = f.tagName === 'SELECT' ? 'tous' : ''; });
    recherche.value = '';
    filtrer();
  });
  filtres.concat([recherche]).forEach(function (f) {
    f.addEventListener('input', filtrer);
    f.addEventListener('change', filtrer);
  });
  refresh();
})();
