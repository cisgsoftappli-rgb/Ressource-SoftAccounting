// Construit la maquette SoftCompta à partir de la maquette corrigée (shell) et des captures d'écrans.
//   node build.cjs  ->  SoftCompta_Administration_entite.html
//
// Écrans :
//   - Administration de l'entité (onglets) : #infos, #analytique, #modules
//   - Configuration des plans               : #plans
//   - Saisie des plans                      : #saisie
//   - Exercices comptables                  : #exercices (comportement : ecrans/exercices.js)
//   - Devis programme (écran conçu)         : #dp      (ecrans/devis_programme.html + .js)
//   - Compte de tiers (module Comptabilité générale)    : #tiers     (liste + formulaire : ecrans/tiers.js)
//   - Saisie d'écritures (module Comptabilité générale) : #ecritures (comportement : ecrans/ecritures.js)
//   - Balance générale (module États comptables)        : #balance   (critères + résultat : ecrans/balance.js)
//   - Balance analytique (module États comptables)      : #balana    (fenêtre de critères + résultat : ecrans/balance_analytique.js)
const fs = require('fs');

// Mode PUBLICATION=1 : les fichiers de données des tiers sont remplacés par leur version anonymisée (import_plans/publication/, voir gen.cjs)
const PUBLICATION = !!process.env.PUBLICATION;
const PUB = { 'ecrans/tiers_donnees.json': 'import_plans/publication/tiers_donnees.json', 'ecrans/plans_donnees.json': 'import_plans/publication/plans_donnees.json', 'ecrans/plans_pc.js': 'import_plans/publication/plans_pc.js', 'ecrans/balance_auxiliaire_donnees.js': 'import_plans/publication/balance_auxiliaire_donnees.js', 'ecrans/journal_donnees.json': 'import_plans/publication/journal_donnees.json', 'ecrans/glg_donnees.js': 'import_plans/publication/glg_donnees.js', 'ecrans/etat_depense.html': 'import_plans/publication/etat_depense.html', 'ecrans/designer_soe.html': 'import_plans/publication/designer_soe.html', 'ecrans/gestion_acces.html': 'import_plans/publication/gestion_acces.html', 'ecrans/modele_etat_drf.html': 'import_plans/publication/modele_etat_drf.html' };
const read = (f) => fs.readFileSync(PUBLICATION && PUB[f] ? PUB[f] : f, 'utf8');
const base = read('SoftCompta_HTML_assemble.html');
const caps = {
  infos: read('css/capture_1_informations.html'),
  analytique: read('css/capture_2_analytique.html'),
  modules: read('css/capture_3_modules.html'),
  plans: read('css/capture_4_configuration_plans.html'),
  saisie: read('css/capture_5_saisie_plans.html'),
  exercices: read('css/capture_6_exercices.html'),
  ecritures: read('css/capture_7_saisie_ecritures.html'),
  tiers: read('css/capture_8_comptes_tiers.html'),
  tiersForm: read('css/capture_9_tiers_formulaire.html'),
  bgCriteres: read('css/capture_10_balance_criteres.html'),
  bgResultat: read('css/capture_11_balance_resultat.html'),
  baCriteres: read('css/capture_12_balance_analytique_criteres.html'),
  baResultat: read('css/capture_13_balance_analytique_resultat.html'),
};
const exercicesJs = read('ecrans/exercices.js');
// Listes de la saisie d'écritures (codes analytiques de la capture + jeux d'exemple)
const tiersJs = read('ecrans/tiers.js');
// Champ « Devis programme » commun aux filtres des états
const balanceJs = read('ecrans/dp_filtre.js') + '\n' + read('ecrans/balance.js');
// Refonte des filtres des états : exécutée après les scripts des états (elle déplace leurs champs)
const balanceAnaJs = read('ecrans/balance_analytique.js') + '\n' + read('ecrans/etats_filtres.js');
const balanceAuxJs = read('ecrans/balance_auxiliaire_donnees.js') + String.fromCharCode(10) + read('ecrans/balance_auxiliaire.js');
const glgJs = read('ecrans/glg_donnees.js') + String.fromCharCode(10) + read('ecrans/grand_livre_general.js');
const ecrituresJs = read('ecrans/ecritures_source.js') + '\n' + read('ecrans/etats_fin.js') + '\n' + read('ecrans/etats_impression.js') + '\n' + read('ecrans/ecritures_donnees.js') + '\n' + read('ecrans/ecritures.js') + '\n' + read('ecrans/ecritures_disposition.js') + '\n' + read('ecrans/facture_ocr.js') + '\n' + read('ecrans/facture_softdocs.js') + '\n' + read('ecrans/ecritures_ventilation.js') + '\n' + read('ecrans/ecritures_modeles.js') + '\n' + read('ecrans/ecritures_contrat.js') + '\n' + read('ecrans/ecritures_import.js') + '\n' + read('ecrans/ecritures_tresorerie.js');
// Écrans conçus pour la maquette (pas de capture de l'application)
const dpHtml = read('ecrans/devis_programme.html');
const dpJs = read('ecrans/devis_programme.js');

function element(html, tag) {
  const re = new RegExp('<' + tag + '[\\s>][\\s\\S]*?</' + tag + '>');
  const m = html.match(re);
  if (!m) throw new Error('Élément introuvable : ' + tag);
  return m[0];
}
const CRUMB_RE = /<div[^>]*class="soft-breadcrumb-list[^"]*"[^>]*>[\s\S]*?<\/div>/;
const EF_VIDES = [];
// Plans de « Paramétrages › Gestion des plans › Saisie des plans » (données : ecrans/plans_donnees.json, gabarit : ecrans/plan.tpl.html)
const PLANS = JSON.parse(read('ecrans/plans_donnees.json').replace(/^\uFEFF/, ''));
const PLAN_MENU = { pl_comptable: 'Plan comptable', pl_activite: 'Activité', pl_budget: 'Budget', pl_geo: 'Géo', pl_financier: 'Financier', pl_tiers: 'Tiers', pl_journaux: 'Journaux' };
const planLabel = (p) => PLAN_MENU[p.id] || p.titre;
function crumb(html) {
  const m = html.slice(html.indexOf('<body')).match(CRUMB_RE);
  if (!m) throw new Error('Fil d\'Ariane introuvable');
  return m[0];
}
const addAttr = (html, attr) => html.replace(/^<([a-z-]+)/, `<$1 ${attr}`);
const inertLinks = (html) => html.replace(/href="\/(softcompta[^"]*)?"/g, 'href="#"');

// 1. Styles de composants présents dans les captures mais absents de la maquette
const baseStyles = new Set([...base.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]));
const extra = [];
for (const h of [...Object.values(caps), dpHtml]) {
  for (const m of h.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    if (!baseStyles.has(m[1])) { baseStyles.add(m[1]); extra.push(m[1]); }
  }
}

// 2. Écran « Administration de l'entité » : la capture 1 + les panneaux des captures 2 et 3
const panels = [
  ['infos', read('ecrans/informations_generales.html')],
  ['analytique', read('ecrans/analytique.html')],
  ['modules', element(caps.modules, 'app-modules-standalone').replace(/<\/app-modules-standalone>$/, () => read('ecrans/modules_liste.html') + '</app-modules-standalone>')],
  ['personnalisation', read('ecrans/personnalisation_entite.html')],
];
let admin = element(caps.infos, 'app-modules-admin');
admin = admin.replace(element(caps.infos, 'app-informations-generales'), panels
  .map(([id, html], i) => addAttr(html, `data-tab-panel="${id}"${i ? ' style="display:none"' : ''}`))
  .join(''));

let t = 0;
const ids = panels.map((p) => p[0]);
admin = admin.replace(/<button([^>]*class="inline-flex items-center gap-1\.5 px-4 py-2\.5[^"]*")/g,
  (s, attrs) => `<button data-tab="${ids[t++]}"${attrs}`);
if (t !== 3) throw new Error('Onglets attendus : 3, trouvés : ' + t);
// 4e onglet « Personnalisation » : copie du bouton « Modules » (les panneaux suivent l'ordre de la liste panels)
admin = admin.replace(/<button data-tab="modules"[^>]*>[\s\S]*?<\/button>/, (m) => m + m.replace('data-tab="modules"', 'data-tab="personnalisation"').replace('ti-puzzle', 'ti-adjustments-horizontal').replace(' Modules ', ' Personnalisation '));

// Logo : l'URL blob: n'existe que dans la session du navigateur d'origine
admin = admin.replace(/<img([^>]*)src="blob:[^"]*"([^>]*)>/g,
  '<i class="ti ti-photo text-[28px] text-[#b4b2a9]"></i>');

// 3. Écrans « Configuration des plans » et « Saisie des plans »
const plans = element(caps.plans, 'app-plan-configuration');
// Le lien « Configurer les plans et niveaux » mène à l'écran de configuration
const saisie = element(caps.saisie, 'app-saisie-plan')
  .replace('href="/softcompta/config/configuration-plans"', 'href="#plans"');

// Exercices : la capture contient la ligne 2021 (en cours) ; les lignes 2022 à 2027, de même
// balisage, sont produites à partir du modèle de ligne enregistré avec la capture.
const ligne = caps.exercices.match(/<template data-ligne-preparatoire>([\s\S]*?)<\/template>/)[1];
const lignes = [2022, 2023, 2024, 2025, 2026, 2027].map((a) => ligne
  .replace('{ANNEE}', a).replace('{DEBUT}', '01/07/' + a).replace('{FIN}', '30/06/' + (a + 1))).join('');
const exercices = element(caps.exercices, 'app-multi-exercices').replace('<!--LIGNES-->', () => lignes);

// Saisie d'écritures : les 10 axes analytiques partagent le même balisage (modèle enregistré avec la capture)
const axe = caps.ecritures.match(/<template data-axe-analytique>([\s\S]*?)<\/template>/)[1];
const AXES = ['ACTIVITE', 'POSTE BUDGETAIRE', 'FINANCEMENT', 'GEOGRAPHIQUE', 'NATURE', 'CATEGORIE DE DEPENSE',
  'Plan 7', 'Plan 8', 'Plan 9', 'Plan 10'];
const ecritures = element(caps.ecritures, 'app-jour-entry-form')
  .replace('<!--AXES-->', () => AXES.map((a) => axe.replace('{AXE}', a)).join(''));

// Balance analytique : composant du résultat + fenêtre de critères + message « Renseignez les critères… »
const balana = (() => {
  const res = element(caps.baResultat, 'app-balance-analytique');
  const vide = caps.baCriteres.match(/<div _ngcontent-ng-c2712255655="" class="empty-state">[\s\S]*?<\/div>/)[0]
    .replace('class="empty-state"', 'class="empty-state" data-ba-vide');
  return res.replace(element(res, 'app-bal-criteres-modal'), element(caps.baCriteres, 'app-bal-criteres-modal'))
    .replace('<section _ngcontent-ng-c2712255655="" class="cartouche">', vide + '<section _ngcontent-ng-c2712255655="" class="cartouche">');
})();

