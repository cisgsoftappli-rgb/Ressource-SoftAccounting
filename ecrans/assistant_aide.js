/* Extension de l'assistant SoftAccounting IA : aide sur toutes les fonctionnalités (index du menu lu en direct, fiches d'écran
   générées depuis chaque écran, guides pas à pas) et analyse de la base de données chargée dans la maquette.
   S'enregistre dans window.AI_PLUGINS (avant les réponses de base) et window.AI_FALLBACK (dernier recours). Ne pas nommer de fonction « $$ » (build.cjs). */
(function () {
  var O = function () { return window.AI_OUTILS || {}; };
  function norm(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, "'"); }
  var STOP = /^(le|la|les|un|une|des|du|de|d|l|et|ou|en|au|aux|sur|pour|par|dans|je|tu|il|on|nous|vous|ce|cet|cette|ces|mon|ma|mes|que|qui|quoi|est|sont|puis|peut|dois|veux|voudrais|comment|ou|se|sa|son|ses|a|y|ca|faire|fait|pas|plus|moi|me|ecran|menu|module|logiciel|fonction|fonctionnalite|aide|aidez|explique|expliquez)$/;
  function tokens(t) { return norm(t).split(/[^a-z0-9]+/).filter(function (w) { return w.length > 2 && !STOP.test(w); }); }
  function fr(s) { var v = parseFloat(String(s == null ? '' : s).replace(/[\s ]/g, '').replace(',', '.')); return isNaN(v) ? 0 : v; }
  function M(v) { return (v / 1e6).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' M'; }
  function N0(v) { return Math.round(v).toLocaleString('fr-FR'); }
  function lien(id, label) { return '<a class="ai-lien" href="#' + id + '">' + label + ' <i class="ti ti-arrow-right" aria-hidden="true"></i></a>'; }
  var SRC = '<small style="text-align:left">Source : données chargées dans la maquette.</small>';

  /* ---------- Index du menu (lu dans la barre latérale : couvre aussi les écrans non intégrés) ---------- */
  function txt(e) { return e.textContent.replace(/\s+/g, ' ').trim(); }
  function indexMenu() {
    var res = [], mods = {};
    document.querySelectorAll('[data-module]').forEach(function (m) { mods[m.dataset.module] = txt(m); });
    document.querySelectorAll('[data-sidebar-level]').forEach(function (lv) {
      var mod = mods[lv.dataset.sidebarLevel] || '', gr = {};
      lv.querySelectorAll('[data-group-toggle]').forEach(function (g) { gr[g.dataset.groupToggle] = { l: txt(g), p: g.dataset.group || '' }; });
      function chemin(g) { var c = []; while (g && gr[g]) { c.unshift(gr[g].l); g = gr[g].p; } return c; }
      lv.querySelectorAll('a.sidebar-child-item').forEach(function (a) {
        var label = txt(a); if (!label) return;
        var parts = [mod].concat(chemin(a.dataset.group)).filter(Boolean);
        parts = parts.filter(function (p, i) { return i === 0 || p !== parts[i - 1]; });
        if (parts[parts.length - 1] === label) parts.pop();
        res.push({ label: label, id: a.dataset.nav || '', path: parts.concat([label]).join(' › '), tk: tokens(label), tp: tokens(parts.join(' ')) });
      });
    });
    return res;
  }
  function chercher(q, seulementId) {
    var tq = tokens(q); if (!tq.length) return [];
    var nq = norm(q);
    return indexMenu().filter(function (e) { return !seulementId || e.id; }).map(function (e) {
      var sc = 0; tq.forEach(function (w) { if (e.tk.some(function (x) { return x === w || (w.length > 4 && (x.indexOf(w) === 0 || w.indexOf(x) === 0 && x.length > 4)); })) sc += 3; else if (e.tp.some(function (x) { return x === w; })) sc += 1; });
      if (nq.indexOf(norm(e.label)) > -1) sc += 4;
      return { e: e, sc: sc };
    }).filter(function (x) { return x.sc > 0; }).sort(function (a, b) { return b.sc - a.sc || (b.e.id ? 1 : 0) - (a.e.id ? 1 : 0); });
  }
  function parLibelle(txtLabel) { var n = norm(txtLabel); return indexMenu().filter(function (e) { return norm(e.label) === n && e.id; })[0] || chercher(txtLabel, true)[0] && chercher(txtLabel, true)[0].e || null; }

  /* ---------- Fiche d'écran générée depuis l'écran lui-même ---------- */
  var DESC = {
    entite: "Identité de l'entité (raison sociale, devises, options comme la checklist de clôture).", infos: "Identité de l'entité (raison sociale, devises, options comme la checklist de clôture).",
    pays: 'Liste des pays utilisés par les autres écrans (banques, tiers, comptes émetteurs).', devise: "Monnaies de l'entité, décimales et billetage.", signataires: 'Signataires habilités à valider les paiements.', banques: 'Banques et agences ; la récupération Soft e-Payment synchronise les comptes émetteurs.',
    exercices: "Exercices comptables (dates de début et de fin, exercice en cours, clôture).", racines: 'Racines des comptes par plan.', taxes: 'Types de taxe applicables aux écritures.', modereglement: 'Modes de règlement (virement, chèque, espèces…).',
    lieuaffect: 'Immobilisations › Lieu d’affectation : structure hiérarchique (niveaux et longueur des codes) et arbre des localisations physiques des immobilisations (site, bâtiment, étage, salle…).',
    immolist: 'Immobilisations › Saisies › Liste d’immobilisations : saisie manuelle d’une fiche d’immobilisation (informations générales et complémentaires, imputations comptables) et génération de l’écriture comptable d’acquisition.',
    famimmo: 'Immobilisations › Famille d’immobilisation : regroupe les immobilisations et définit leurs comptes (immobilisation, amortissement, dotation, cession, plus et moins-value) et leurs règles d’amortissement (méthode, durée, taux, prorata, périodicité).',
    collabresp: 'Immobilisations › Collaborateur responsable : structure hiérarchique (niveaux et longueur des codes) et arbre des collaborateurs responsables des immobilisations (direction, service, collaborateur…).',
    cloture: 'Paramétrage de la clôture : reprise des tiers, comptes de résultat, clôtures mensuelle et périodique, checklist.', plans: 'Configuration des plans (niveaux, formats) et gestion des plans.', dp: 'Devis programme.', procfin: 'Procédures financières.',
    acces: 'Utilisateurs, groupes et droits d’accès aux fonctionnalités et journaux.', traces: 'Paramétrage des traces d’audit par fonctionnalité.', jtraces: 'Consultation du journal de traces et du dictionnaire des logs.',
    ecritures: 'Saisie des écritures comptables par journal, avec contrôle d’équilibre et analytique.', rapprochement: 'Configuration du rapprochement bancaire (compte, banque, signataires).', pointage: 'Pointage du relevé bancaire contre les écritures.', situation: 'Rapprochement bancaire › Situation : situation du compte pour un relevé (soldes, recettes et dépenses rapprochées ou non), écritures non rapprochées, écritures non passées, impressions Détail / Fiche.',
    caissegen: 'Petite caisse › Génération des écritures : lots de caisse, proposition du schéma comptable avant validation, génération des écritures.',
    caissesaisie: 'Petite caisse › Saisie : lots de caisse (n° de lot, journal, compte de caisse, devise, solde initial) et leurs opérations (recettes / dépenses, décharges, imputation).',
    caissetypes: 'Petite caisse › Types d\u2019opération : libellé, nature (dépense ou recette), compte général et imputation analytique éventuelle.',
    conversion: 'Gestion des cours › Conversion : conversion en devises des écritures, à-nouveaux, immobilisations et ventilations de marchés, sur une période, des sites et journaux choisis, d\u2019après les cours saisis.',
    cours: 'Gestion des cours › Saisie : cours des monnaies (code monnaie, date, parité en monnaie locale), liste, import Excel.',
    releves: 'Pointage : liste et création des relevés bancaires (saisie ou import Excel), statut Non pointé / En cours / Pointé ; le bouton Pointage ouvre le rapprochement du relevé sélectionné.',
    prelettrage: 'Prélettrage : regroupe des écritures d\u2019un tiers sous une référence PRE-0001…, sans obligation d\u2019équilibre débit / crédit.',
    lettmanuel: 'Lettrage des écritures d\u2019un tiers : cochez les lignes, vérifiez les totaux puis Lettrer.',
    lettparam: 'Paramètre du lettrage : format des lettres, écart toléré, compte d\u2019écart de règlement et critères du lettrage automatique.',
    clotper: 'Clôture périodique d’une période comptable.', clotmens: 'Clôture mensuelle des périodes.', anouveaux: 'Consultation, génération provisoire, import Excel et saisie manuelle des à nouveaux.', clotannuelle: 'Clôture annuelle des exercices, dans l’ordre.',
    balance: 'Balance générale avec critères d’édition.', balaux: 'Balance des tiers (auxiliaire).', glg: 'Grand livre général par compte.', journal: 'Journaux comptables.', balana: 'Balance analytique par axe.',
    bilparam: 'Paramétrage des modèles de bilan (lignes, rubriques, comptes) ; le bouton en haut à droite ouvre l’édition.', crparam: 'Paramétrage du compte de résultat.', erparam: 'Paramétrage du tableau emplois et ressources.', tftparam: 'Paramétrage du tableau de flux de trésorerie.',
    biledit: 'Édition du bilan selon des critères (modèle, exercice, période, sites, devise).', cred: 'Édition du compte de résultat.', ered: 'Édition du tableau emplois et ressources.', tfted: 'Édition du tableau de flux de trésorerie.',
    passation: 'Types de passation de marché.', typemarche: 'Types de marché.', detailcontrat: 'Gestion des contrats › Suivi et historique › Détail d\u2019un contrat : identification du contrat, montants (initial, avenant, total), payé, facturé, soldes et liste des décomptes.', suivicontrats: 'Gestion des contrats › Suivi et historique › Suivi des contrats : état de suivi des marchés (marché, facturé, solde, payé) selon les critères choisis, avec exports PDF et Excel.', reliquats: 'Gestion des contrats › Saisies › Génération des reliquats : report du solde non consommé des contrats d\u2019un exercice N vers N+1, avec simulation puis journal des opérations.', fichecontrat: 'Gestion des contrats › Saisies › Fiche contrat : informations générales, ventilation des montants, modalités de paiement, exécution et lettres de garantie.', recap: 'Modèle de récapitulatif de demande.', soemodel: 'Modèle de relevé de dépenses (SOE).', etatdep: 'État de dépense.', regul: 'Régularisation de la demande.', ejcd: 'Appendice 4 — EJCD.', histdem: 'Historique des demandes.',
    tiers: 'Plan des tiers (clients, fournisseurs…).', dashboard: 'Tableau de bord de pilotage financier.', tchat: 'Messagerie interne (canaux et messages directs).'
  };
  function fiche(e) {
    var s = e.id && document.querySelector('[data-screen="' + e.id + '"]'), h = '<p><b>' + O().esc(e.label) + '</b></p><p style="color:#5B606D;font-size:12px;margin-top:-2px">' + O().esc(e.path) + '</p>';
    if (!e.id) return h + '<p>Cet écran fait partie du module mais n’est <b>pas intégré dans la maquette</b> : vous ne pouvez pas l’ouvrir ici.</p>';
    if (DESC[e.id]) h += '<p>' + DESC[e.id] + '</p>';
    if (s) {
      var uniq = function (a, n) { var v = {}; return a.filter(function (x) { if (!x || x.length > 38 || v[x]) return false; v[x] = 1; return true; }).slice(0, n); };
      var onglets = uniq([].map.call(s.querySelectorAll('[role="tab"]'), function (b) { return txt(b).replace(/\s*\d+\s+lignes?$/, ''); }), 6);
      var actions = uniq([].map.call(s.querySelectorAll('button'), function (b) { return b.closest('[role="tablist"],table,[class*="-ov"],[role="dialog"]') ? '' : txt(b); }), 12);
      var champs = uniq([].map.call(s.querySelectorAll('label'), function (l) { var sp = l.querySelector('span,b'); return (sp ? txt(sp) : txt(l)).replace(/\s*\*$/, ''); }), 14);
      var cols = uniq([].map.call(s.querySelectorAll('th'), function (t) { return txt(t); }), 10);
      function ligne(titre, a) { return a.length ? '<p><b>' + titre + '</b> : ' + a.map(O().esc).join(' · ') + '</p>' : ''; }
      h += ligne('Onglets', onglets) + ligne('Actions', actions) + ligne('Champs', champs) + ligne('Colonnes', cols);
    }
    return h + lien(e.id, 'Ouvrir « ' + O().esc(e.label) + ' »');
  }

  /* ---------- Guides pas à pas ---------- */
  var GUIDES = [
    { kw: ['fiche immobilisation', 'fiches immobilisation', 'liste immobilisation', 'saisir immobilisation', 'nouvelle immobilisation', 'generer ecriture immobilisation', 'ecriture immobilisation', 'acquisition immobilisation'], t: 'Saisir une fiche d’immobilisation et générer son écriture', cible: 'Liste d’immobilisations', e: ['Ouvrez Immobilisations › Saisies › Liste d’immobilisations, puis « Ajouter ».', 'Onglet Général : année, site, référence de la facture, désignation, compte général, quantité, prix unitaire, dates d’acquisition et de mise en service ; puis numéro d’identification, état, famille, emplacement et responsable.', 'Onglet Écritures : choisissez le fournisseur collectif et le compte auxiliaire, puis la ventilation analytique des plans activés.', 'Cliquez sur « Enregistrer » : la fiche apparaît dans la liste au statut Brouillon.', 'Sélectionnez la fiche puis « Générer écriture » : l’écriture d’acquisition est créée (débit du compte général, crédit du fournisseur) et la fiche passe à « Écriture générée ».'] },
    { kw: ['famille immobilisation', 'familles immobilisation', 'famille immo', 'amortissement immobilisation', 'duree amortissement', 'taux amortissement', 'compte dotation', 'methode amortissement'], t: 'Créer une famille d’immobilisation', cible: 'Famille d’immobilisations', e: ['Ouvrez Immobilisations › Paramétrages › Famille d’immobilisations, puis « Ajouter ».', 'Informations générales : code famille, libellé et nature (corporel, incorporel, financier).', 'Paramètres comptables : choisissez le compte d’immobilisation, puis les comptes d’amortissement et de dotation (obligatoires si la famille est amortissable) ; sortie / cession, plus-value et moins-value sont facultatifs.', 'Paramètres d’amortissement : méthode, durée, taux (calculé automatiquement tant que la case est cochée), prorata temporis, date de début et périodicité. Décochez « Immobilisation amortissable » pour un terrain par exemple.', 'Cliquez sur « Enregistrer » : la famille apparaît dans l’onglet Liste.'] },
    { kw: ['collaborateur responsable', 'collaborateurs responsables', 'responsable immobilisation', 'detenteur', 'plan detenteur', 'qui detient immobilisation'], t: 'Créer un collaborateur responsable', cible: 'Collaborateur responsable', e: ['Ouvrez Immobilisations › Paramétrages › Collaborateur responsable.', 'Onglet « Structure & codification » : définissez les niveaux (Direction, Service, Collaborateur…) avec leur format et leur nombre de caractères.', 'Onglet « Collaborateurs responsables » : sélectionnez un collaborateur puis « Ajouter » pour créer le niveau suivant (le rattachement est prérempli).', 'Saisissez le code du segment et le nom, puis « Enregistrer ». Le code complet est celui du rattachement suivi du segment, séparés par un point.', 'Un collaborateur qui a des collaborateurs rattachés ne peut pas être supprimé ; le désactiver désactive aussi ses rattachés.'] },
    { kw: ['lieu affectation', 'lieux affectation', 'lieu d affectation', 'localisation immobilisation', 'plan etablissements', 'site batiment etage', 'structure codification'], t: 'Créer un lieu d’affectation', cible: 'Lieu d’affectation', e: ['Ouvrez Immobilisations › Paramétrages › Lieu d’affectation.', 'Onglet « Structure & codification » : définissez les niveaux (Site, Bâtiment, Étage, Salle…) et la longueur du code de chaque niveau.', 'Onglet « Lieux d’affectation » : sélectionnez un lieu puis « Ajouter » pour créer un lieu au niveau suivant (le parent est prérempli).', 'Saisissez le code du segment et le nom, puis « Enregistrer ». Le code complet est celui du parent suivi du segment, séparés par un point.', 'Un lieu qui contient d’autres lieux ne peut pas être supprimé ; le désactiver désactive aussi ses lieux rattachés.'] },
    { kw: ['creer exercice', 'ouvrir exercice', 'nouvel exercice', 'exercice comptable', 'dates exercice', 'exercice en cours'], t: 'Créer ou gérer un exercice comptable', cible: 'Exercices comptables', e: ['Ouvrez Paramétrages › Paramètres comptables › Exercices comptables.', 'Cliquez sur « Ajouter » : un exercice couvre du 01/01 au 31/12.', 'Enregistrez, puis « Définir en cours » pour en faire l’exercice courant.', 'La clôture se fait ensuite depuis Comptabilité générale › Travaux périodiques › Clôture annuelle.'] },
    { kw: ['cloture annuelle', 'cloturer exercice', 'cloturer annee', 'fermer exercice', 'cloture exercice', 'fin exercice', 'fin annee'], t: 'Clôturer un exercice', cible: 'Clôture annuelle', e: ['Ouvrez Comptabilité générale › Travaux périodiques › Clôture annuelle.', 'Les exercices précédents doivent être clôturés avant : sinon le bouton est refusé.', 'Sélectionnez l’exercice puis « Clôturer l’exercice » et confirmez.', 'La date de clôture et l’utilisateur alimentent la liste ; les à nouveaux provisoires sont remplacés par les définitifs.', 'Si l’option checklist est active, passez d’abord les contrôles de Clôture comptable.'] },
    { kw: ['a nouveau', 'a nouveaux', 'report a nouveau', 'generer a nouveau', 'reprise soldes'], t: 'Générer et gérer les à nouveaux', cible: 'À nouveau', e: ['Ouvrez Travaux périodiques › À nouveau et choisissez le Site et l’Exercice.', '« Générer les à nouveaux provisoires » : choisissez l’exercice source (la cible est N+1) ; les comptes de capitalisation paramétrés sont affichés.', 'Un provisoire peut être écrasé par une nouvelle génération ; la clôture annuelle le remplace par le définitif.', '« Importer » reprend un fichier Excel (modèle téléchargeable, contrôle en 3 onglets) ; « Saisie manuelle » ajoute une ligne.', 'PDF et Excel exportent la liste.'] },
    { kw: ['import excel', 'importer excel', 'importer fichier', 'modele import', 'modele excel', 'import xlsx', 'charger fichier', 'importation'], t: 'Importer des données depuis Excel', cible: '', e: ['Sur l’écran concerné, cliquez sur « Importer ».', '« Télécharger le modèle » donne un fichier avec les colonnes attendues.', 'Remplissez-le puis chargez-le : une fenêtre de contrôle affiche « Lignes retenues », « Lignes rejetées » et, s’il y a des rejets, « Anomalies ».', 'Choisissez de remplacer ou d’ajouter, puis « Importer les lignes retenues ».'] },
    { kw: ['saisir ecriture', 'saisie ecriture', 'ecriture comptable', 'passer ecriture', 'comptabiliser', 'piece comptable', 'creer ecriture'], t: 'Saisir une écriture', cible: "Saisie d'écritures", e: ['Ouvrez Comptabilité générale › Saisie d’écritures.', 'Choisissez l’exercice, le journal et la date ; chaque liste se filtre par code et par libellé.', 'Saisissez les lignes (compte, tiers, analytique, montants) jusqu’à l’équilibre débit = crédit.', 'Enregistrez ; « Infos libres » et la matrice d’importation complètent la saisie.'] },
    { kw: ['prelettrage', 'prelettrer', 'reference prelettrage'], t: 'Prélettrer des écritures', cible: 'Prélettrage', e: ['Ouvrez Lettrage › Prélettrage : mêmes critères que le lettrage (compte, tiers, période, statut).', 'Cochez au moins deux écritures : aucun équilibre débit / crédit n\u2019est exigé.', '« Prélettrer » leur attribue une référence de prélettrage (PRE-0001…) ; la liste affiche cette référence dans la dernière colonne.', 'Pour défaire, cliquez sur une ligne prélettrée puis « Annuler le prélettrage ».'] },
    { kw: ['lettrage', 'lettrer', 'delettrer', 'delettrage', 'lettre tiers', 'ecart tolere'], t: 'Lettrer des écritures', cible: 'Lettrage', e: ['Réglez d\u2019abord Lettrage › Paramètre : format des lettres, écart toléré, compte d\u2019écart de règlement et critères du lettrage automatique.', 'Ouvrez Lettrage › Lettrage, choisissez le compte, le tiers et la période.', 'Cochez les écritures à rapprocher : les totaux débit et crédit de la sélection s\u2019affichent.', '« Lettrer » attribue la lettre suivante si la sélection est équilibrée ou si l\u2019écart reste dans l\u2019écart toléré (il est alors passé au compte d\u2019écart).', 'Le bouton « Lettrage automatique » propose des groupes de lignes selon les critères du paramètre, avec le numéro de lettre proposé, modifiable, avant validation.', 'Pour défaire un lettrage, cliquez sur une ligne lettrée puis « Délettrer ».'] },
    { kw: ['journal', 'journaux', 'creer journal', 'parametrer journal'], t: 'Paramétrer un journal', cible: 'Journaux', e: ['Les journaux se paramètrent dans le plan des journaux (Paramétrages › Paramètres comptables › Gestion des plans).', 'Un journal a un code, un libellé, un type et une nature, un site et éventuellement un compte et une banque.', 'Les droits par utilisateur se règlent dans Administration › Gestion des accès (rattachement aux journaux).'] },
    { kw: ['plan comptable', 'creer compte', 'ajouter compte', 'plan analytique', 'regroupement', 'configurer plan', 'niveau plan'], t: 'Paramétrer les plans (comptable, analytique…)', cible: 'Configuration des plans', e: ['« Configuration des plans » définit les niveaux et formats de chaque plan.', '« Saisie des plans » permet d’ajouter, modifier ou désactiver des codes (plan comptable, activité, budget, géographique, financier…).', 'La racine des comptes et les regroupements alimentent les états financiers.'] },
    { kw: ['tiers', 'fournisseur', 'client', 'creer tiers', 'compte tiers'], t: 'Gérer les tiers', cible: 'Tiers', e: ['Ouvrez la saisie des tiers (Paramètres comptables).', 'Un tiers est rattaché à un compte collectif (401…, 411…) avec un code, un nom et un type.', 'Complétez adresse, NIF/STAT et pays ; un tiers déjà utilisé n’est pas supprimable (désactivez-le).'] },
    { kw: ['utilisateur', 'droit', 'acces', 'groupe', 'habilitation', 'permission', 'profil'], t: 'Gérer les utilisateurs et les droits', cible: 'Gestion des accès', e: ['Ouvrez Administration › Gestion des accès.', '« Nouvel utilisateur » crée un compte (nom, groupe, e-mail) ; l’utilisateur peut être désactivé.', 'Le groupe détermine les fonctionnalités accessibles ; les rattachements limitent l’accès aux journaux.', 'Les actions sont tracées dans le journal de traces.'] },
    { kw: ['trace', 'audit', 'historique actions', 'log', 'journal de traces'], t: 'Traces et audit', cible: 'Journal de traces', e: ['« Paramétrage des traces » choisit, par fonctionnalité, ce qui est tracé et la durée de conservation.', '« Journal de traces » consulte les actions (filtres, dictionnaire des logs, export PDF/Excel).'] },
    { kw: ['banque', 'compte emetteur', 'e-payment', 'epayment', 'ordre paiement', 'iban', 'recuperation'], t: 'Banques et Soft e-Payment', cible: 'Liste des banques', e: ['Ouvrez Paramètres généraux › Liste des banques : identification, coordonnées bancaires, adresse et contact ; le pays vient de la liste des pays paramétrés.', '« Récupération Soft e-Payment » ouvre une fenêtre : filtrez les comptes émetteurs puis synchronisez.', 'Les ordres de paiement se préparent ensuite dans Soft e-Payment.'] },
    { kw: ['generation ecritures', 'generer ecritures caisse', 'schema comptable', 'ecritures de caisse'], t: 'Générer les écritures de petite caisse', cible: 'Génération des écritures', e: ['Ouvrez Comptabilité générale › Petite caisse › Génération des écritures et sélectionnez un lot.', '« Proposer schéma comptable » affiche les écritures avant validation : recette = débit caisse / crédit compte du type ; dépense = débit compte du type / crédit caisse, avec l’analytique.', 'Vérifiez l’équilibre débit / crédit puis « Générer les écritures » ; le statut du lot passe à Généré.'] },
    { kw: ['saisie caisse', 'lot de caisse', 'lot caisse', 'operation de caisse', 'decharge'], t: 'Saisir un lot de petite caisse', cible: 'Saisie', e: ['Ouvrez Comptabilité générale › Petite caisse › Saisie puis « Ajouter ».', 'Renseignez le numéro du lot, le journal caisse, le compte de caisse, la devise et le solde initial.', '« Ajouter des opérations » ouvre le formulaire : date, libellé, recette (débit) ou dépense (crédit), décharge et imputation (type d’opération, avec axes analytiques si requis).', '« Enregistrer » valide le lot ; le solde = solde initial + recettes − dépenses.'] },
    { kw: ['petite caisse', 'type operation', 'types operation', 'type d operation'], t: 'Créer un type d\u2019opération de petite caisse', cible: 'Types d\u2019opération', e: ['Ouvrez Comptabilité générale › Petite caisse › Types d\u2019opération puis « Ajouter ».', 'Saisissez le libellé (ex. Carburant) et choisissez la nature : Dépense ou Recette.', 'Sélectionnez le compte général imputé ; cochez « Nécessite une imputation analytique » si la saisie doit être ventilée.', '« Enregistrer » ajoute le type à la liste ; le libellé doit être unique.'] },
    { kw: ['conversion', 'convertir', 'montants nuls', 'conversion devises'], t: 'Convertir les montants en devises', cible: 'Conversion', e: ['Saisissez d\u2019abord les cours dans Gestion des cours › Saisie (une parité par devise, à la fin de la période ou avant).', 'Ouvrez Gestion des cours › Conversion et cochez les éléments à convertir : écritures de la période, à-nouveaux, mouvements des immobilisations, ventilations de fiches marchés.', 'Choisissez la période, les sites et les journaux (« Tous sélectionnés » par défaut). « Convertir uniquement les montants nuls » laisse intacts les montants déjà convertis.', '« Convertir » vérifie les cours, demande confirmation puis affiche le résultat et l\u2019historique.'] },
    { kw: ['cours', 'parite', 'taux de change', 'cours devise', 'cours monnaie', 'gestion des cours'], t: 'Saisir les cours des monnaies', cible: 'Saisie', e: ['Ouvrez Comptabilité générale › Gestion des cours › Saisie.', '« Ajouter » : choisissez le code monnaie (une devise autre que la monnaie locale), la date et la parité, c\u2019est-à-dire la valeur d\u2019une unité de la devise en monnaie locale (ex. 1 USD = 4 400 MGA).', 'Un seul cours par devise et par date ; la liste se filtre et se trie par colonne.', '« Importer » charge un fichier Excel Devise / Date / Parité (modèle téléchargeable).'] },
    { kw: ['devise', 'monnaie', 'taux', 'decimale', 'billetage'], t: 'Devises et monnaies', cible: 'Devise', e: ['L’écran Devise liste les monnaies (décimales, billetage).', 'Dans Administration de l’entité › Informations générales, choisissez la monnaie locale et jusqu’à 3 devises : elles déterminent les colonnes de montants (À nouveau, états).'] },
    { kw: ['rapprochement', 'pointage', 'releve bancaire', 'releves', 'situation bancaire'], t: 'Rapprochement bancaire', cible: 'Pointage', e: ['« Configuration » associe un compte comptable à une banque et aux signataires.', '« Pointage » ouvre d\u2019abord la liste des relevés : choisissez le compte bancaire (les relevés sont cloisonnés par compte), créez le relevé (n°, date, lignes saisies ou importées d\u2019Excel avec « Importer les lignes » dans le relevé ouvert), sélectionnez-le dans la liste puis cliquez sur le bouton « Pointage ».', 'Écran de rapprochement : « Liste des relevés » revient à la liste, « Proposer automatiquement », cochez les lignes puis « Valider le rapprochement ».', '« Situation » donne l’état du rapprochement.'] },
    { kw: ['bilan', 'compte resultat', 'etat financier', 'etats financiers', 'flux tresorerie', 'emplois ressources', 'modele bilan'], t: 'États financiers', cible: 'Bilan', e: ['Un module par état : Bilan, Compte de résultat, Emplois et ressources, Flux de trésorerie.', 'L’écran de paramétrage définit les lignes du modèle (rubriques, comptes) ; le bouton bleu en haut à droite bascule vers l’édition.', 'L’édition demande les critères (modèle, exercice, période, sites, devise) puis affiche l’état, imprimable et exportable.'] },
    { kw: ['balance', 'grand livre', 'etat comptable', 'edition comptable'], t: 'Balances et grand livre', cible: 'Balance générale', e: ['Ouvrez États comptables › Général (ou Analytique).', 'Saisissez les critères d’édition (exercice, période, sites, comptes, devise) puis lancez l’édition.', 'Exportez en CSV, Excel ou PDF depuis la barre d’actions.'] },
    { kw: ['checklist', 'controle cloture', 'cloture comptable', 'cloture mensuelle', 'cloture periodique', 'periode cloture', 'travaux periodiques'], t: 'Clôtures et checklist', cible: 'Clôture comptable', e: ['Paramètres comptables › Clôture comptable : reprise des tiers, comptes de résultat (bénéfice/perte), interrupteurs « clôture mensuelle » et « clôture périodique ».', 'Chaque interrupteur ne masque que son propre menu ; À nouveau et Clôture annuelle restent toujours visibles.', 'La liste des contrôles de la checklist (Inclure / Bloquant) n’apparaît que si l’option « Checklist clôture d’exercice » est active dans l’administration de l’entité.', 'Clôture périodique / mensuelle : sélectionnez la période puis « Clôturer la période » ou « Rouvrir ».'] },
    { kw: ['pays', 'mode reglement', 'type taxe', 'signataire'], t: 'Paramètres généraux', cible: 'Pays', e: ['Pays, Devise, Signataires, Modes de règlement et Types de taxe sont des listes simples : Ajouter, Modifier, Supprimer, puis Enregistrer.', 'Un élément déjà utilisé ne se supprime pas : désactivez-le.'] },
    { kw: ['demande remboursement', 'drf', 'selection', 'soe', 'recapitulatif', 'etat depense', 'regularisation', 'ejcd', 'bailleur'], t: 'Demandes de remboursement (Projets & Bailleurs)', cible: 'Modèle récapitulatif', e: ['Paramétrages : Modèle récapitulatif, Modèle SOE ; les sélections de mouvements se paramètrent dans Procédures financières › Sélection.', 'Saisie : État de dépense.', 'Traitement : Régularisation de la demande et Appendice 4 — EJCD ; Suivi : Historique des demandes.'] },
    { kw: ['passation', 'type marche', 'contrat', 'marche'], t: 'Contrats : types de passation et de marché', cible: 'Type de passation', e: ['Gestion des contrats › Paramétrages : Type de passation et Type de marché.', 'Chaque écran a deux onglets : « Saisie » (formulaire) et « Liste » ; import Excel et exports disponibles.'] },
    { kw: ['tableau de bord', 'dashboard', 'pilotage'], t: 'Tableau de bord', cible: 'Tableau de bord', e: ['Le tableau de bord présente la synthèse comptable et le suivi budgétaire de l’exercice choisi (période, site).', 'Changez l’exercice, la période ou le site pour actualiser les indicateurs.'] },
    { kw: ['export', 'imprimer', 'pdf', 'excel', 'telecharger'], t: 'Exports et impressions', cible: '', e: ['La barre d’actions en haut de chaque écran regroupe Imprimer, PDF, Excel et Exporter.', 'Les tableaux filtrés par colonne s’exportent tels qu’affichés.'] }
  ];
  function guide(t) {
    var best = null, sc = 0;
    GUIDES.forEach(function (g) { var s = 0; g.kw.forEach(function (k) { if (t.indexOf(k) > -1) s += 2 + k.split(' ').length; else { var w = k.split(' '); if (w.length > 1 && w.every(function (x) { return t.indexOf(x.slice(0, 5)) > -1; })) s += 3; } }); if (s > sc) { sc = s; best = g; } });
    return sc >= 3 ? best : null;
  }
  function rendreGuide(g) {
    var e = g.cible && parLibelle(g.cible);
    return '<p><b>' + g.t + '</b></p><ol style="margin:6px 0 0;padding-left:18px">' + g.e.map(function (x) { return '<li style="margin:3px 0">' + x + '</li>'; }).join('') + '</ol>' + (e ? '<p style="margin-top:8px;margin-bottom:0;color:#5B606D;font-size:12px">' + O().esc(e.path) + '</p>' + lien(e.id, 'Ouvrir « ' + O().esc(e.label) + ' »') : '');
  }

  /* ---------- Analyse de la base de données (données en mémoire) ---------- */
  function lst(n) { var v = window[n]; return Array.isArray(v) ? v : []; }
  function actifs(a) { return a.filter(function (x) { return x.actif !== false; }).length; }
  function inventaire() {
    var o = O(), pcs = lst('PLAN_COMPTABLE'), ti = lst('TIERS_PLAN'), jr = lst('JOURNAUX_PLAN'), ex = []; try { ex = window.EXERCICES_API.liste(); } catch (e) {}
    var rows = [
      ['Plan comptable (codes)', N0(pcs.length), actifs(pcs) + ' actifs'], ['Tiers', N0(ti.length), actifs(ti) + ' actifs'], ['Journaux', N0(jr.length), actifs(jr) + ' actifs'],
      ['Banques', N0(lst('BANQUES').length), actifs(lst('BANQUES')) + ' actives'], ['Devises', N0(lst('DEVISES').length), actifs(lst('DEVISES')) + ' actives'], ['Pays', N0(lst('PAYS').length), actifs(lst('PAYS')) + ' actifs'],
      ['Utilisateurs', N0(lst('GA_USERS').length), actifs(lst('GA_USERS')) + ' actifs'], ['Exercices', N0(ex.length), ex.filter(function (r) { return r.cloture; }).length + ' clôturés'],
      ['Comptes au grand livre', N0(lst('GLG_COMPTES').length), '—'], ['Tiers en balance auxiliaire', N0(lst('BX_TIERS').length), '—'], ['Jeux d’à nouveaux', N0(Object.keys(window.A_NOUVEAUX || {}).length), '—']
    ];
    return '<p><b>Inventaire de la base de données</b> :</p>' + o.tab(['Table', 'Lignes', 'Détail'], rows.map(function (r) { return { c: r }; })) + '<p>Posez ensuite une question précise : « répartition des tiers », « top 5 tiers », « qualité des données », « comptes par classe », « solde du compte 512 »…</p>' + SRC;
  }
  function tiersRepart() {
    var o = O(), ti = lst('TIERS_PLAN'), c = {}; ti.forEach(function (t) { var k = t.sous || 'Non typé'; c[k] = (c[k] || 0) + 1; });
    var l = Object.keys(c).map(function (k) { return [k, c[k]]; }).sort(function (a, b) { return b[1] - a[1]; }), top = l.slice(0, 4), reste = l.slice(4).reduce(function (s, x) { return s + x[1]; }, 0); if (reste) top.push(['Autres', reste]);
    return '<p><b>' + N0(ti.length) + ' tiers</b> en base (' + N0(actifs(ti)) + ' actifs).</p>' + o.anneau('Répartition des tiers par type', top, N0) + SRC + lien('tiers', 'Ouvrir les tiers');
  }
  function topTiers() {
    var o = O(), b = lst('BX_TIERS').map(function (t) { return { c: t.code, l: t.libelle && t.libelle !== '@' ? t.libelle : t.code, d: t.mvD, k: t.mvC, s: t.mvD - t.mvC }; });
    if (!b.length) return '<p>Aucune donnée de balance auxiliaire.</p>';
    var top = b.slice().sort(function (x, y) { return (y.d + y.k) - (x.d + x.k); }).slice(0, 5), td = 0, tc = 0; b.forEach(function (x) { td += x.d; tc += x.k; });
    return '<p><b>Top 5 tiers par mouvements</b> (balance auxiliaire, ' + b.length + ' tiers) :</p>' + o.tab(['Tiers', 'Débit', 'Crédit', 'Solde'], top.map(function (x) { return { c: [o.esc(x.c), M(x.d), M(x.k), M(x.s)] }; }).concat([{ b: 1, c: ['Total ' + b.length + ' tiers', M(td), M(tc), M(td - tc)] }])) +
      o.barres('Mouvements des 5 premiers tiers (millions MGA)', top.map(function (x) { return x.c.length > 12 ? x.c.slice(0, 11) + '…' : x.c; }), [{ nom: 'Débit', v: top.map(function (x) { return x.d / 1e6; }) }, { nom: 'Crédit', v: top.map(function (x) { return x.k / 1e6; }) }], N0) + SRC + lien('balaux', 'Balance auxiliaire');
  }
  function planClasses() {
    var o = O(), pc = lst('PLAN_COMPTABLE').filter(function (x) { return /^[1-9]/.test(x.code) && x.code.length >= 6; }), c = {}; pc.forEach(function (x) { c[x.code[0]] = (c[x.code[0]] || 0) + 1; });
    var ks = Object.keys(c).sort();
    return '<p><b>' + N0(pc.length) + ' comptes détaillés</b> (codes à 6 chiffres ou plus) répartis par classe :</p>' + o.barres('Comptes par classe', ks.map(function (k) { return 'Cl. ' + k; }), [{ nom: 'Comptes', v: ks.map(function (k) { return c[k]; }) }], N0) + SRC + lien('pl_comptable', 'Plan comptable');
  }
  function journauxRepart() {
    var o = O(), j = lst('JOURNAUX_PLAN'), c = {}; j.forEach(function (x) { var k = x.nature || x.type || '—'; c[k] = (c[k] || 0) + 1; });
    var l = Object.keys(c).map(function (k) { return [k, c[k]]; }).sort(function (a, b) { return b[1] - a[1]; }), top = l.slice(0, 4), reste = l.slice(4).reduce(function (s, x) { return s + x[1]; }, 0); if (reste) top.push(['Autres', reste]);
    return '<p><b>' + j.length + ' journaux</b>, dont ' + actifs(j) + ' actifs :</p>' + o.anneau('Journaux par nature', top, N0) + SRC;
  }
  function qualite() {
    var o = O(), ti = lst('TIERS_PLAN'), pc = lst('PLAN_COMPTABLE'), jr = lst('JOURNAUX_PLAN'), us = lst('GA_USERS');
    var vu = {}, dup = 0; ti.forEach(function (t) { var k = norm(t.nom) + '|' + t.compte; if (vu[k]) dup++; vu[k] = 1; });
    var sansNif = ti.filter(function (t) { return !t.nif; }).length, inactifs = ti.length - actifs(ti);
    var sansLib = pc.filter(function (p) { return !String(p.libelle || '').trim(); }).length;
    var rows = [
      ['Tiers en double (même nom et même compte)', dup ? o.lg('att', N0(dup)) : o.lg('bon', 'Aucun')], ['Tiers sans NIF', sansNif ? o.lg('att', N0(sansNif) + ' (' + o.Pc(sansNif / (ti.length || 1)) + ')') : o.lg('bon', 'Aucun')],
      ['Tiers inactifs', inactifs ? o.lg('att', N0(inactifs)) : o.lg('bon', 'Aucun')], ['Comptes sans libellé', sansLib ? o.lg('mau', N0(sansLib)) : o.lg('bon', 'Aucun')],
      ['Journaux inactifs', jr.length - actifs(jr) ? o.lg('att', jr.length - actifs(jr)) : o.lg('bon', 'Aucun')], ['Utilisateurs inactifs', us.length - actifs(us) ? o.lg('att', us.length - actifs(us)) : o.lg('bon', 'Aucun')]
    ];
    return '<p><b>Contrôle de qualité des données</b> :</p>' + o.tab(['Contrôle', 'Résultat'], rows.map(function (r) { return { c: r }; })) + '<p>Les doublons et les NIF manquants sont les premiers points à nettoyer ou compléter.</p>' + SRC;
  }
  function rechercheCompte(q) {
    var m = q.match(/\b(\d{2,9})\b/); if (!m) return null; var code = m[1], o = O();
    var pc = lst('PLAN_COMPTABLE').filter(function (p) { return String(p.code).indexOf(code) === 0; }).slice(0, 8), g = lst('GLG_COMPTES').filter(function (x) { return String(x.c).indexOf(code) === 0; });
    if (!pc.length && !g.length) return '<p>Aucun compte ne commence par <b>' + code + '</b>.</p>';
    var h = '<p><b>Comptes commençant par ' + code + '</b> :</p>' + (pc.length ? o.tab(['Code', 'Libellé'], pc.map(function (p) { return { c: [p.code, o.esc(p.libelle)] }; })) : '');
    if (g.length) { var d = 0, c = 0; g.forEach(function (x) { d += fr(x.T && x.T[0]); c += fr(x.T && x.T[1]); }); h += '<p>Au grand livre (' + g.length + ' compte(s)) : débit <b>' + M(d) + '</b>, crédit <b>' + M(c) + '</b>, solde <b>' + M(d - c) + '</b>.</p>'; }
    return h + SRC + lien('glg', 'Grand livre général');
  }
  function rechercheTiers(q) {
    var mot = tokens(q).filter(function (w) { return !/^(tiers|cherche|recherche|trouve|fournisseur|client|liste|combien)$/.test(w); })[0]; if (!mot) return null; var o = O();
    var r = lst('TIERS_PLAN').filter(function (t) { return norm(t.nom).indexOf(mot) > -1 || norm(t.code).indexOf(mot) > -1; });
    if (!r.length) return '<p>Aucun tiers ne correspond à « ' + o.esc(mot) + ' ».</p>';
    return '<p><b>' + N0(r.length) + ' tiers</b> correspondent à « ' + o.esc(mot) + ' »' + (r.length > 8 ? ' (8 premiers)' : '') + ' :</p>' + o.tab(['Compte', 'Code', 'Nom'], r.slice(0, 8).map(function (t) { return { c: [t.compte, o.esc(t.code), o.esc(t.nom)] }; })) + SRC + lien('tiers', 'Ouvrir les tiers');
  }
  function glgTop() {
    var o = O(), g = lst('GLG_COMPTES').map(function (x) { return { c: x.c, l: x.l, d: fr(x.T && x.T[0]), k: fr(x.T && x.T[1]) }; }); if (!g.length) return null;
    var top = g.slice().sort(function (a, b) { return (b.d + b.k) - (a.d + a.k); }).slice(0, 5);
    return '<p><b>Comptes les plus mouvementés du grand livre</b> (' + g.length + ' comptes) :</p>' + o.tab(['Compte', 'Débit', 'Crédit'], top.map(function (x) { return { c: [x.c + ' ' + o.esc(String(x.l).slice(0, 22)), M(x.d), M(x.k)] }; })) + SRC + lien('glg', 'Grand livre général');
  }

  /* ---------- Greffon principal ---------- */
  window.AI_PLUGINS = window.AI_PLUGINS || [];
  window.AI_PLUGINS.push(function (q, t) {
    var o = O(); if (!o.esc) return null;
    // Navigation directe
    if (/^\s*(ouvre|ouvrir|aller|va|vas|affiche|afficher|emmene|navigue|lance|acces)\b/.test(t)) {
      var r = chercher(q.replace(/^\s*\S+\s+(a|au|aux|vers|sur)?\s*/i, ''), true)[0];
      if (r) { setTimeout(function () { location.hash = '#' + r.e.id; }, 250); return '<p>J’ouvre <b>' + o.esc(r.e.label) + '</b>.</p><p style="color:#5B606D;font-size:12px">' + o.esc(r.e.path) + '</p>' + lien(r.e.id, 'Ouvrir « ' + o.esc(r.e.label) + ' »'); }
    }
    // Analyse de la base de données
    if (/(base de donnee|inventaire|etat des donnees|vue d.ensemble des donnees|statistiques? (de la )?base)/.test(t)) return inventaire();
    if (/(qualite|doublon|anomalie.*(donnee|tiers)|donnees? manquante|incomplet|nettoy)/.test(t)) return qualite();
    if (/(repartition|combien|nombre|statistique|analyse).*(tiers|fournisseur|client)|(tiers|fournisseurs|clients).*(repartition|par type)/.test(t)) return tiersRepart();
    if (/(top|plus gros|principaux|meilleurs|plus importants|plus mouvement).*(tiers|fournisseur|client)|(tiers|fournisseurs|clients).*(top|plus gros|mouvement)/.test(t)) return topTiers();
    if (/(comptes?|plan comptable).*(par classe|repartition|combien)|(repartition|combien).*(comptes|plan comptable)/.test(t)) return planClasses();
    if (/(journaux).*(repartition|combien|par nature|par type)|(repartition|combien).*(journaux)/.test(t)) return journauxRepart();
    if (/(top|plus mouvement|plus gros).*(compte)|compte.*(plus mouvement|top)/.test(t)) return glgTop();
    if (/(solde|mouvement|cherche|recherche|trouve|existe|liste).*(compte|\b\d{3,9}\b)/.test(t) && /\b\d{2,9}\b/.test(t) && !/exercice|annee|20\d\d/.test(t)) return rechercheCompte(q);
    if (/(cherche|recherche|trouve|existe|liste).*(tiers|fournisseur|client)/.test(t)) return rechercheTiers(q);
    if (/(combien).*(utilisateurs|journaux|banques|devises|pays|comptes|tiers)/.test(t)) return inventaire();
    // Aide fonctionnelle
    if (/(comment|ou (se )?(trouve|trouver|est|sont|puis|peut|parametr|saisir|creer|configur|faire)|etapes|procedure|mode d.emploi|a quoi sert|c.est quoi|qu.est.ce|explique|fonctionnement|fonctionnalite|guide|marche a suivre)/.test(t)) {
      var g = guide(t); if (g) return rendreGuide(g);
      var r2 = chercher(q);
      if (r2.length) return fiche(r2[0].e) + voirAussi(r2.slice(1), o);
    }
    return null;
  });
  function voirAussi(l, o) { var a = l.filter(function (x) { return x.e.id; }).slice(0, 3); return a.length ? '<p style="margin:8px 0 0"><b>Voir aussi</b> :</p>' + a.map(function (x) { return lien(x.e.id, o.esc(x.e.label)); }).join('') : ''; }
  window.AI_FALLBACK = function (q, t) {
    var o = O(), g = guide(t); if (g) return rendreGuide(g);
    var r = chercher(q);
    if (r.length && r[0].sc >= 3) return '<p>Voici ce que j’ai trouvé :</p>' + fiche(r[0].e) + voirAussi(r.slice(1), o);
    return null;
  };
})();
