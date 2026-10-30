// Champ « Devis programme » des filtres d'édition des états (même règle que la saisie d'écritures) :
//   - un DP choisi : l'état porte sur la période du programme (début → prorogation, sinon fin) et
//     l'exercice est grisé ; aucun DP : l'état porte sur l'exercice ;
//   - gestion des DP désactivée dans les paramètres : le champ n'est pas affiché.
// Les DP viennent de l'écran « Devis programme » (window.SoftDP) et sont relus à chaque ouverture de l'état.
window.SoftDPFiltre = function (o) {
  // o : avant (élément devant lequel insérer le champ), attr (attribut d'encapsulation Angular), id,
  //     ecran (route de l'état), exercice (select à griser), indice (classe d'un texte d'aide, facultatif),
  //     pleineLargeur (booléen), change (rappel après changement de DP)
  function fmt(iso) { return iso ? iso.split('-').reverse().join('/') : ''; }
  function items() {
    if (!window.SoftDP || !window.SoftDP.actif()) return [];
    return window.SoftDP.liste().map(function (d) {
      return { code: d.convention + '/' + d.code, libelle: d.libelle, debut: d.debut, fin: d.prorogation || d.fin };
    });
  }
  var bloc = document.createElement('div');
  bloc.setAttribute(o.attr, '');
  if (o.pleineLargeur) bloc.style.gridColumn = '1 / -1';
  bloc.innerHTML = '<label ' + o.attr + '="" class="filter-label" for="' + o.id + '">Devis programme</label>' +
    '<select ' + o.attr + '="" id="' + o.id + '" class="filter-input"></select>' +
    (o.indice ? '<p ' + o.attr + '="" class="' + o.indice + '"></p>' : '');
  o.avant.parentNode.insertBefore(bloc, o.avant);
  var sel = bloc.querySelector('select'), aide = bloc.querySelector('p');
  var liste = [];

  function remplir() {
    var garde = sel.value;
    liste = items();
    sel.innerHTML = '<option value="">Aucun — édition sur l\'exercice</option>' + liste.map(function (d) {
      return '<option value="' + d.code + '">' + d.code + ' — ' + d.libelle + ' (' + fmt(d.debut) + ' – ' + fmt(d.fin) + ')</option>';
    }).join('');
    var encore = liste.some(function (d) { return d.code === garde; });
    sel.value = encore ? garde : '';
    bloc.style.display = window.SoftDP && window.SoftDP.actif() ? '' : 'none';
    return garde && !encore;   // le DP choisi a disparu (supprimé ou module désactivé)
  }
  function valeur() {
    for (var i = 0; i < liste.length; i++) if (liste[i].code === sel.value) return liste[i];
    return null;
  }
  function griser() {
    var d = valeur();
    o.exercice.disabled = !!d;
    o.exercice.title = d ? 'Édition sur le programme ' + d.code + ' : exercice non utilisé' : '';
    o.exercice.style.background = d ? '#f1f5f9' : '';
    o.exercice.style.color = d ? '#94a3b8' : '';
    if (aide) aide.textContent = d ? 'Période du programme : du ' + fmt(d.debut) + ' au ' + fmt(d.fin) + ' — exercice non utilisé.'
      : 'Aucun programme : l\'état porte sur l\'exercice sélectionné.';
  }
  sel.addEventListener('change', function () { griser(); if (o.change) o.change(); });
  window.addEventListener('hashchange', function () {
    if (location.hash !== '#' + o.ecran) return;
    var perdu = remplir(); griser();
    if (perdu && o.change) o.change();
  });
  remplir(); griser();
  return {
    valeur: valeur,
    reset: function () { sel.value = ''; griser(); }
  };
};