// 4. Contenu et fil d'Ariane : un bloc par écran
let out = base.replace(element(base, 'app-modules-admin'),
  `<div data-screen="entite">${inertLinks(admin)}</div>` +
  `<div data-screen="plans" style="display:none">${read('ecrans/plans_config.html')}</div>` +
  `<div data-screen="exercices" style="display:none">${read('ecrans/exercices.html')}</div>` +
  `<div data-screen="racines" style="display:none">${read('ecrans/racines.html')}</div>` +
  `<div data-screen="taxes" style="display:none">${read('ecrans/taxes.html')}</div>` +
  `<div data-screen="typetaxe" style="display:none">${read('ecrans/type_taxe.html')}</div>` +
  `<div data-screen="modecr" style="display:none">${read('ecrans/modeles_ecriture.html')}</div>` +
  `<div data-screen="rapprochement" style="display:none">${read('ecrans/rapprochement_config.html')}</div>` +
  `<div data-screen="releves" style="display:none">${read('ecrans/releves.html')}</div>` +
  `<div data-screen="pointage" style="display:none">${read('ecrans/rapprochement_pointage.html')}</div>` +
  `<div data-screen="clotper" style="display:none">${read('ecrans/cloture_periodique.html')}</div>` +
  `<div data-screen="clotmens" style="display:none">${read('ecrans/cloture_mensuelle.html')}</div>` +
  `<div data-screen="lettparam" style="display:none">${read('ecrans/lettrage_param.html')}</div>` +
  `<div data-screen="cours" style="display:none">${read('ecrans/cours.html')}</div>` +
  `<div data-screen="conversion" style="display:none">${read('ecrans/conversion.html')}</div>` +
  `<div data-screen="caissetypes" style="display:none">${read('ecrans/caisse_types.html')}</div>` +
  `<div data-screen="caissesaisie" style="display:none">${read('ecrans/caisse_saisie.html')}</div>` +
  `<div data-screen="caissegen" style="display:none">${read('ecrans/caisse_generation.html')}</div>` +
  `<div data-screen="lettmanuel" style="display:none">${read('ecrans/lettrage_manuel.html')}</div>` +
  `<div data-screen="prelettrage" style="display:none">${require('./gen_prelettrage.cjs')()}</div>` +
  `<div data-screen="anouveaux" style="display:none">${read('ecrans/a_nouveaux.html')}</div>` +
  `<div data-screen="anouvanalytique" style="display:none">${read('ecrans/a_nouveaux_analytique.html')}</div>` +
  `<div data-screen="coursapplique" style="display:none">${read('ecrans/cours_applique.html')}</div>` +
  `<div data-screen="rsfuf" style="display:none">${read('ecrans/rsf_utilisation_fonds.html')}</div>` +
  `<div data-screen="rsfsb" style="display:none">${read('ecrans/rsf_suivi_budgetaire.html')}</div>` +
  [['aicompta', 'Assistance comptable AI'], ['aifin', 'Assistance financière AI'], ['aifonc', 'Assistance fonctionnelle AI']].map(([id, t]) => `<div data-screen="${id}" style="display:none">${id === 'aicompta' ? read('ecrans/ai_referentiel_compta.html') : id === 'aifin' ? read('ecrans/ai_referentiel_finance.html') : id === 'aifonc' ? read('ecrans/ai_guides_fonctionnels.html') : ''}${read('ecrans/ai_assistance.html').replace(/AIID/g, id).replace(/AITITRE/g, t)}</div>`).join('') +
  `<div data-screen="caissemodeles" style="display:none">${read('ecrans/caisse_modeles.html')}</div>` +
  `<div data-screen="pvcaisse" style="display:none">${read('ecrans/pv_caisse.html')}</div>` +
  `<div data-screen="listeecritures" style="display:none">${read('ecrans/liste_ecritures.html')}</div>` +
  `<div data-screen="clotannuelle" style="display:none">${read('ecrans/cloture_annuelle.html')}</div>` +
  `<div data-screen="situation" style="display:none">${read('ecrans/rapprochement_situation.html')}</div>` +
  `<div data-screen="dp" style="display:none">${element(dpHtml, 'app-devis-programme')}</div>` +
  `<div data-screen="ecritures" style="display:none">${inertLinks(ecritures)}</div>` +
  // Compte de tiers : la liste et le formulaire « Ajouter un tiers » (masqué) dans le même écran
  // Balance générale : l'étape « critères » puis le résultat (masqué jusqu'à « Consulter »)
  `<div data-screen="balance" style="display:none">${inertLinks(element(caps.bgCriteres, 'app-bg-criteres'))}` +
  `${addAttr(element(caps.bgResultat, 'app-bg-resultat'), 'style="display:none"')}</div>` +
  `<div data-screen="designer2" style="display:none">${read('ecrans/designer_declaration.html')}</div>` +
  `<div data-screen="designer" style="display:none">${read('ecrans/designer_soe.html')}</div>` +
  `<div data-screen="budgetconv" style="display:none">${read('ecrans/budget_convention.html')}</div>` +
  `<div data-screen="badprog" style="display:none">${read('ecrans/bad_programme.html')}</div>` +
  `<div data-screen="rfimodeles" style="display:none">${read('ecrans/rfi_modeles.html')}</div>` +
  `<div data-screen="rfiparam" style="display:none">${read('ecrans/rfi_parametres.html')}</div>` +
  `<div data-screen="rfiedit" style="display:none">${read('ecrans/rfi_edition.html')}</div>` +
  `<div data-screen="etatdep" style="display:none">${read('ecrans/etat_depense.html')}</div>` +
  `<div data-screen="regul" style="display:none">${read('ecrans/regularisation_drf.html')}</div>` +
  `<div data-screen="rapco" style="display:none">${read('ecrans/rapprochement_co.html')}</div>` +
  `<div data-screen="pad" style="display:none">${read('ecrans/pad.html')}</div>` +
  `<div data-screen="histdem" style="display:none">${read('ecrans/historique_demandes.html')}</div>` +
  `<div data-screen="gavisuivi" style="display:none">${read('ecrans/gavi_suivi.html')}</div>` +
  `<div data-screen="gavisynth" style="display:none">${read('ecrans/gavi_synthese.html')}</div>` +
  `<div data-screen="gavisynthparam" style="display:none">${read('ecrans/gavi_synthese_param.html')}</div>` +
  `<div data-screen="gavirapport" style="display:none">${read('ecrans/gavi_rapport.html')}</div>` +
  `<div data-screen="gavirecap" style="display:none">${read('ecrans/gavi_recap.html')}</div>` +
  `<div data-screen="acces" style="display:none">${read('ecrans/gestion_acces.html')}</div>` +
  `<div data-screen="traces" style="display:none">${read('ecrans/traces.html')}</div>` +
  `<div data-screen="jtraces" style="display:none">${read('ecrans/journal_traces.html')}</div>` +
  `<div data-screen="nettoyages" style="display:none">${read('ecrans/nettoyages.html')}</div>` +
  `<div data-screen="pays" style="display:none">${read('ecrans/pays.html')}</div>` +
  `<div data-screen="modereglement" style="display:none">${read('ecrans/mode_reglement.html')}</div>` +
  `<div data-screen="cloture" style="display:none">${read('ecrans/cloture.html')}</div>` +
  `<div data-screen="lieuaffect" style="display:none">${read('ecrans/lieu_affectation.html')}</div>` +
  `<div data-screen="collabresp" style="display:none">${read('ecrans/collaborateur_responsable.html')}</div>` +
  `<div data-screen="famimmo" style="display:none">${read('ecrans/famille_immobilisation.html')}</div>` +
  `<div data-screen="immolist" style="display:none">${read('ecrans/fiche_immobilisation.html')}</div>` +
  `<div data-screen="reassign" style="display:none">${read('ecrans/reassignation_immobilisation.html')}</div>` +
  `<div data-screen="signataires" style="display:none">${read('ecrans/signataires.html')}</div>` +
  `<div data-screen="banques" style="display:none">${read('ecrans/banques.html')}</div>` +
  `<div data-screen="devise" style="display:none">${read('ecrans/devises.html')}</div>` +
  PLANS.map((p) => '<div data-screen="' + p.id + '" style="display:none">' + (p.id === 'pl_journaux'
    ? read('ecrans/journaux_saisie.html').split('%%DONNEES%%').join(read('ecrans/journaux_donnees.json'))   // écran dédié « Saisie des journaux »
    : p.id === 'pl_tiers'
    ? read('ecrans/tiers_saisie.html').split('%%DONNEES%%').join(read('ecrans/tiers_donnees.json'))   // écran dédié « Saisie des tiers »
    : read('ecrans/plan.tpl.html').split('%%ID%%').join(p.id).split('%%TITRE%%').join(p.titre)
      .split('%%DONNEES%%').join(JSON.stringify({ extra: p.extra, lignes: p.lignes }))) + '</div>').join('') +
  `<div data-screen="journal" style="display:none">${read('ecrans/journal.html').replace('%%DONNEES%%', () => read('ecrans/journal_donnees.json').replace(/^\uFEFF/, '').trim())}</div>` +
  `<div data-screen="dashboard" style="display:none">${read('ecrans/tableau_bord.html')}</div>` +
  `<div data-screen="tchat" style="display:none">${read('ecrans/tchat.html')}</div>` +
  `<div data-screen="bilparam" style="display:none">${read('ecrans/bilan_param.html')}</div>` +
  `<div data-screen="biledit" style="display:none">${read('ecrans/bilan_edition.html')}</div>` +
  `<div data-screen="tftparam" style="display:none">${read('ecrans/tft_param.html')}</div>` +
  `<div data-screen="crparam" style="display:none">${read('ecrans/cr_param.html')}</div>` +
  `<div data-screen="erparam" style="display:none">${read('ecrans/er_param.html')}</div>` +
  `<div data-screen="cred" style="display:none">${read('ecrans/cr_edition.html')}</div>` +
  `<div data-screen="ered" style="display:none">${read('ecrans/er_edition.html')}</div>` +
  `<div data-screen="tfted" style="display:none">${read('ecrans/tft_edition.html')}</div>` +
  EF_VIDES.map(([id, t, r]) => `<div data-screen="${id}" style="display:none"><div style="padding:8px 4px"><p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#706000">États financiers · ${r}</p><h1 style="margin:0;font-family:var(--font-heading);font-size:24px;font-weight:600;color:#0B1332">${t}</h1><p style="margin:8px 0 0;color:#5B606D;font-size:14px">Écran à construire dans une prochaine étape de la maquette.</p></div></div>`).join('') +
  `<div data-screen="soemodel" style="display:none">${read('ecrans/modele_soe.html')}</div>` +
  `<div data-screen="modfisc2" style="display:none">${read('ecrans/modele_etat_drf.html')}</div>` +
  `<div data-screen="fisctrait" style="display:none">${read('ecrans/traitement_declaration.html')}</div>` +
  `<div data-screen="fiscannul" style="display:none">${read('ecrans/annulation_declaration.html')}</div>` +
  `<div data-screen="listing" style="display:none">${read('ecrans/modele_listing.html')}</div>` +
  `<div data-screen="listing2" style="display:none">${read('ecrans/modele_recapitulatif2.html')}</div>` +
  `<div data-screen="listedit" style="display:none">${read('ecrans/edition_liste.html')}</div>` +
  `<div data-screen="recapexec" style="display:none">${read('ecrans/edition_recap.html')}</div>` +
  `<div data-screen="passation" style="display:none">${read('ecrans/type_passation.html')}</div>` +
  `<div data-screen="typemarche" style="display:none">${read('ecrans/type_marche.html')}</div>` +
  `<div data-screen="fichecontrat" style="display:none">${read('ecrans/fiche_contrat.html')}</div>` +
  `<div data-screen="reliquats" style="display:none">${read('ecrans/generation_reliquats.html')}</div>` +
  `<div data-screen="suivicontrats" style="display:none">${read('ecrans/suivi_contrats.html')}</div>` +
  `<div data-screen="detailcontrat" style="display:none">${read('ecrans/detail_contrat.html')}</div>` +
  `<div data-screen="listingdes" style="display:none">${read('ecrans/designer_listing.html')}</div>` +
  `<div data-screen="modfisc" style="display:none">${read('ecrans/modele_etat_fiscal.html')}</div>` +
  `<div data-screen="recap" style="display:none">${read('ecrans/modele_recapitulatif.html')}</div>` +
  `<div data-screen="procfin" style="display:none">${read('ecrans/procedures_financieres.html')}</div>` +
  `<div data-screen="balana" style="display:none">${inertLinks(balana)}</div>` +
  `<div data-screen="glana" style="display:none">${read('ecrans/grand_livre_analytique.html')}</div>` +
  `<div data-screen="detmvt" style="display:none">${read('ecrans/details_mouvements.html')}</div>` +
  `<div data-screen="balaux" style="display:none">${read('ecrans/balance_auxiliaire.html')}</div>` +
  `<div data-screen="echeancier" style="display:none">${read('ecrans/echeancier.html')}</div>` +
  `<div data-screen="glaux" style="display:none">${read('ecrans/grand_livre_auxiliaire.html')}</div>` +
  `<div data-screen="circparam" style="display:none">${read('ecrans/circuit_parametre.html')}</div>` +
  `<div data-screen="circtrait" style="display:none">${read('ecrans/circuit_traitement.html')}</div>` +
  `<div data-screen="glg" style="display:none">${read('ecrans/grand_livre_general.html')}</div>`);

// Le fil d'Ariane de la capture « Saisie des plans » est vide : on reprend celui de la
// configuration des plans (même rubrique) en changeant la page courante.
const plansBase = inertLinks(crumb(caps.plans));
// « Gestion des plans » est un sous-module à part (après Paramètres comptables) : sa page n'est plus sous Paramètres comptables
const plansCrumb = plansBase.replace(/<a[^>]*> Paramètres comptables <\/a><span[^>]*>›<\/span>/, '');
// « Saisie des plans » reste sous Paramètres comptables
const saisieCrumb = plansBase.replace(/<a[^>]*> Gestion des plans <\/a><span[^>]*>›<\/span>/, '').replace(' Configuration des plans </a>', ' Saisie des plans </a>');
// « Devis programme » est directement sous « Paramètres comptables »
const dpCrumb = plansBase
  .replace(' Paramètres comptables ', ' Paramètres financiers ')
  .replace(/<a[^>]*> Gestion des plans <\/a><span[^>]*>›<\/span>/, '')
  .replace(' Configuration des plans </a>', ' Devis programme </a>');
const sepCrumb = dpCrumb.match(/<span[^>]*>›<\/span>/)[0];
const finAnchor = dpCrumb.match(/<a[^>]*> Paramètres financiers <\/a>/)[0];
const gsCrumb = dpCrumb.replace(' Devis programme </a>', ' Gestion des sélections </a>')
  .replace(' Paramètres financiers </a>', ' Procédure financière </a>' + sepCrumb + finAnchor.replace(' Paramètres financiers ', ' Paramétrages '))
  .replace(' Paramétrages </a>', ' Comptabilité Projets &amp; Bailleurs </a>');
const fiscCrumb = inertLinks(crumb(caps.bgCriteres)).replace(' Balance générale </a>', " Modèle d'état </a>")
  .replace(/<a[^>]*> Général <\/a><span[^>]*>›<\/span>/, '')
  .replace(' États comptables </a>', ' États comptables </a>' + sepCrumb + finAnchor.replace(' Paramètres financiers ', ' Déclaration fiscale ') + sepCrumb + finAnchor.replace(' Paramètres financiers ', ' Paramétrages '));
const persCrumb = fiscCrumb.replace(' Déclaration fiscale </a>', ' États personnalisés </a>').replace(' Paramétrages </a>', ' Paramètres </a>').replace(" Modèle d'état </a>", ' Modèle Listing </a>');
const baseCrumb = crumb(out);
const bodyAt = out.indexOf('<body');
out = out.slice(0, bodyAt) + out.slice(bodyAt).replace(baseCrumb,
  addAttr(baseCrumb, 'data-crumb="entite"') +
  addAttr(baseCrumb.replace(' Paramètres généraux </a>', ' Administration </a>').replace(" Administration de l'entité </a>", ' Gestion des accès </a>'), 'data-crumb="acces" style="display:none"') +
  addAttr(baseCrumb.replace(' Paramètres généraux </a>', ' Administration </a>').replace(" Administration de l'entité </a>", ' Paramétrage des traces </a>'), 'data-crumb="traces" style="display:none"') +
  addAttr(baseCrumb.replace(' Paramètres généraux </a>', ' Administration </a>').replace(" Administration de l'entité </a>", ' Journal de traces </a>'), 'data-crumb="jtraces" style="display:none"') +
  addAttr(baseCrumb.replace(' Paramètres généraux </a>', ' Administration </a>').replace(" Administration de l'entité </a>", ' Nettoyages </a>'), 'data-crumb="nettoyages" style="display:none"') +
  addAttr(baseCrumb.replace(" Administration de l'entité </a>", ' Pays </a>'), 'data-crumb="pays" style="display:none"') +
  addAttr(baseCrumb.replace(' Paramètres généraux </a>', ' Paramètres comptables </a>').replace(" Administration de l'entité </a>", ' Mode de règlement </a>'), 'data-crumb="modereglement" style="display:none"') +
  addAttr(baseCrumb.replace(' Paramètres généraux </a>', ' Paramètres comptables </a>').replace(" Administration de l'entité </a>", ' Clôture comptable </a>'), 'data-crumb="cloture" style="display:none"') +
  addAttr(baseCrumb.replace(" Administration de l'entité </a>", ' Signataires </a>'), 'data-crumb="signataires" style="display:none"') +
  addAttr(baseCrumb.replace(" Administration de l'entité </a>", ' Liste des banques </a>'), 'data-crumb="banques" style="display:none"') +
  addAttr(baseCrumb.replace(" Administration de l'entité </a>", ' Devise </a>'), 'data-crumb="devise" style="display:none"') +
  addAttr(plansCrumb, 'data-crumb="plans" style="display:none"') +
  PLANS.map((p) => addAttr(plansCrumb.replace(/<a([^>]*)soft-breadcrumb-current([^>]*)> Configuration des plans <\/a>/, (m, x, y) => {
    const sep = plansCrumb.match(/<span[^>]*>›<\/span>/)[0];
    return '<a' + x + y + '> Saisie des plans </a>' + sep + '<a' + x + 'soft-breadcrumb-current' + y + '> ' + planLabel(p) + ' </a>';
  }), 'data-crumb="' + p.id + '" style="display:none"')).join('') +
  addAttr(dpCrumb, 'data-crumb="dp" style="display:none"') +
  addAttr(fiscCrumb, 'data-crumb="modfisc" style="display:none"') +
  addAttr(persCrumb, 'data-crumb="listing" style="display:none"') +
  addAttr(fiscCrumb.replace(/<span[^>]*>›<\/span><a[^>]*> États comptables <\/a>/, '').replace(' Déclaration fiscale </a>', ' Gestion des contrats </a>').replace(" Modèle d'état </a>", ' Type de marché </a>'), 'data-crumb="typemarche" style="display:none"') +
  addAttr(fiscCrumb.replace(/<span[^>]*>›<\/span><a[^>]*> États comptables <\/a>/, '').replace(' Déclaration fiscale </a>', ' Gestion des contrats </a>').replace(" Modèle d'état </a>", ' Type de passation </a>'), 'data-crumb="passation" style="display:none"') +
  addAttr(fiscCrumb.replace(/<span[^>]*>›<\/span><a[^>]*> États comptables <\/a>/, '').replace(' Déclaration fiscale </a>', ' Gestion des contrats </a>').replace(' Paramétrages </a>', ' Saisies </a>').replace(" Modèle d'état </a>", ' Fiche contrat </a>'), 'data-crumb="fichecontrat" style="display:none"') +
  addAttr(fiscCrumb.replace(/<span[^>]*>›<\/span><a[^>]*> États comptables <\/a>/, '').replace(' Déclaration fiscale </a>', ' Gestion des contrats </a>').replace(' Paramétrages </a>', ' Saisies </a>').replace(" Modèle d'état </a>", ' Génération des reliquats </a>'), 'data-crumb="reliquats" style="display:none"') +
  addAttr(fiscCrumb.replace(/<span[^>]*>›<\/span><a[^>]*> États comptables <\/a>/, '').replace(' Déclaration fiscale </a>', ' Gestion des contrats </a>').replace(' Paramétrages </a>', ' Suivi et historique </a>').replace(" Modèle d'état </a>", ' Suivi des contrats </a>'), 'data-crumb="suivicontrats" style="display:none"') +
  addAttr(fiscCrumb.replace(/<span[^>]*>›<\/span><a[^>]*> États comptables <\/a>/, '').replace(' Déclaration fiscale </a>', ' Gestion des contrats </a>').replace(' Paramétrages </a>', ' Suivi et historique </a>').replace(" Modèle d'état </a>", ' Détail d\'un contrat </a>'), 'data-crumb="detailcontrat" style="display:none"') +
  addAttr(persCrumb.replace(' Paramètres </a>', ' Édition </a>').replace(' Modèle Listing </a>', ' Récapitulatif </a>'), 'data-crumb="recapexec" style="display:none"') +
  addAttr(persCrumb.replace(' Paramètres </a>', ' Édition </a>').replace(' Modèle Listing </a>', ' Liste </a>'), 'data-crumb="listedit" style="display:none"') +
  addAttr(persCrumb.replace(' Modèle Listing </a>', ' Modèle Récapitulatif </a>'), 'data-crumb="listing2" style="display:none"') +
  addAttr(fiscCrumb.replace(/<span[^>]*>›<\/span><a[^>]*> Paramétrages <\/a>/, '').replace(" Modèle d'état </a>", ' Traitement </a>'), 'data-crumb="fisctrait" style="display:none"') +
  addAttr(fiscCrumb.replace(/<span[^>]*>›<\/span><a[^>]*> Paramétrages <\/a>/, '').replace(" Modèle d'état </a>", ' Annulation </a>'), 'data-crumb="fiscannul" style="display:none"') +
  addAttr(fiscCrumb.replace(" Modèle d'état </a>", ' Type de taxe </a>'), 'data-crumb="typetaxe" style="display:none"') +
  [['aicompta', 'Assistance comptable AI'], ['aifin', 'Assistance financière AI'], ['aifonc', 'Assistance fonctionnelle AI']].map(([id, t]) => addAttr(gsCrumb.replace(/<span[^>]*>›<\/span><a[^>]*> Paramétrages <\/a>/, '').replace(/<span[^>]*>›<\/span><a[^>]*> Procédure financière <\/a>/, '').replace(' Comptabilité Projets &amp; Bailleurs </a>', ' SoftAccounting AI </a>').replace(' Gestion des sélections </a>', ' ' + t + ' </a>'), `data-crumb="${id}" style="display:none"`)).join('') +
  [['rsfer', 'Tableau emplois ressources'], ['rsfuf', 'Utilisation de fonds'], ['rsfsb', 'Suivi budgétaire']].map(([id, t]) => addAttr(gsCrumb.replace(/<span[^>]*>›<\/span><a[^>]*> Paramétrages <\/a>/, '').replace(' IDA </a>', ' RSF </a>').replace(' Procédure financière </a>', ' RSF </a>').replace(' Gestion des sélections </a>', ' ' + t + ' </a>'), `data-crumb="${id}" style="display:none"`)).join('') +
  addAttr(gsCrumb.replace(' Paramétrages </a>', ' Récapitulatif </a>').replace(' Gestion des sélections </a>', ' Édition </a>'), 'data-crumb="gavirecap" style="display:none"') +
  addAttr(gsCrumb.replace(' Gestion des sélections </a>', " État de dépense </a>").replace(' Paramétrages </a>', ' Traitement </a>'), 'data-crumb="etatdep" style="display:none"') +
  addAttr(gsCrumb.replace(' Gestion des sélections </a>', ' Budget de la convention </a>').replace(' Paramétrages </a>', ' Saisie </a>'), 'data-crumb="budgetconv" style="display:none"') +
  addAttr(gsCrumb.replace(' Gestion des sélections </a>', ' Programme et budget A3 </a>').replace(' Paramétrages </a>', ' Saisie </a>'), 'data-crumb="badprog" style="display:none"') +
  addAttr(gsCrumb.replace(' IDA </a>', ' FIDA </a>').replace(' Gestion des sélections </a>', " Modèles d'état RFI </a>").replace(' Paramétrages </a>', ' États RFI </a>'), 'data-crumb="rfimodeles" style="display:none"') +
  addAttr(gsCrumb.replace(' IDA </a>', ' FIDA </a>').replace(' Gestion des sélections </a>', " Concepteur d'état RFI </a>").replace(' Paramétrages </a>', ' États RFI </a>'), 'data-crumb="rfides" style="display:none"') +
  addAttr(gsCrumb.replace(' IDA </a>', ' FIDA </a>').replace(' Gestion des sélections </a>', ' Paramètres RFI </a>').replace(' Paramétrages </a>', ' États RFI </a>'), 'data-crumb="rfiparam" style="display:none"') +
  addAttr(gsCrumb.replace(' IDA </a>', ' FIDA </a>').replace(' Gestion des sélections </a>', ' Édition des états RFI </a>').replace(' Paramétrages </a>', ' États RFI </a>'), 'data-crumb="rfiedit" style="display:none"') +
  addAttr(gsCrumb.replace(' Gestion des sélections </a>', " Modèle d'état </a>"), 'data-crumb="modfisc2" style="display:none"') +
  [['gavisuivi', 'Suivi détaillé'], ['gavisynth', 'Synthèse'], ['gavisynthparam', 'Synthèse — Paramétrage'], ['gavirapport', 'Rapport financier']].map(([id, t]) => addAttr(gsCrumb.replace(/<span[^>]*>›<\/span><a[^>]*> Paramétrages <\/a>/, '').replace(' IDA </a>', ' GAVI </a>').replace(' Procédure financière </a>', ' GAVI </a>').replace(' Gestion des sélections </a>', ' ' + t + ' </a>'), `data-crumb="${id}" style="display:none"`)).join('') +
  addAttr(gsCrumb.replace(' Gestion des sélections </a>', ' Historique des demandes </a>').replace(' Paramétrages </a>', ' Suivi </a>'), 'data-crumb="histdem" style="display:none"') +
  addAttr(gsCrumb.replace(/<a[^>]*> Procédure financière <\/a><span[^>]*>›<\/span>/, '').replace(/<a[^>]*> Paramétrages <\/a><span[^>]*>›<\/span>/, '').replace(' Gestion des sélections </a>', ' Saisie PAD </a>'), 'data-crumb="pad" style="display:none"') +
  addAttr(gsCrumb.replace(' Gestion des sélections </a>', ' Régularisation de la demande </a>').replace(' Paramétrages </a>', ' Traitement </a>'), 'data-crumb="regul" style="display:none"') +
  addAttr(gsCrumb.replace(' Gestion des sélections </a>', ' Rapprochement CO </a>').replace(' Paramétrages </a>', ' Traitement </a>'), 'data-crumb="rapco" style="display:none"') +
  addAttr(gsCrumb.replace(' Gestion des sélections </a>', ' Modèle SOE </a>'), 'data-crumb="soemodel" style="display:none"') +
  addAttr(gsCrumb.replace(' Gestion des sélections </a>', ' Modèle récapitulatif </a>'), 'data-crumb="recap" style="display:none"') +
  addAttr(dpCrumb.replace(' Devis programme </a>', ' Procédures financières </a>'), 'data-crumb="procfin" style="display:none"') +
  addAttr(inertLinks(crumb(caps.exercices)), 'data-crumb="exercices" style="display:none"') +
  addAttr(inertLinks(crumb(caps.exercices)).replace(/Exercices comptables/g, 'Racine des comptes'), 'data-crumb="racines" style="display:none"') +
  addAttr(inertLinks(crumb(caps.exercices)).replace(/Exercices comptables/g, 'Type de taxe'), 'data-crumb="taxes" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)), 'data-crumb="ecritures" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)).replace(/(<a[^>]*>)\s*Saisie d'écritures\s*<\/a>/, (m, o) => o + " Saisie d'écritures </a>"), 'data-crumb="ecritures_ent" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)).replace(/(<a[^>]*>)\s*Saisie d'écritures\s*<\/a>/, (m, o) => o.replace(' soft-breadcrumb-current', '') + ' Rapprochement bancaire </a><span class="mx-1">›</span>' + o + ' Configuration </a>'), 'data-crumb="rapprochement" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)).replace(/(<a[^>]*>)\s*Saisie d'écritures\s*<\/a>/, (m, o) => o.replace(' soft-breadcrumb-current', '') + ' Rapprochement bancaire </a><span class="mx-1">›</span>' + o + ' Pointage </a>'), 'data-crumb="releves" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)).replace(/(<a[^>]*>)\s*Saisie d'écritures\s*<\/a>/, (m, o) => o.replace(' soft-breadcrumb-current', '') + ' Rapprochement bancaire </a><span class="mx-1">›</span>' + o.replace(' soft-breadcrumb-current', '') + ' Pointage </a><span class="mx-1">›</span>' + o + ' Rapprochement du relevé </a>'), 'data-crumb="pointage" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)).replace(/(<a[^>]*>)\s*Saisie d'écritures\s*<\/a>/, (m, o) => o.replace(' soft-breadcrumb-current', '') + ' Travaux périodiques </a><span class="mx-1">›</span>' + o + ' Clôture périodique </a>'), 'data-crumb="clotper" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)).replace(/(<a[^>]*>)\s*Saisie d'écritures\s*<\/a>/, (m, o) => o.replace(' soft-breadcrumb-current', '') + ' Travaux périodiques </a><span class="mx-1">›</span>' + o + ' Clôture mensuelle </a>'), 'data-crumb="clotmens" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)).replace(/(<a[^>]*>)\s*Saisie d'écritures\s*<\/a>/, (m, o) => o.replace(' soft-breadcrumb-current', '') + ' Travaux périodiques </a><span class="mx-1">›</span>' + o + ' À nouveau </a>'), 'data-crumb="anouveaux" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)).replace(/(<a[^>]*>)\s*Saisie d'écritures\s*<\/a>/, (m, o) => o.replace(' soft-breadcrumb-current', '') + ' Travaux périodiques </a><span class="mx-1">›</span>' + o + ' Clôture annuelle </a>'), 'data-crumb="clotannuelle" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)).replace(/(<a[^>]*>)\s*Saisie d'écritures\s*<\/a>/, (m, o) => o.replace(' soft-breadcrumb-current', '') + ' Lettrage </a><span class="mx-1">›</span>' + o + ' Paramètre </a>'), 'data-crumb="lettparam" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)).replace(/(<a[^>]*>)\s*Saisie d'écritures\s*<\/a>/, (m, o) => o.replace(' soft-breadcrumb-current', '') + ' Gestion des cours </a><span class="mx-1">›</span>' + o + ' Saisie </a>'), 'data-crumb="cours" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)).replace(/(<a[^>]*>)\s*Saisie d'écritures\s*<\/a>/, (m, o) => o.replace(' soft-breadcrumb-current', '') + ' Gestion des cours </a><span class="mx-1">›</span>' + o + ' Conversion </a>'), 'data-crumb="conversion" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)).replace(/(<a[^>]*>)\s*Saisie d'écritures\s*<\/a>/, (m, o) => o.replace(' soft-breadcrumb-current', '') + ' Petite caisse </a><span class="mx-1">›</span>' + o + ' Types d\'opération </a>'), 'data-crumb="caissetypes" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)).replace(/(<a[^>]*>)\s*Saisie d'écritures\s*<\/a>/, (m, o) => o.replace(' soft-breadcrumb-current', '') + ' Petite caisse </a><span class="mx-1">›</span>' + o + ' Saisie </a>'), 'data-crumb="caissesaisie" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)).replace(/(<a[^>]*>)\s*Saisie d'écritures\s*<\/a>/, (m, o) => o.replace(' soft-breadcrumb-current', '') + ' Petite caisse </a><span class="mx-1">›</span>' + o + ' Modèles de pièce </a>'), 'data-crumb="caissemodeles" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)).replace(/(<a[^>]*>)\s*Saisie d'écritures\s*<\/a>/, (m, o) => o.replace(' soft-breadcrumb-current', '') + ' Petite caisse </a><span class="mx-1">›</span>' + o + ' PV de caisse </a>'), 'data-crumb="pvcaisse" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)).replace(/(<a[^>]*>)\s*Saisie d'écritures\s*<\/a>/, (m, o) => o.replace(' soft-breadcrumb-current', '') + ' Gestion des cours </a><span class="mx-1">›</span>' + o + ' Cours appliqué </a>'), 'data-crumb="coursapplique" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)).replace(/(<a[^>]*>)\s*Saisie d'écritures\s*<\/a>/, (m, o) => o.replace(' soft-breadcrumb-current', '') + ' Travaux périodiques </a><span class="mx-1">›</span>' + o + ' À nouveau analytique </a>'), 'data-crumb="anouvanalytique" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)).replace(/(<a[^>]*>)\s*Saisie d'écritures\s*<\/a>/, (m, o) => o + ' Liste des écritures </a>'), 'data-crumb="listeecritures" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)).replace(/(<a[^>]*>)\s*Saisie d'écritures\s*<\/a>/, (m, o) => o + " Modèles d'écriture </a>"), 'data-crumb="modecr" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)).replace(/(<a[^>]*>)\s*Saisie d'écritures\s*<\/a>/, (m, o) => o.replace(' soft-breadcrumb-current', '') + ' Petite caisse </a><span class="mx-1">›</span>' + o + ' Génération des écritures </a>'), 'data-crumb="caissegen" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)).replace(/(<a[^>]*>)\s*Saisie d'écritures\s*<\/a>/, (m, o) => o + ' Lettrage </a>'), 'data-crumb="lettmanuel" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)).replace(/(<a[^>]*>)\s*Saisie d'écritures\s*<\/a>/, (m, o) => o + ' Prélettrage </a>'), 'data-crumb="prelettrage" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)).replace(/(<a[^>]*>)\s*Saisie d'écritures\s*<\/a>/, (m, o) => o.replace(' soft-breadcrumb-current', '') + ' Rapprochement bancaire </a><span class="mx-1">›</span>' + o + ' Situation </a>'), 'data-crumb="situation" style="display:none"') +
  addAttr(inertLinks(crumb(caps.bgCriteres)), 'data-crumb="balance" style="display:none"') +
  addAttr(inertLinks(crumb(caps.baCriteres)), 'data-crumb="balana" style="display:none"') +
  addAttr(inertLinks(crumb(caps.baCriteres)).replace(/(<[^>]*soft-breadcrumb-current[^>]*>)\s*Balance\s*(<\/)/, '$1 Grand livre analytique $2'), 'data-crumb="glana" style="display:none"') +
  addAttr(inertLinks(crumb(caps.baCriteres)).replace(/(<[^>]*soft-breadcrumb-current[^>]*>)\s*Balance\s*(<\/)/, '$1 Détails des mouvements $2'), 'data-crumb="detmvt" style="display:none"') +
  addAttr(inertLinks(crumb(caps.baCriteres)).replace(/<span[^>]*>›<\/span><a[^>]*> Analytique <\/a>/, '').replace(/<span[^>]*>›<\/span><a[^>]*> Balance <\/a>/, '').replace(/(<a[^>]*class="[^"]*)("[^>]*> États comptables <\/a>)/, '$1 soft-breadcrumb-current$2').replace(' États comptables </a>', ' Tableau de bord </a>'), 'data-crumb="dashboard" style="display:none"') +
  addAttr(inertLinks(crumb(caps.baCriteres)).replace(/<span[^>]*>›<\/span><a[^>]*> Analytique <\/a>/, '').replace(/<span[^>]*>›<\/span><a[^>]*> Balance <\/a>/, '').replace(/(<a[^>]*class="[^"]*)("[^>]*> États comptables <\/a>)/, '$1 soft-breadcrumb-current$2').replace(' États comptables </a>', ' Tchat </a>'), 'data-crumb="tchat" style="display:none"') +
  [['bilparam', 'Bilan', 'Paramétrages'], ['biledit', 'Bilan', 'Édition'], ['crparam', 'Compte de résultat', 'Paramétrages'], ['cred', 'Compte de résultat', 'Édition'], ['erparam', 'Emplois et ressources', 'Paramétrages'], ['ered', 'Emplois et ressources', 'Édition'], ['tftparam', 'Tableau de flux de trésorerie', 'Paramétrages'], ['tfted', 'Tableau de flux de trésorerie', 'Édition']]
    .map(([id, r, p]) => addAttr(inertLinks(crumb(caps.baCriteres)).replace(' États comptables </a>', ' États financiers </a>').replace(' Analytique </a>', ' ' + r + ' </a>').replace(' Balance </a>', ' ' + p + ' </a>'), 'data-crumb="' + id + '" style="display:none"')).join('') +
  addAttr(inertLinks(crumb(caps.bgCriteres)).replace(' Balance générale </a>', ' Balance auxiliaire </a>'), 'data-crumb="balaux" style="display:none"') +
  addAttr(inertLinks(crumb(caps.bgCriteres)).replace(' Balance générale </a>', ' Échéancier et balance âgée </a>'), 'data-crumb="echeancier" style="display:none"') +
  addAttr(inertLinks(crumb(caps.bgCriteres)).replace(' Balance générale </a>', ' Grand livre auxiliaire </a>'), 'data-crumb="glaux" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)).replace(/(<a[^>]*>)\s*Saisie d'écritures\s*<\/a>/, (m, o) => o.replace(' soft-breadcrumb-current', '') + ' Circuit de validation </a><span class="mx-1">›</span>' + o + ' Paramètre Circuit </a>'), 'data-crumb="circparam" style="display:none"') +
  addAttr(inertLinks(crumb(caps.ecritures)).replace(/(<a[^>]*>)\s*Saisie d'écritures\s*<\/a>/, (m, o) => o.replace(' soft-breadcrumb-current', '') + ' Circuit de validation </a><span class="mx-1">›</span>' + o + ' Traitement </a>'), 'data-crumb="circtrait" style="display:none"') +
  addAttr(inertLinks(crumb(caps.bgCriteres)).replace(' Balance générale </a>', ' Grand livre général </a>'), 'data-crumb="glg" style="display:none"') +
  addAttr(inertLinks(crumb(caps.baCriteres)).replace(' États comptables </a>', ' Immobilisations </a>').replace(' Analytique </a>', ' Paramétrages </a>').replace(' Balance </a>', " Lieu d'affectation </a>"), 'data-crumb="lieuaffect" style="display:none"') +
  addAttr(inertLinks(crumb(caps.baCriteres)).replace(' États comptables </a>', ' Immobilisations </a>').replace(' Analytique </a>', ' Paramétrages </a>').replace(' Balance </a>', ' Collaborateur responsable </a>'), 'data-crumb="collabresp" style="display:none"') +
  addAttr(inertLinks(crumb(caps.baCriteres)).replace(' États comptables </a>', ' Immobilisations </a>').replace(' Analytique </a>', ' Paramétrages </a>').replace(' Balance </a>', " Famille d'immobilisations </a>"), 'data-crumb="famimmo" style="display:none"') +
  addAttr(inertLinks(crumb(caps.baCriteres)).replace(' États comptables </a>', ' Immobilisations </a>').replace(' Analytique </a>', ' Saisies </a>').replace(' Balance </a>', " Liste d'immobilisations </a>"), 'data-crumb="immolist" style="display:none"') +
  addAttr(inertLinks(crumb(caps.baCriteres)).replace(' États comptables </a>', ' Immobilisations </a>').replace(' Analytique </a>', ' Saisies </a>').replace(' Balance </a>', ' Réassignation </a>'), 'data-crumb="reassign" style="display:none"') +
  addAttr(inertLinks(crumb(caps.bgCriteres)).replace(' Balance générale </a>', ' Journaux </a>'), 'data-crumb="journal" style="display:none"'));

// 5. Sidebar : groupes repliables et entrée « Configuration des plans »
function tagGroupButton(html, label, group) {
  const i = html.indexOf(`>${label}</span>`);
  const j = html.lastIndexOf('<soft-button', i);
  return html.slice(0, j) + `<soft-button data-group-toggle="${group}"` + html.slice(j + '<soft-button'.length);
}
out = tagGroupButton(out, 'Paramètres généraux', 'generaux');
out = tagGroupButton(out, 'Paramètres comptables', 'comptables');
const fin0 = out.indexOf('data-group-toggle="comptables"');
const fin1 = out.lastIndexOf('<soft-button', fin0);
const finBtn = out.slice(fin1, out.indexOf('</soft-button>', fin0) + 14)
  .replace('data-group-toggle="comptables"', 'data-group-toggle="financiers"').replace('>Paramètres comptables</span>', '>Paramètres financiers</span>');
const plansBtn = finBtn.replace('data-group-toggle="financiers"', 'data-group-toggle="gplans"').replace('>Paramètres financiers</span>', '>Gestion des plans</span>');

// Enfants de « Paramètres généraux » : liens entre les deux boutons de groupe
{
  const a = out.indexOf('data-group-toggle="generaux"');
  const b = out.indexOf('data-group-toggle="comptables"');
  const mid = out.slice(a, b)
    .replace(/<a class="sidebar-child-item([^"]*)" href="#">(<span[^>]*>Administration de l'entité<\/span>)/,
      '<a class="sidebar-child-item$1" href="#infos" data-nav="entite">$2')
    .replace(/<a class="sidebar-child-item([^"]*)" href="#">(<span[^>]*>Pays<\/span>)/, '<a class="sidebar-child-item$1" href="#pays" data-nav="pays">$2')
    .replace(/<a class="sidebar-child-item([^"]*)" href="#">(<span[^>]*>\s*Signataires\s*<\/span>)/, '<a class="sidebar-child-item$1" href="#signataires" data-nav="signataires">$2')
    .replace(/<a class="sidebar-child-item([^"]*)" href="#">(<span[^>]*>\s*Liste des banques\s*<\/span>)/, '<a class="sidebar-child-item$1" href="#banques" data-nav="banques">$2')
    .replace(/<a class="sidebar-child-item[^"]*" href="#">\s*<span[^>]*>\s*Unités\s*<\/span>\s*<\/a>/, '')
    .replace(/<a class="sidebar-child-item([^"]*)" href="#">(<span[^>]*>\s*Devise\s*<\/span>)/, '<a class="sidebar-child-item$1" href="#devise" data-nav="devise">$2')
    .replace(/<a class="sidebar-child-item[^"]*" href="#">\s*<span[^>]*>\s*Fonctions?\s*<\/span>[\s\S]*?<\/a>/, '') // menu « Fonctions » supprimé
    .replace(/<a class="sidebar-child-item/g, '<a data-group="generaux" class="sidebar-child-item')
    .replace(/ sidebar-active"/g, '"');
  out = out.slice(0, a) + mid + out.slice(b);
}
let child;
{
  const b = out.indexOf('data-group-toggle="comptables"');
  const end = out.indexOf('</soft-button>', b) + '</soft-button>'.length;
  child = (id, label, group = 'comptables') =>
    `<a data-group="${group}" class="sidebar-child-item flex items-center w-full py-[7px] pl-8 pr-4 text-left" href="#${id}" data-nav="${id}" style="display:none">` +
    `<span class="flex-1 whitespace-normal break-words" style="line-height: 1.3; font-weight: 400;">${label}</span></a>`;
  out = out.slice(0, end) + child('exercices', 'Exercices comptables') + child('racines', 'Racine des comptes') + child('taxes', 'Type de taxe') + child('modereglement', 'Mode de règlement') + child('cloture', 'Clôture comptable') + plansBtn + child('plans', 'Configuration des plans', 'gplans') + plansBtn.replace('data-group-toggle="gplans"', 'data-group-toggle="gpc"').replace('>Gestion des plans</span>', '>Saisie des plans</span>')
      .replace('<soft-button', '<soft-button data-group="gplans" style="display:none"').replace('h-9 px-4', 'h-9 pl-8 pr-4') +
    PLANS.map((p) => child(p.id, planLabel(p), 'gpc').replace('pl-8 pr-4', 'pl-12 pr-4')).join('') + finBtn + child('dp', 'Devis programme', 'financiers') + child('procfin', 'Procédures financières', 'financiers') +
    out.slice(end);
}

// Sidebar : « Administration » déplie ses entrées (seule « Gestion des accès » est intégrée)
{
  const idx = out.indexOf('>Administration</span>');
  const sb = out.lastIndexOf('<soft-button', idx);
  out = out.slice(0, sb) + '<soft-button data-group-toggle="admin"' + out.slice(sb + '<soft-button'.length);
  const end = out.indexOf('</soft-button>', idx) + '</soft-button>'.length;
  const inert = (label) => child('x', label, 'admin').replace(' href="#x" data-nav="x"', ' href="#" title="Écran non intégré dans la maquette"');
  out = out.slice(0, end) + child('acces', 'Gestion des accès', 'admin') +
    child('traces', 'Paramétrage des traces', 'admin') + child('jtraces', 'Journal de traces', 'admin') + child('nettoyages', 'Nettoyages', 'admin') + out.slice(end);
}

// 5 bis. Sidebar à deux niveaux : modules principaux, puis sous-menu « Paramétrages »
// (le bouton « < Paramétrages » remonte aux modules, un clic sur « Paramétrages » y redescend)
{
  const MODULES = [
    ['tableau-de-bord', 'ti-layout-grid', 'Tableau de bord', false],
    ['parametrages', 'ti-settings', 'Paramétrages', true],
    ['compta-generale', 'ti-copy', 'Comptabilité générale', true],
    ['immobilisations', 'ti-archive', 'Immobilisations', true],
    ['contrats', 'ti-file-text', 'Gestion des contrats', true],
    ['etats-comptables', 'ti-files', 'États comptables', true],
    ['etats-financiers', 'ti-chart-bar', 'États financiers', true],
    // Libellé tronqué sur la capture (« Comptabilité Projets & B… ») : complété par hypothèse
    ['projets-bailleurs', 'ti-briefcase', 'Comptabilité Projets & Bailleurs', true],
    ['softaccounting-ai', 'ti-sparkles', 'SoftAccounting AI', true],
  ];
  const root = '<div data-sidebar-level="root" style="display:none">' + MODULES.map(([id, icon, label, sub]) =>
    `<button type="button" data-module="${id}" title="${label}" class="sidebar-item flex items-center gap-2.5 h-10 px-3 text-left border-0 bg-transparent cursor-pointer" style="color:var(--sidebar-text)">` +
    `<i class="ti ${icon} shrink-0 text-[15px] opacity-75"></i>` +
    `<span class="flex-1 truncate whitespace-nowrap" style="line-height:1.3;font-weight:400">${label}</span>` +
    (sub ? '<i class="ti ti-chevron-right shrink-0 text-[12px] opacity-60"></i>' : '') +
    '</button>').join('') + '</div>';
  const navOpen = out.match(/<nav class="relative flex-1 py-2[^>]*>/)[0];
  const a = out.indexOf(navOpen) + navOpen.length;
  const b = out.indexOf('</nav>', a);
  out = out.slice(0, a) + root + '<div data-sidebar-level="parametrages">' + out.slice(a, b) + '</div>' + out.slice(b);
  out = out.replace('<soft-button _nghost-ng-c733576551="" aria-label="Retour au menu précédent"',
    '<soft-button data-sidebar-back _nghost-ng-c733576551="" aria-label="Retour au menu précédent"');

  // Sous-menu « Comptabilité générale » : même en-tête (bouton retour) et même bouton de groupe
  // que « Paramétrages », avec l'entrée « Saisie d'écritures »
  const lvl = out.indexOf('<div data-sidebar-level="parametrages">');
  const header = out.slice(lvl).match(/<div class="flex items-center gap-2 px-3 py-2\.5 mb-1"[\s\S]*?<\/span><\/div>/)[0];
  const gs = out.indexOf('<soft-button data-group-toggle="comptables"');
  const groupBtn = out.slice(gs, out.indexOf('</soft-button>', gs) + '</soft-button>'.length);
  const cg0 = '<div data-sidebar-level="compta-generale" style="display:none">' +
    header.replace(' Paramétrages ', ' Comptabilité générale ') +
    groupBtn.replace('data-group-toggle="comptables"', 'data-group-toggle="cg"')
      .replace('>Paramètres comptables</span>', '>Comptabilité générale</span>') +
    child('ecritures', "Saisie d'écritures", 'cg') + child('ecritures_ent', "Saisie d'écritures", 'cg');
  const groupe = (id, label) => groupBtn.replace('data-group-toggle="comptables"', `data-group-toggle="${id}"`)
    .replace('>Paramètres comptables</span>', `>${label}</span>`);
  const inerte = (label, g = 'etats-general') => child('x', label, g).replace(' href="#x" data-nav="x"', ' href="#" title="Écran non intégré dans la maquette"');
  const fiscaleKids = groupe('fisc-param', 'Paramétrages').replace('<soft-button', '<soft-button data-group="etats-fiscale" style="display:none"').replace('h-9 px-4', 'h-9 pl-8 pr-4') +
    child('typetaxe', 'Type de taxe', 'fisc-param').replace('pl-8 pr-4', 'pl-12 pr-4') + child('modfisc', "Modèle d'état", 'fisc-param').replace('pl-8 pr-4', 'pl-12 pr-4') +
    child('fisctrait', 'Traitement', 'etats-fiscale') + child('fiscannul', 'Annulation', 'etats-fiscale');
  const persKids = groupe('pers-param', 'Paramètres').replace('<soft-button', '<soft-button data-group="etats-personnalises" style="display:none"').replace('h-9 px-4', 'h-9 pl-8 pr-4') +
    child('listing', 'Modèle Listing', 'pers-param').replace('pl-8 pr-4', 'pl-12 pr-4') + child('listing2', 'Modèle Récapitulatif', 'pers-param').replace('pl-8 pr-4', 'pl-12 pr-4') +
    groupe('pers-edit', 'Édition').replace('<soft-button', '<soft-button data-group="etats-personnalises" style="display:none"').replace('h-9 px-4', 'h-9 pl-8 pr-4') +
    child('listedit', 'Liste', 'pers-edit').replace('pl-8 pr-4', 'pl-12 pr-4') + child('recapexec', 'Récapitulatif', 'pers-edit').replace('pl-8 pr-4', 'pl-12 pr-4');
  const etats = '<div data-sidebar-level="etats-comptables" style="display:none">' +
    header.replace(' Paramétrages ', ' États comptables ') +
    groupe('etats-general', 'Général') + child('balance', 'Balance générale', 'etats-general') + child('balaux', 'Balance auxiliaire', 'etats-general') + child('glg', 'Grand livre général', 'etats-general') + child('glaux', 'Grand livre auxiliaire', 'etats-general') + child('journal', 'Journaux', 'etats-general') + child('echeancier', 'Échéancier & balance âgée', 'etats-general') +
    ['Grand livre auxiliaire', 'Échéancier et balance âgée'].map(inerte).join('') +
    groupe('etats-analytique', 'Analytique') + child('balana', 'Balance analytique', 'etats-analytique') +
    child('glana', 'Grand livre analytique', 'etats-analytique') + child('detmvt', 'Détails des mouvements', 'etats-analytique') +
    [['fiscale', 'Déclaration fiscale'], ['personnalises', 'États personnalisés']]
      .map(([id, l]) => groupe('etats-' + id, l) + (id === 'fiscale' ? fiscaleKids : id === 'personnalises' ? persKids : '')).join('') + '</div>';
  // Comptabilité Projets & Bailleurs › Procédure financière › Paramétrages › Gestion des sélections
  const sousGroupe = (id, label, parent) => groupe(id, label).replace('<soft-button', `<soft-button data-group="${parent}" style="display:none"`).replace('h-9 px-4', 'h-9 pl-8 pr-4');
  const enfant12 = (html) => html.replace('pl-8 pr-4', 'pl-12 pr-4');
  // Comptabilité générale : écrans non intégrés (liste des écritures, lettrage, rapprochement bancaire, circuit de validation, cours, petite caisse)
  const cg = cg0 + child('listeecritures', 'Liste des écritures', 'cg') + child('modecr', "Modèles d'écriture", 'cg') +
    sousGroupe('cg-lettrage', 'Lettrage', 'cg') +
    enfant12(child('lettparam', 'Paramètre', 'cg-lettrage')) + enfant12(child('lettmanuel', 'Lettrage', 'cg-lettrage')) + enfant12(child('prelettrage', 'Prélettrage', 'cg-lettrage')) +
    sousGroupe('cg-rapprochement', 'Rapprochement bancaire', 'cg') +
    enfant12(child('rapprochement', 'Configuration', 'cg-rapprochement')) + enfant12(child('releves', 'Pointage', 'cg-rapprochement')) + enfant12(child('situation', 'Situation', 'cg-rapprochement')) +
    sousGroupe('cg-circuit', 'Circuit de validation', 'cg') + enfant12(child('circparam', 'Paramètre Circuit', 'cg-circuit')) + enfant12(child('circtrait', 'Traitement', 'cg-circuit')) +
    groupe('cg-cours', 'Gestion des cours') + child('cours', 'Saisie', 'cg-cours') + child('conversion', 'Conversion', 'cg-cours') + child('coursapplique', 'Cours appliqué', 'cg-cours') +
    groupe('cg-caisse', 'Petite caisse') + child('caissetypes', "Types d'opération", 'cg-caisse') + child('caissemodeles', 'Modèles de pièce', 'cg-caisse') + child('caissesaisie', 'Saisie', 'cg-caisse') + child('pvcaisse', 'PV de caisse', 'cg-caisse') + child('caissegen', 'Génération des écritures', 'cg-caisse') +
    groupe('cg-travaux', 'Travaux périodiques') + child('clotper', 'Clôture périodique', 'cg-travaux') + child('clotmens', 'Clôture mensuelle', 'cg-travaux') + child('anouveaux', 'À nouveau', 'cg-travaux') + child('anouvanalytique', 'À nouveau analytique', 'cg-travaux') + child('clotannuelle', 'Clôture annuelle', 'cg-travaux') + '</div>';
  // un module par procédure financière (IDA, FIDA, FED, FM, BAD) ; l'activation se règle dans Administration de l'entité › Personnalisation
  const PROCS = ['IDA', 'FIDA', 'FED', 'FM', 'BAD', 'GAVI'];
  const marque = (html, p) => html.replace(/<soft-button /g, '<soft-button data-proc="' + p + '" ').replace(/<a /g, '<a data-proc="' + p + '" ');
  const pb = '<div data-sidebar-level="projets-bailleurs" style="display:none">' +
    header.replace(' Paramétrages ', ' Comptabilité Projets &amp; Bailleurs ') +
    child('pad', 'Saisie PAD', 'pb-racine').replace(' style="display:none"', '').replace('pl-8 pr-4', 'pl-4 pr-4') +
    PROCS.map((p) => marque(p === 'GAVI' ? groupe('drf-GAVI', 'GAVI') + child('gavisuivi', 'Suivi détaillé', 'drf-GAVI') + child('gavisynth', 'Synthèse', 'drf-GAVI') + child('gavirapport', 'Rapport financier', 'drf-GAVI') + sousGroupe('drf-param-GAVI', 'Récapitulatif', 'drf-GAVI') + enfant12(child('recap', "Concepteur d'état", 'drf-param-GAVI')) + enfant12(child('gavirecap', 'Édition', 'drf-param-GAVI')) : (
      groupe('drf-' + p, p) +
      sousGroupe('drf-param-' + p, 'Paramétrages', 'drf-' + p) + enfant12(child('recap', 'Modèle récapitulatif', 'drf-param-' + p)) + enfant12(child('soemodel', 'Modèle SOE', 'drf-param-' + p)) +
      sousGroupe('drf-saisie-' + p, 'Saisie', 'drf-' + p) + enfant12(p === 'BAD' ? child('badprog', 'Programme et budget A3', 'drf-saisie-' + p) : child('budgetconv', 'Budget de la convention', 'drf-saisie-' + p)) +
      sousGroupe('drf-trait-' + p, 'Traitement', 'drf-' + p) + enfant12(child('etatdep', 'État de dépense', 'drf-trait-' + p)) + enfant12(child('regul', 'Régularisation de la demande', 'drf-trait-' + p)) + enfant12(child('rapco', 'Rapprochement CO', 'drf-trait-' + p)) +
      sousGroupe('drf-suivi-' + p, 'Suivi', 'drf-' + p) + enfant12(child('histdem', 'Historique des demandes', 'drf-suivi-' + p)) +
      (p === 'FIDA' ? sousGroupe('drf-rfi-' + p, 'États RFI', 'drf-' + p) + enfant12(child('rfimodeles', 'Modèles d\'état RFI', 'drf-rfi-' + p)) + enfant12(child('rfiparam', 'Paramètres RFI', 'drf-rfi-' + p)) + enfant12(child('rfiedit', 'Édition des états RFI', 'drf-rfi-' + p)) : '')), p)).join('') +
    groupe('drf-rsf', 'RSF') + child('rsfer', 'Tableau emplois ressources', 'drf-rsf').replace('pl-8 pr-4', 'pl-12 pr-4') + child('rsfuf', 'Utilisation de fonds', 'drf-rsf').replace('pl-8 pr-4', 'pl-12 pr-4') + child('rsfsb', 'Suivi budgétaire', 'drf-rsf').replace('pl-8 pr-4', 'pl-12 pr-4') + '</div>';
  const ctr = '<div data-sidebar-level="contrats" style="display:none">' +
    header.replace(' Paramétrages ', ' Gestion des contrats ') +
    groupe('contrats-param', 'Paramétrages') + child('passation', 'Type de passation', 'contrats-param') + child('typemarche', 'Type de marché', 'contrats-param') +
    groupe('contrats-saisie', 'Saisies') + child('fichecontrat', 'Fiche contrat', 'contrats-saisie') + child('reliquats', 'Génération des reliquats', 'contrats-saisie') + groupe('contrats-suivi', 'Suivi et historique') + child('suivicontrats', 'Suivi des contrats', 'contrats-suivi') + child('detailcontrat', 'Détail d\'un contrat', 'contrats-suivi') + '</div>';
  const ef = '<div data-sidebar-level="etats-financiers" style="display:none">' + header.replace(' Paramétrages ', ' États financiers ') +
    [['bil', 'Bilan', 'bilparam', 'biledit'], ['cr', 'Compte de résultat', 'crparam', 'cred'], ['er', 'Emplois et ressources', 'erparam', 'ered'], ['tft', 'Tableau de Flux de trésorerie', 'tftparam', 'tfted']]
      .map(([g, l, p]) => child(p, l, 'ef-' + g).replace(' style="display:none"', '').replace('pl-8 pr-4', 'pl-4 pr-4')).join('') + '</div>';
  const immo = '<div data-sidebar-level="immobilisations" style="display:none">' + header.replace(' Paramétrages ', ' Immobilisations ') +
    groupe('immo-param', 'Paramétrages') + child('lieuaffect', "Lieu d'affectation", 'immo-param') + child('collabresp', 'Collaborateur responsable', 'immo-param') + child('famimmo', "Famille d'immobilisations", 'immo-param') +
    groupe('immo-saisies', 'Saisies') + child('immolist', "Liste d'immobilisations", 'immo-saisies') + child('reassign', 'Réassignation', 'immo-saisies') + '</div>';
  const aiMod = '<div data-sidebar-level="softaccounting-ai" style="display:none">' + header.replace(' Paramétrages ', ' SoftAccounting AI ') +
    [['aicompta', 'Assistance comptable AI'], ['aifin', 'Assistance financière AI'], ['aifonc', 'Assistance fonctionnelle AI']]
      .map(([id, l]) => child(id, l, 'ai-assist').replace(' style="display:none"', '').replace('pl-8 pr-4', 'pl-4 pr-4')).join('') + '</div>';
  const navEnd = out.indexOf('</nav>', lvl);
  out = out.slice(0, navEnd) + cg + etats + pb + ctr + ef + immo + aiMod + out.slice(navEnd);
}

// 6. En-tête
const projet = caps.infos.match(/topbar-active-project-name">\s*([^<]+?)\s*</)[1];
out = out.split('FAPBM').join(projet);
out = out.replace(/<title>[^<]*<\/title>/, '<title>SoftCompta — Maquette</title>');
// Classes utilisées par les écrans SoftCompta mais absentes de la feuille globale (elles venaient
// de la feuille propre à SoftCompta, plus accessible)
extra.push([
  '.bg-slate-50\\/50{background-color:rgb(248 250 252 / .5)}',
  '.min-h-\\[18rem\\]{min-height:18rem}',
  '.max-h-\\[calc\\(100dvh-18rem\\)\\]{max-height:calc(100dvh - 18rem)}',
  '.top-1\\/2{top:50%}',
  '.-translate-y-1\\/2{transform:translateY(-50%)}',
  '.\\[scrollbar-gutter\\:stable\\]{scrollbar-gutter:stable}',
  '.form-input.pl-9{padding-left:2.25rem}',
  '.focus\\:ring-blue-100:focus{box-shadow:0 0 0 2px #dbeafe!important}',
  // Modules principaux de la sidebar (niveau racine)
  '[data-module]{width:calc(100% - 16px);margin:2px 8px;border-radius:8px;font:inherit;font-size:13.5px}',
  '[data-module]:hover{background:var(--sidebar-hover);color:#fff!important}',
  '[data-module].sidebar-active{color:var(--sidebar-active-color)!important;font-weight:400!important}',
  '.min-h-\\[420px\\]{min-height:420px}',
  '.z-\\[2000\\]{z-index:2000}', '.bg-slate-900\\/60{background-color:rgb(15 23 42 / .6)}',
  '.backdrop-blur-sm{-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}',
  '.max-h-\\[90vh\\]{max-height:90vh}', '.max-w-3xl{max-width:48rem}',
  '.shadow-slate-900\\/20{--tw-shadow-color:rgb(15 23 42 / .2);--tw-shadow:var(--tw-shadow-colored)}',
  '.border-slate-200\\/60{border-color:rgb(226 232 240 / .6)}', '.rounded-b-2xl{border-bottom-left-radius:1rem;border-bottom-right-radius:1rem}',
  '.max-h-\\[70vh\\]{max-height:70vh}',
  '.min-h-\\[42px\\]{min-height:42px}',
  '.focus-within\\:border-blue-500:focus-within{border-color:#3b82f6}',
  '.focus-within\\:ring-2:focus-within{box-shadow:0 0 0 2px #dbeafe}',
  '.placeholder\\:text-slate-400::placeholder{color:#94a3b8}',
  '.placeholder\\:font-normal::placeholder{font-weight:400}',
  '.placeholder\\:normal-case::placeholder{text-transform:none}',
  '@media (min-width:640px){.sm\\:flex-row{flex-direction:row}.sm\\:items-center{align-items:center}.sm\\:justify-between{justify-content:space-between}' +
    '.sm\\:w-80{width:20rem}.sm\\:w-48{width:12rem}.sm\\:block{display:block}}',
  '@media (min-width:1024px){.lg\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.lg\\:col-span-2{grid-column:span 2/span 2}' +
    '.lg\\:flex-row{flex-direction:row}.lg\\:w-auto{width:auto}.lg\\:items-center{align-items:center}.lg\\:justify-between{justify-content:space-between}}',
  '@media (min-width:1280px){.xl\\:grid-cols-5{grid-template-columns:repeat(5,minmax(0,1fr))}' +
    '.xl\\:grid-cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}' +
    '.xl\\:col-span-2{grid-column:span 2/span 2}.xl\\:col-span-3{grid-column:span 3/span 3}}',
].join(''));
// En dernier, pour primer sur les styles encapsulés des captures
extra.push(read('ecrans/etats_filtres.css'));
extra.push(read('ecrans/balance_auxiliaire.css'));
extra.push(read('ecrans/echeancier.css'));
extra.push(read('ecrans/etats_modale.css'));
extra.push(read('ecrans/etats_boutons.css'));
extra.push(read('ecrans/barre_actions.css'));
extra.push(read('ecrans/boutons_modeles.css'));
extra.push(read('ecrans/grand_livre_general.css'));
out = out.replace('</head>', extra.map((s) => '<style>' + s + '</style>').join('') + '</head>');

const script = `<script>
(function () {
  var TITLES = { ${PLANS.map((p) => p.id + ': ' + JSON.stringify(p.titre)).join(', ')}, journal: 'Journaux', lieuaffect: "Lieu d'affectation", collabresp: 'Collaborateur responsable', famimmo: "Famille d'immobilisation", dashboard: 'Tableau de bord', tchat: 'Tchat', pays: 'Pays', modereglement: 'Mode de règlement', cloture: 'Clôture comptable', signataires: 'Signataires', banques: 'Liste des banques', devise: 'Devise', acces: 'Gestion des accès', traces: 'Paramétrage des traces', jtraces: 'Journal de traces', nettoyages: 'Nettoyages des données', histdem: 'Historique des demandes', gavisuivi: 'GAVI — Suivi détaillé', gavisynth: 'GAVI — Synthèse', gavisynthparam: 'GAVI — Paramétrage de la synthèse', gavirapport: 'GAVI — Rapport financier', badprog: 'BAD — Programme et budget A3', gavirecap: 'GAVI — Édition du récapitulatif', entite: "Administration de l'entité", plans: 'Configuration des plans', exercices: 'Exercices comptables', racines: 'Racine des comptes', taxes: 'Type de taxe', rapprochement: 'Rapprochement bancaire — Configuration', pointage: 'Rapprochement bancaire — Pointage du relevé', releves: 'Rapprochement bancaire — Pointage', clotper: 'Clôture périodique', clotmens: 'Clôture mensuelle', lettparam: 'Lettrage — Paramètre', circparam: 'Circuit de validation — Paramètre Circuit', circtrait: 'Circuit de validation — Traitement', cours: 'Gestion des cours — Saisie', conversion: 'Gestion des cours — Conversion', caissetypes: "Petite caisse — Types d'opération", caissesaisie: 'Petite caisse — Saisie', caissegen: 'Petite caisse — Génération des écritures', lettmanuel: 'Lettrage', prelettrage: 'Prélettrage', anouveaux: 'À nouveau', anouvanalytique: 'À nouveau analytique', coursapplique: 'Cours appliqué', caissemodeles: 'Modèles de pièce de caisse', pvcaisse: 'PV de caisse', listeecritures: 'Liste des écritures', modecr: "Modèles d'écriture", clotannuelle: 'Clôture annuelle', situation: 'Rapprochement bancaire — Situation', dp: 'Devis programme', recap: "Modèle d'état récapitulatif", modfisc: "Modèle d'état — Déclaration fiscale", typetaxe: 'Type de taxe', listing: 'Modèle listing', listing2: "Modèle d'état récapitulatif", listedit: 'Édition — Liste', passation: 'Types de passation', typemarche: 'Types de marché', fichecontrat: 'Fiche contrat', reliquats: 'Génération des reliquats', immolist: "Liste d'immobilisations", reassign: "Réassignation d'immobilisation", suivicontrats: 'Suivi des contrats', detailcontrat: "Détail d'un contrat", recapexec: 'Exécution du modèle récapitulatif', listingdes: 'Designer modèle listing', fisctrait: "Traitement d'une déclaration", fiscannul: 'Annulation de la déclaration', modfisc2: "Modèle d'état", regul: 'Régularisation de la demande', rapco: 'Rapprochement CO', pad: 'Saisie du PAD', soemodel: "Modèle d'état SOE", budgetconv: 'Budget de la convention', rfimodeles: "Modèles d'état RFI", rfiparam: 'Paramètres RFI', rfiedit: 'Édition des états RFI', etatdep: "Confection guidée d'une demande", rsfer: 'RSF — Tableau emplois ressources', rsfuf: 'RSF — Utilisation de fonds', rsfsb: 'RSF — Suivi budgétaire', aicompta: 'Assistance comptable AI', aifin: 'Assistance financière AI', aifonc: 'Assistance fonctionnelle AI', designer: 'Concepteur SOE', designer2: "Designer — Modèle d'état Déclaration", procfin: 'Procédures financières', ecritures: "Saisie d'écritures", ecritures_ent: "Saisie d'écritures", balance: 'Balance générale', balaux: 'Balance auxiliaire', echeancier: 'Échéancier et balance âgée', glaux: 'Grand livre auxiliaire', glg: 'Grand livre général', balana: 'Balance analytique', glana: 'Grand livre analytique', detmvt: 'Détails des mouvements analytiques', bilparam: 'Paramétrage du bilan', biledit: 'Édition du bilan', crparam: 'Paramétrage du compte de résultat', cred: 'Édition du compte de résultat', erparam: 'Paramétrage des emplois et ressources', ered: 'Édition des emplois et ressources', tftparam: 'Paramétrage du tableau de flux de trésorerie', tfted: 'Édition du tableau de flux de trésorerie' };
  var GROUP = { ${PLANS.map((p) => p.id + ": 'gpc'").join(', ')}, journal: 'etats-general', lieuaffect: 'immo-param', collabresp: 'immo-param', famimmo: 'immo-param', dashboard: 'aucun', tchat: 'aucun', pays: 'generaux', modereglement: 'comptables', cloture: 'comptables', signataires: 'generaux', banques: 'generaux', devise: 'generaux', acces: 'admin', traces: 'admin', jtraces: 'admin', nettoyages: 'admin', histdem: 'drf-suivi', gavisuivi: 'drf-GAVI', gavisynth: 'drf-GAVI', gavisynthparam: 'drf-GAVI', gavirapport: 'drf-GAVI', badprog: 'drf-saisie', gavirecap: 'drf-param', rsfer: 'drf-rsf', rsfuf: 'drf-rsf', rsfsb: 'drf-rsf', aicompta: 'aucun', aifin: 'aucun', aifonc: 'aucun', rfimodeles: 'drf-rfi', rfiparam: 'drf-rfi', rfiedit: 'drf-rfi', entite: 'generaux', plans: 'gplans', exercices: 'comptables', racines: 'comptables', taxes: 'comptables', rapprochement: 'cg-rapprochement', pointage: 'cg-rapprochement', releves: 'cg-rapprochement', clotper: 'cg-travaux', clotmens: 'cg-travaux', lettparam: 'cg-lettrage', circparam: 'cg-circuit', circtrait: 'cg-circuit', cours: 'cg-cours', conversion: 'cg-cours', caissetypes: 'cg-caisse', caissesaisie: 'cg-caisse', caissegen: 'cg-caisse', lettmanuel: 'cg-lettrage', prelettrage: 'cg-lettrage', anouveaux: 'cg-travaux', anouvanalytique: 'cg-travaux', coursapplique: 'cg-cours', caissemodeles: 'cg-caisse', pvcaisse: 'cg-caisse', listeecritures: 'cg', modecr: 'cg', clotannuelle: 'cg-travaux', situation: 'cg-rapprochement', dp: 'financiers', recap: 'drf-param', etatdep: 'drf-trait', budgetconv: 'drf-saisie', modfisc2: 'drf-param', regul: 'drf-trait', rapco: 'drf-trait', pad: 'pb-racine', soemodel: 'drf-param', modfisc: 'fisc-param', typetaxe: 'fisc-param', listing: 'pers-param', listing2: 'pers-param', listedit: 'pers-edit', passation: 'contrats-param', typemarche: 'contrats-param', fichecontrat: 'contrats-saisie', reliquats: 'contrats-saisie', immolist: 'immo-saisies', reassign: 'immo-saisies', suivicontrats: 'contrats-suivi', detailcontrat: 'contrats-suivi', recapexec: 'pers-edit', listingdes: 'pers-param', fisctrait: 'etats-fiscale', fiscannul: 'etats-fiscale', designer: 'fisc-param', designer2: 'fisc-param', procfin: 'financiers', ecritures: 'cg', ecritures_ent: 'cg', balance: 'etats-general', balaux: 'etats-general', echeancier: 'etats-general', glaux: 'etats-general', glg: 'etats-general', balana: 'etats-analytique', glana: 'etats-analytique', detmvt: 'etats-analytique', bilparam: 'ef-bil', biledit: 'ef-bil', crparam: 'ef-cr', cred: 'ef-cr', erparam: 'ef-er', ered: 'ef-er', tftparam: 'ef-tft', tfted: 'ef-tft' };
  // Module (et sous-menu de la sidebar) de chaque écran
  var SAME = { designer: 'modfisc', designer2: 'modfisc', listingdes: 'listing' };
  var PARENT = { 'gpc': 'gplans', 'drf-param': 'drf', 'drf-saisie': 'drf', 'drf-suivi': 'drf', 'drf-rfi': 'drf', 'fisc-param': 'etats-fiscale', 'pers-param': 'etats-personnalises', 'pers-edit': 'etats-personnalises' };
  var MODULE = { journal: 'etats-comptables', lieuaffect: 'immobilisations', collabresp: 'immobilisations', famimmo: 'immobilisations', dashboard: 'tableau-de-bord', tchat: 'tchat', histdem: 'projets-bailleurs', gavisuivi: 'projets-bailleurs', gavisynth: 'projets-bailleurs', gavisynthparam: 'projets-bailleurs', gavirapport: 'projets-bailleurs', badprog: 'projets-bailleurs', gavirecap: 'projets-bailleurs', rsfer: 'projets-bailleurs', rsfuf: 'projets-bailleurs', rsfsb: 'projets-bailleurs', aicompta: 'softaccounting-ai', aifin: 'softaccounting-ai', aifonc: 'softaccounting-ai', recap: 'projets-bailleurs', etatdep: 'projets-bailleurs', budgetconv: 'projets-bailleurs', rfimodeles: 'projets-bailleurs', rfiparam: 'projets-bailleurs', rfiedit: 'projets-bailleurs', modfisc2: 'projets-bailleurs', regul: 'projets-bailleurs', rapco: 'projets-bailleurs', pad: 'projets-bailleurs', soemodel: 'projets-bailleurs', modfisc: 'etats-comptables', typetaxe: 'etats-comptables', listing: 'etats-comptables', listing2: 'etats-comptables', listedit: 'etats-comptables', passation: 'contrats', typemarche: 'contrats', fichecontrat: 'contrats', reliquats: 'contrats', immolist: 'immobilisations', reassign: 'immobilisations', suivicontrats: 'contrats', detailcontrat: 'contrats', recapexec: 'etats-comptables', listingdes: 'etats-comptables', fisctrait: 'etats-comptables', fiscannul: 'etats-comptables', designer: 'etats-comptables', designer2: 'etats-comptables', ecritures: 'compta-generale', ecritures_ent: 'compta-generale', rapprochement: 'compta-generale', pointage: 'compta-generale', releves: 'compta-generale', clotper: 'compta-generale', clotmens: 'compta-generale', lettparam: 'compta-generale', circparam: 'compta-generale', circtrait: 'compta-generale', cours: 'compta-generale', conversion: 'compta-generale', caissetypes: 'compta-generale', caissesaisie: 'compta-generale', caissegen: 'compta-generale', lettmanuel: 'compta-generale', prelettrage: 'compta-generale', anouveaux: 'compta-generale', anouvanalytique: 'compta-generale', coursapplique: 'compta-generale', caissemodeles: 'compta-generale', pvcaisse: 'compta-generale', listeecritures: 'compta-generale', modecr: 'compta-generale', clotannuelle: 'compta-generale', situation: 'compta-generale', balance: 'etats-comptables', balaux: 'etats-comptables', echeancier: 'etats-comptables', glaux: 'etats-comptables', glg: 'etats-comptables', balana: 'etats-comptables', glana: 'etats-comptables', detmvt: 'etats-comptables', bilparam: 'etats-financiers', biledit: 'etats-financiers', crparam: 'etats-financiers', cred: 'etats-financiers', erparam: 'etats-financiers', ered: 'etats-financiers', tftparam: 'etats-financiers', tfted: 'etats-financiers' };
  var LEVELS = ['softaccounting-ai', 'projets-bailleurs','parametrages', 'compta-generale', 'etats-comptables', 'contrats', 'etats-financiers', 'immobilisations'];
  function moduleOf(screen) { return MODULE[screen] || 'parametrages'; }
  var TAB_ON = ['border-[#3e97ff]', 'text-[#3e97ff]'], TAB_OFF = ['border-transparent', 'text-[#888780]'];
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  function setGroup(group, open) {
    $$('[data-group="' + group + '"]').forEach(function (a) { a.style.display = open ? '' : 'none'; });
    $$('[data-group-toggle="' + group + '"]').forEach(function (sb) {
      sb.setAttribute('aria-expanded', open);
      var svg = sb.querySelector('svg');
      if (svg) svg.style.transform = 'rotate(' + (open ? 180 : 0) + 'deg)';
    });
  }
  function showTab(id) {
    $$('[data-tab]').forEach(function (b) {
      var on = b.dataset.tab === id;
      b.classList.remove.apply(b.classList, on ? TAB_OFF : TAB_ON);
      b.classList.add.apply(b.classList, on ? TAB_ON : TAB_OFF);
      b.setAttribute('aria-selected', on);
    });
    $$('[data-tab-panel]').forEach(function (p) { p.style.display = p.dataset.tabPanel === id ? '' : 'none'; });
  }
  // Procédures financières activées (Administration de l'entité › Personnalisation) et procédure courante du menu Projets & Bailleurs
  function procsActives() { var o = window.ENTITE_OPTIONS && window.ENTITE_OPTIONS.procedures; var l = ['IDA', 'FIDA', 'FED', 'FM', 'BAD', 'GAVI']; return o ? l.filter(function (p) { return o[p]; }) : ['IDA', 'FIDA']; }
  function procCourante() { var a = procsActives(); return a.indexOf(window.__proc) >= 0 ? window.__proc : (a[0] || 'IDA'); }
  function grp(e) { var g = GROUP[e]; return ['drf-param', 'drf-saisie', 'drf-trait', 'drf-suivi', 'drf-rfi'].indexOf(g) >= 0 ? g + '-' + procCourante() : g; }
  function par(g) { var k = ['drf-param-', 'drf-saisie-', 'drf-trait-', 'drf-suivi-', 'drf-rfi-'].filter(function (x) { return g && g.indexOf(x) === 0; })[0]; return k ? 'drf-' + g.slice(k.length) : PARENT[g]; }
  try { window.__proc = sessionStorage.getItem('softcompta.proc') || window.__proc; } catch (x) {}
  document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('[data-proc]'); if (a) { window.__proc = a.dataset.proc; try { sessionStorage.setItem('softcompta.proc', a.dataset.proc); } catch (x) {} } }, true);
  window.addEventListener('entite-options-changed', function () { route(); });
  var premier = true;
  function route() {
    var h = location.hash.slice(1);
    var screen = !h ? 'dashboard' : (TITLES.hasOwnProperty(h) && h !== 'entite' ? h : 'entite');   // à l'ouverture de la maquette (sans écran choisi) : le Tableau de bord
    var eff = ((screen === 'designer' || screen === 'designer2') && (window.__designerFrom === 'modfisc2' || window.__designerFrom === 'soemodel' || window.__designerFrom === 'recap' || window.__designerFrom === 'listing2' || window.__designerFrom === 'rfimodeles')) ? window.__designerFrom : screen;
    var ecran = screen === 'ecritures_ent' ? 'ecritures' : screen === 'rsfer' ? 'erparam' : screen;   // RSF › Tableau emplois ressources reprend la fenêtre États financiers › Emplois et ressources › Paramétrages   // la saisie « Entreprise » reprend l'écran de saisie d'écritures (variante repérée par data-variante)
    if (screen === 'ecritures_ent') document.body.setAttribute('data-variante', 'entreprise'); else document.body.removeAttribute('data-variante');
    $$('[data-screen]').forEach(function (s) { s.style.display = s.dataset.screen === ecran ? '' : 'none'; });
    $$('[data-crumb]').forEach(function (c) { c.style.display = c.dataset.crumb === (eff === 'rfimodeles' && screen !== 'rfimodeles' ? 'rfides' : (SAME[eff] || eff)) ? '' : 'none'; });
    $$('[data-crumb] a').forEach(function (a) { if (a.hasAttribute('data-crumb-proc') || a.textContent.trim() === 'Procédure financière') { a.setAttribute('data-crumb-proc', ''); a.textContent = ' ' + (/^rfi/.test(a.closest('[data-crumb]').dataset.crumb) ? 'FIDA' : a.closest('[data-crumb]').dataset.crumb === 'badprog' ? 'BAD' : procCourante()) + ' '; } });
    $$('[data-nav]').forEach(function (a) { a.classList.toggle('sidebar-active', a.dataset.nav === (SAME[eff] || ({ pointage: 'releves', biledit: 'bilparam', cred: 'crparam', ered: 'erparam', tfted: 'tftparam', gavisynthparam: 'gavisynth' }[eff] || eff))); });
    $$('[data-group-toggle]').forEach(function (sb) {
      var on = sb.dataset.groupToggle === grp(eff);
      sb.classList.toggle('sidebar-active', on);
      var b = sb.querySelector('button'); if (b) b.classList.toggle('sidebar-active', on);
    });
    // à l'ouverture de la maquette, tous les groupes du menu sont repliés ; ensuite la navigation ouvre le groupe de l'écran
    // à l'ouverture (ou à l'actualisation) le menu se déploie suivant le fil d'Ariane de l'écran affiché ; sans écran choisi (accueil), tous les groupes sont repliés
    if (premier) { $$('[data-group-toggle]').forEach(function (sb) { setGroup(sb.dataset.groupToggle, false); }); }
    if (!premier || location.hash.length > 1) { var g = grp(eff); if (par(g)) setGroup(par(g), true); setGroup(g, true); }
    premier = false;
    showLevel(eff === 'dashboard' || eff === 'tchat' ? 'root' : moduleOf(eff));
    window.__moduleCourant = moduleOf(eff);
    $$('[data-module]').forEach(function (m) { m.classList.toggle('sidebar-active', m.dataset.module === moduleOf(eff)); });
    if (screen === 'entite') showTab(document.querySelector('[data-tab="' + h + '"]') ? h : 'infos');
    document.title = 'SoftCompta — ' + TITLES[screen];
    var sc = document.querySelector('.softcompta-content-scroll'); if (sc) sc.scrollTop = 0;
  }

  $$('[data-tab]').forEach(function (b) {
    b.addEventListener('click', function () { location.hash = b.dataset.tab; });
  });
  $$('[data-group-toggle]').forEach(function (sb) {
    sb.addEventListener('click', function () {
      setGroup(sb.dataset.groupToggle, sb.getAttribute('aria-expanded') !== 'true');
    });
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href="#"]');
    if (a) e.preventDefault();
  });
  // Sidebar : niveau « modules principaux » ou sous-menu « Paramétrages »
  function showLevel(level) {
    $$('[data-sidebar-level]').forEach(function (l) { l.style.display = l.dataset.sidebarLevel === level ? '' : 'none'; });
  }
  // Un module ayant des écrans dans la maquette ouvre son sous-menu
  $$('[data-module]').forEach(function (m) {
    m.addEventListener('click', function () {
      if (m.dataset.module === window.__moduleCourant && m.classList.contains('sidebar-active')) { location.reload(); return; }   // re-clic sur le module en cours : réactualise
      if (m.dataset.module === 'tableau-de-bord') { location.hash = '#dashboard'; return; }
      if (LEVELS.indexOf(m.dataset.module) >= 0) showLevel(m.dataset.module);
    });
  });
  $$('[data-sidebar-back]').forEach(function (b) {
    b.addEventListener('click', function () { showLevel('root'); });
  });
  // re-clic sur l'écran en cours dans la sidebar : réactualise la page
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('aside [data-nav]');
    if (a && a.getAttribute('href') && a.getAttribute('href') !== '#' && a.getAttribute('href') === location.hash) { e.preventDefault(); location.reload(); }
  }, true);
  window.addEventListener('hashchange', route);
  route();
})();
</script>`;
// Le remplacement passe par une fonction : un « $ » dans le JS ne doit pas être interprété
const _du = (f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
const masqueJs = 'window.__MASQUE={logo:' + JSON.stringify(_du('ecrans/masque/logo.png')) + ',qr:' + JSON.stringify(_du('ecrans/masque/qr.png')) + ',pied:' + JSON.stringify(_du('ecrans/masque/pied.png')) + '};' + String.fromCharCode(10) + read('ecrans/masque/masque.js');
out = out.replace(/(<a aria-label="Tchat"[^>]*?)href="#"/, (m, d) => d + 'href="#tchat" data-nav="tchat"');
out = out.replace(/<body[^>]*>/, (m) => m + '<script>' + read('ecrans/panneau_proprietes.js') + '</script><script>' + read('ecrans/champs_dynamiques.js') + '</script>');
out = out.replace('</body>', () => '<script>' + masqueJs + '</script>' + script + '<script>\n' + dpJs + '</script><script>\n' + exercicesJs + '</script><script>' + String.fromCharCode(10) + tiersJs + '</script><script>' + String.fromCharCode(10) + read('ecrans/plans_pc.js') + '</script><script>' + String.fromCharCode(10) + ecrituresJs + '</script><script>' + String.fromCharCode(10) + balanceJs + '</script><script>' + String.fromCharCode(10) + balanceAnaJs + '</script><script>' + String.fromCharCode(10) + balanceAuxJs + '</script><script>' + String.fromCharCode(10) + glgJs + '</script><script>' + String.fromCharCode(10) + read('ecrans/echeancier.js') + '</script><script>' + String.fromCharCode(10) + read('ecrans/balance_detail.js') + '</script><script>' + String.fromCharCode(10) + read('ecrans/grand_livre_auxiliaire.js') + '</script><script>' + String.fromCharCode(10) + read('ecrans/etats_modale.js') + '</script><script>' + String.fromCharCode(10) + read('ecrans/etats_boutons.js') + '</script><script>' + String.fromCharCode(10) + read('ecrans/charte_titres.js') + '</script><script>' + String.fromCharCode(10) + read('ecrans/etats_ui.js') + '</script><script>' + String.fromCharCode(10) + read('ecrans/edition_ui.js') + '</script><script>' + String.fromCharCode(10) + read('ecrans/combo_plans.js') + '</script><script>' + String.fromCharCode(10) + read('ecrans/barre_actions.js') + String.fromCharCode(10) + read('ecrans/import_assistant.js') + String.fromCharCode(10) + read('ecrans/modale_alerte.js') + String.fromCharCode(10) + read('ecrans/epayment.js') + String.fromCharCode(10) + read('ecrans/produits.js') + String.fromCharCode(10) + read('ecrans/assistant_aide.js') + String.fromCharCode(10) + read('ecrans/assistant_recherche.js') + String.fromCharCode(10) + read('ecrans/assistant.js') + String.fromCharCode(10) + read('ecrans/tableaux.js') + String.fromCharCode(10) + read('ecrans/pagination.js') + String.fromCharCode(10) + read('ecrans/popup_modal.js') + '</script></body>');


// 7. Charte graphique Softwell v1.0 : teintes de marque -> marine, polices Outfit + Inter, couche de thème
{
  const MAP = {
    // bleus, verts et turquoises de marque -> échelle marine (navy-50 ... navy-950)
    '#3e97ff': '#2E427B', '#2f80c1': '#2E427B', '#185fa5': '#2E427B', '#2563eb': '#2E427B', '#1264e8': '#2E427B', '#1d4ed8': '#243569', '#1e40af': '#243569', '#3b82f6': '#5F77B9',
    '#0c447c': '#243569', '#0c4a6e': '#18244F', '#243765': '#18244F', '#10143f': '#0B1332', '#090b37': '#0B1332',
    '#0f766e': '#2E427B', '#0f7b6c': '#2E427B', '#0a5a50': '#243569', '#115e59': '#243569', '#0e3b3a': '#18244F', '#0a3925': '#18244F',
    '#00875a': '#2E427B', '#00764f': '#243569', '#006644': '#18244F', '#059669': '#2E427B',
    '#3b6bff': '#2E427B', '#6c5ce7': '#2E427B', '#5b35e6': '#2E427B', '#6045f3': '#243569', '#7c3aed': '#2E427B', '#6d28d9': '#243569',
    '#eff6ff': '#F4F7FE', '#dbeafe': '#E3EBFE', '#e6f1fb': '#E3EBFE', '#bfdbfe': '#CAD9FB', '#93c5fd': '#A9BDEE', '#f4f6fa': '#F4F7FE',
    '#4a90d9': '#E1C340', '#38bdf8': '#E1C340',
    // neutres : gris chauds / ardoise -> neutres teintés marine (§4.2)
    '#2c2c2a': '#353944', '#888780': '#5B606D', '#b4b2a9': '#747A88', '#edf1f5': '#E9EBF0', '#d3d1c7': '#D6D9E0', '#e3ddd0': '#D6D9E0', '#f1f0ec': '#E9EBF0', '#fafaf9': '#F5F7F9', '#f8fafc': '#F5F7F9', '#f9fafb': '#F5F7F9',
    '#64748b': '#5B606D', '#475569': '#474C58', '#334155': '#353944', '#1e293b': '#0B1332', '#0f172a': '#0B1332', '#94a3b8': '#747A88', '#cbd5e1': '#B9BEC8', '#e2e8f0': '#E9EBF0', '#4b5675': '#474C58', '#697097': '#5B606D', '#6b7280': '#5B606D', '#374151': '#353944'
  };
  const ANCIEN = !!process.env.ANCIENNES_COULEURS;
  if (!ANCIEN) out = out.replace(/#[0-9a-fA-F]{6}\b/g, (m) => MAP[m.toLowerCase()] || m);
  // Couleurs hors palette (hors statuts vert / rouge / ambre) -> jeton le plus proche de la charte (§4, §12.2)
  if (!ANCIEN) {
    const PAL = new Set(('F4F7FE E3EBFE CAD9FB A9BDEE 819AD6 5F77B9 455D9C 2E427B 243569 18244F 0B1332 F9F8E7 F0EDD0 E0DBAD E1C340 AA9E39 8B7B02 706000 594B02 F5F7F9 E9EBF0 D6D9E0 B9BEC8 969BA8 747A88 5B606D 474C58 353944 242830 878D9A FFFFFF 000000 BC9C22 AEB091 575D8F ECFDF5 047857 A7F3D0 FFF1F2 BE123C FECDD3 FFFBEB B45309 FDE68A DC2626 B91C1C 177C52 EDFBF2 B63132 FEF4F3').split(' '));
    const NEU = [[.97, 'F5F7F9'], [.93, 'E9EBF0'], [.86, 'D6D9E0'], [.75, 'B9BEC8'], [.6, '747A88'], [.45, '5B606D'], [.32, '474C58'], [.2, '353944'], [.12, '242830'], [0, '0B1332']];
    const NAV = [[.94, 'F4F7FE'], [.88, 'E3EBFE'], [.8, 'CAD9FB'], [.65, 'A9BDEE'], [.5, '5F77B9'], [.32, '2E427B'], [.2, '243569'], [0, '18244F']];
    const pick = (t, l) => '#' + t.find((x) => l >= x[0])[1];
    out = out.replace(/#[0-9a-fA-F]{6}\b/g, (m) => {
      const k = m.slice(1).toUpperCase(); if (PAL.has(k)) return m;
      const r = parseInt(k.slice(0, 2), 16) / 255, g = parseInt(k.slice(2, 4), 16) / 255, bl = parseInt(k.slice(4, 6), 16) / 255;
      const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl), l = (mx + mn) / 2, d = mx - mn;
      const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
      let h = 0; if (d) { h = mx === r ? ((g - bl) / d) % 6 : mx === g ? (bl - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; }
      if (s < .18) return pick(NEU, l);
      if (h >= 170 && h <= 290) return pick(NAV, l);
      if (h >= 15 && h <= 70 && s < .45 && l > .85) return pick(NEU, l);
      return m;
    });
    // Mêmes règles pour les couleurs écrites en rgb(r g b) / rgb(r, g, b) (Tailwind compilé des captures)
    out = out.replace(/rgba?\((\d{1,3})(,\s*|\s+)(\d{1,3})(,\s*|\s+)(\d{1,3})/g, (m, R, s1, G, s2, B) => {
      const hx = [R, G, B].map((n) => (+n).toString(16).padStart(2, '0')).join('').toUpperCase();
      const mapped = '#' + hx; const res = mapped.replace(/#[0-9a-fA-F]{6}\b/, (q) => {
        const k = q.slice(1); if (PAL.has(k)) return q;
        const r = +R / 255, g = +G / 255, bl = +B / 255;
        const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl), l = (mx + mn) / 2, d = mx - mn;
        const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
        let h = 0; if (d) { h = mx === r ? ((g - bl) / d) % 6 : mx === g ? (bl - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; }
        if (s < .18) return pick(NEU, l);
        if (h >= 170 && h <= 290) return pick(NAV, l);
        if (h >= 15 && h <= 70 && s < .45 && l > .85) return pick(NEU, l);
        return q;
      });
      if (res === mapped) return m;
      const v = [0, 2, 4].map((i) => parseInt(res.slice(1 + i, 3 + i), 16));
      return m.slice(0, m.indexOf('(') + 1) + v[0] + s1 + v[1] + s2 + v[2];
    });
  }
  if (!ANCIEN) out = out.replace('--sidebar-bg:rgb(26, 38, 52)', '--sidebar-bg:#18244F').replace('--sidebar-bg: rgb(26, 38, 52)', ANCIEN ? '--sidebar-bg: rgb(26, 38, 52)' : '--sidebar-bg: #18244F');
  out = out.split('margin-left: 236px').join('margin-left: 256px');
  const FONTS_OLD = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400..900;1,400..900&family=Outfit:wght@500..900&display=swap">';
  // Charte (écarts) : polices hébergées avec la maquette (§5.1), plus aucune police hors charte
  out = out.replace(/<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>/g, '');
  {
    const ff = (n, f, w) => "@font-face{font-family:'" + n + "';font-style:normal;font-weight:" + w + ";font-display:swap;src:url(data:font/ttf;base64," + fs.readFileSync('ecrans/polices/' + f + '.ttf').toString('base64') + ") format('truetype')}";
    const css = [['Inter', 'inter400', 400], ['Inter', 'inter500', 500], ['Inter', 'inter600', 600], ['Inter', 'inter700', 700], ['Outfit', 'outfit600', 600], ['Outfit', 'outfit700', 700]].map((a) => ff(a[0], a[1], a[2])).join('');
    out = out.replace('</head>', () => '<style id="polices-charte">' + css + '</style></head>');
  }
  out = out.replace(/font-family\s*:\s*[^;}"]*?(Plus Jakarta Sans|Fraunces|Space Grotesk|IBM Plex Mono|ui-monospace|monospace|Courier)[^;}"]*/gi, 'font-family:var(--font-sans);font-variant-numeric:tabular-nums');
  out = out.replace(/font-family\s*:\s*"(IBM Plex Mono|Plus Jakarta Sans|Fraunces|Space Grotesk)"[^;}]*/g, 'font-family:var(--font-sans)');
  // taille minimale 12 px (§5.3)
  out = out.replace(/font-size\s*:\s*(\d+(?:\.\d+)?)px/g, (m, v) => +v < 12 ? 'font-size:12px' : m);
  out = out.split('Sauvegarder').join('Enregistrer');
  // Charte §6 : dimensions et espacements
  {
    const px = (s, f) => s.replace(/(-?\d+(?:\.\d+)?)px\b/g, (m, v) => { const r = f(+v); return r === +v ? m : r + 'px'; });
    const RAD = { 3: 4, 5: 6, 7: 8, 9: 8, 10: 8, 11: 12, 13: 12, 14: 12, 15: 16, 18: 16, 20: 16, 24: 16 };
    out = out.replace(/(border(?:-(?:top|bottom)-(?:left|right))?-radius\s*:\s*)([^;}"]+)/g, (m, p, v) => p + px(v, (n) => RAD[n] || n)); // §6.4
    out = out.replace(/((?<![\w])(?:box-shadow|--[\w-]*shadow[\w-]*)\s*:\s*)([^;}"]+)/g, (m, p, v) => p + v.replace(/#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?(?![0-9a-fA-F])/g, (q, c, al) => Math.max(parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)) < 110 ? '#0B1332' + (al || '') : q).replace(/rgba?\((\d+)([,\s]+)(\d+)([,\s]+)(\d+)/g, (q, R, s1, G, s2, B) => Math.max(+R, +G, +B) < 110 ? 'rgba(11,19,50' : q)); // §6.5 ombres teintées marine
    const sp = (n) => { const x = Math.abs(n), sg = n < 0 ? -1 : 1; if (x <= 2 || x === 6 || x === 10 || x === 14 || x % 4 === 0) return n; return sg * (Math.round(x / 4) * 4 || 4); };
    out = out.replace(/((?<![-\w])(?:padding|margin|gap|row-gap|column-gap)(?:-(?:top|right|bottom|left|inline|block))?\s*:\s*)([^;}"]+)/g, (m, p, v) => p + px(v, sp)); // §6.1 grille de 4 px
    out = out.replace(/z-index\s*:\s*(\d{3,})/g, (m, v) => +v > 70 ? 'z-index:50' : m); // §6.7
    out = out.replace(/((?<![-\w])transition(?:-duration)?\s*:\s*)([^;}"]+)/g, (m, p, v) => p + v.replace(/(\d*\.?\d+)(ms|s)\b/g, (q, n, u) => { const ms = u === 's' ? +n * 1000 : +n; if (ms <= 0.5) return q; return (ms <= 140 ? 120 : ms <= 240 ? 200 : 280) + 'ms'; })); // §6.8
  }
  out = out.split('@page{size:landscape}').join('');   // l'impression est toujours en A4 portrait (règle @page dans charte.css)
  { const i = out.lastIndexOf('</bo' + 'dy>'); out = out.slice(0, i) + '<style id="charte-softwell">' + (() => {
    let c = read('ecrans/charte.css') + '\n' + read('ecrans/ecritures_disposition.css');
    // Connexion + portail SoftAppli affichés avant l'entrée dans SoftAccounting (page autonome isolée dans un iframe plein écran)
{
  const b64 = Buffer.from(read('ecrans/portail.html'), 'utf8').toString('base64');
  const bloc = '<script>(function(){var bin=atob("' + b64 + '"),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);';
  const bloc2 = 'var html=new TextDecoder("utf-8").decode(u),nom="";';
  const bloc3 = 'function ouvrir(direct){var f=document.getElementById("sc-portail");if(f)f.remove();f=document.createElement("iframe");f.id="sc-portail";f.title="Connexion et portail SoftAppli";f.style.cssText="position:fixed;inset:0;width:100%;height:100%;border:0;z-index:2147483000;background:#fff";window.SC_ETAT={direct:!!direct,nom:nom};f.srcdoc=html;document.body.appendChild(f);document.documentElement.style.overflow="hidden";}';
  const bloc4 = 'window.SC_PORTAIL={ouvrir:function(){ouvrir(true);}};document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest(".topbar-logout-button");if(!b)return;e.preventDefault();e.stopPropagation();nom="";try{sessionStorage.removeItem("sc_session");}catch(x){}ouvrir(false);},true);window.SC_ENTRER=function(n,p){if(n)nom=n;try{sessionStorage.setItem("sc_session",nom||"1");}catch(x){}if(p&&window.PRODUIT_API)window.PRODUIT_API.appliquer(p==="entreprise"?"entreprise":"accounting",true);var f=document.getElementById("sc-portail");if(f)f.remove();document.documentElement.style.overflow="";};';
  const bloc5 = 'window.addEventListener("message",function(e){if(e.data&&e.data.softappli==="entrer"){if(e.data.nom)nom=e.data.nom;try{sessionStorage.setItem("sc_session",nom||"1");}catch(x){}if(e.data.produit&&window.PRODUIT_API)window.PRODUIT_API.appliquer(e.data.produit==="entreprise"?"entreprise":"accounting",true);var f=document.getElementById("sc-portail");if(f)f.remove();document.documentElement.style.overflow="";}if(e.data&&e.data.softappli==="sortie"){nom="";try{sessionStorage.removeItem("sc_session");}catch(x){}}});var s0=null;try{s0=sessionStorage.getItem("sc_session");}catch(x){}if(s0){nom=s0==="1"?"":s0;}else ouvrir(false);})();</script>';
  const blocTotal = bloc + bloc2 + bloc3 + bloc4 + bloc5;
  out = out.slice(0, out.lastIndexOf("</body>")) + blocTotal + out.slice(out.lastIndexOf("</body>"));
}
if (process.env.ANCIENNE_SIDEBAR) {
      // Copie « barre latérale d'origine » : on retire les règles de COULEUR de la charte sur la barre latérale (elles écrasaient,
      // avec !important, les couleurs d'origine : texte blanc, fond translucide, trait actif). La géométrie (largeur, repli) reste.
      c = c.replace('--sidebar-bg:#18244F;--sidebar-border:rgba(255,255,255,.10);--sidebar-active-bg:rgba(255,255,255,.08);--sidebar-active-color:#E1C340;--sidebar-text-child:rgba(255,255,255,.75);', '');
      c = c.split('\n').filter((l) => !/^\.sidebar-shell \.sidebar-active|^\.sidebar-shell \.sidebar-child-item|^\.sidebar-shell \.sidebar-app-desc|^\.sidebar-shell :focus-visible/.test(l)).join('\n');
      c = c.replace('.sidebar-shell,aside.sidebar-shell{background:#18244F!important;width:256px!important}', '.sidebar-shell,aside.sidebar-shell{width:256px!important}');
    }
    return c;
  })() + '</style>' + out.slice(i); }
}

// Projet actif affiché dans la maquette (barre du haut, tableau de bord, écrans qui le citent)
out = out.split('COMPTA HASINA').join('DATA LIGHT');
if (process.env.ANCIENNE_SIDEBAR) {
  // Démo temporaire : couleurs de la charte partout, sauf la barre latérale qui reprend ses couleurs d'origine.
  // Seules les déclarations des règles dont le sélecteur concerne la barre latérale (et les variables --sidebar-*) sont ramenées.
  const HEX = { '#18244F': '#1a2634', '#0B1332': '#0f172a', '#E1C340': '#4a90d9', '#5F77B9': '#4a90d9', '#2E427B': '#2f80c1', '#243569': '#12325c',
    '#E3EBFE': '#dce4eb', '#CAD9FB': '#c2d2e8', '#A9BDEE': '#94b0d2', '#F4F7FE': '#eff6ff' };
  const RGBA = [[/rgba\(95, ?119, ?185/g, 'rgba(74, 144, 217'], [/rgba\(202, ?217, ?251/g, 'rgba(194, 210, 232'], [/rgba\(169, ?189, ?238/g, 'rgba(148, 176, 210'], [/rgb\(24, ?36, ?79\)/g, 'rgb(26, 38, 52)']];
  const retour = (d) => { d = d.replace(/#[0-9a-fA-F]{6}\b/g, (m) => HEX[m.toUpperCase()] || m); RGBA.forEach(([re, v]) => { d = d.replace(re, v); }); return d; };
  let n = 0;
  out = out.replace(/<style[^>]*>([\s\S]*?)<\/style>/g, (m, css) => m.replace(css, () => css.replace(/([^{}]+)\{([^{}]*)\}/g, (r, sel, decl) => {
    const side = /sidebar|\[data-module\]|data-sidebar|sb-reduit/i.test(sel);
    const nd = decl.replace(/(--sidebar[\w-]*\s*:\s*)([^;]+)/g, (q, p, v) => { n++; return p + retour(v); });
    if (!side) return sel + '{' + nd + '}';
    n++; return sel + '{' + retour(nd) + '}';
  })));
  fs.writeFileSync('SoftCompta_Administration_entite_sidebar_ancienne.html', out);
  console.log('Copie « barre latérale d\'origine » écrite (' + n + ' déclarations)');
} else if (process.env.ANCIENNES_COULEURS) {
  const REV = { '#2E427B': '#2f80c1', '#243569': '#185fa5', '#18244F': '#243765', '#0B1332': '#10143f', '#5F77B9': '#3b82f6',
    '#F4F7FE': '#eff6ff', '#E3EBFE': '#e6f1fb', '#CAD9FB': '#bfdbfe', '#A9BDEE': '#93c5fd',
    '#353944': '#2c2c2a', '#5B606D': '#888780', '#E9EBF0': '#edf1f5', '#D6D9E0': '#d3d1c7', '#F5F7F9': '#fafaf9' };
  out = out.replace(/#[0-9a-fA-F]{6}\b/g, (m) => REV[m.toUpperCase()] || m);
  out = out.replace(/rgba\(11, ?19, ?50/g, 'rgba(16,20,63');
  fs.writeFileSync('SoftCompta_Administration_entite_anciennes_couleurs.html', out);
  console.log('Copie « anciennes couleurs » écrite');
} else if (PUBLICATION) {
  fs.writeFileSync('SoftCompta_Administration_entite_publication.html', out);
  console.log('Version de publication écrite (tiers anonymisés)');
} else {
fs.writeFileSync('SoftCompta_Administration_entite.html', out);
}
console.log('Styles ajoutés :', extra.length, '| taille :', out.length);
