# Passation — Maquette SoftCompta (Comptabilité Projets & Bailleurs)

Dernière mise à jour : 26/10/2026. Dernier commit publié : voir `git log` (barre d actions de page généralisée).

## 0. Cycle de travail à deux (à suivre dans cet ordre)

Dépôt de référence : **`https://github.com/cisgsoftappli-rgb/maquette-SoftAccounting`**, branche `main` (remote `origin`). L'ancien dépôt `michael-art-5/softcompta-maquette` (remote `ancien-michael`) n'est plus alimenté.

1. **Prendre la main** — annoncer à son binôme qu'on reprend la maquette ; ne travailler qu'à un seul à la fois. Toujours partir de la dernière version publiée (étape 4 avant toute modification).
2. **Installer en local** (première fois seulement) :
   ```bash
   git clone https://github.com/cisgsoftappli-rgb/maquette-SoftAccounting.git deploy
   ```
   Le compte GitHub utilisé doit être `cisgsoftappli-rgb` (ou un collaborateur du dépôt) ; sinon l'envoi échoue en 403. Prérequis : Git et Node.js. Le dossier de travail `C:\Artefact` (sources) est décrit au §2.
3. **Maj maquette** — faire les évolutions dans les sources (`ecrans/`, `css/`, `build.cjs`), puis `node build.cjs`, contrôle de syntaxe (`40 0`, §3) et vérification dans le navigateur (`node serve.cjs`, port 4322). Ne jamais éditer `SoftCompta_Administration_entite.html` à la main.
4. **Reprise dernière main** — juste avant de publier, récupérer ce que le binôme a envoyé :
   ```bash
   cd C:\Artefact\deploy
   git pull --rebase origin main
   ```
   En cas de conflit sur `index.html` : ne pas le fusionner à la main, refaire `node build.cjs` à partir des sources à jour, recopier le fichier généré dans `deploy/index.html`, puis `git add index.html` et `git rebase --continue`.
5. **Push** (uniquement sur demande « push ») :
   ```bash
   cp ../SoftCompta_Administration_entite.html index.html
   git add -A
   git commit -m "message clair de l'évolution"
   git push origin main
   ```
   Puis prévenir le binôme (« main rendue ») et mettre à jour ce fichier (§9 et date ci-dessus).

> **Attention — limite actuelle** : le dépôt `deploy/` ne contient que `index.html` (la maquette générée) et `README.md`. Les **sources** (`ecrans/`, `css/`, `build.cjs`, `serve.cjs`, ce fichier) ne sont **pas versionnées** ; elles n'existent que sur le poste de celui qui a construit la maquette. Tant qu'elles ne sont pas partagées (dépôt de sources, ou archive du dossier `C:\Artefact`), le binôme ne peut que consulter `index.html` ou le modifier directement, et les deux postes risquent de diverger. À décider ensemble : versionner les sources dans un second dépôt ou un sous-dossier `sources/`.

## 1. Principe

La maquette est une **page HTML statique unique**, générée par script. Elle reproduit des captures du DOM Angular de SoftCompta (écrans collés par le client), puis reçoit des évolutions fonctionnelles demandées au fil de l'eau. Les données sont en mémoire (rien n'est persisté) ; les règles métier sont simulées.

> **Ne jamais modifier à la main `SoftCompta_Administration_entite.html`** : c'est le fichier généré, il est écrasé à chaque build.

## 2. Structure du dossier

| Élément | Rôle |
|---|---|
| `SoftCompta_HTML_assemble.html` | Coquille de base (en-tête, menu latéral, styles, routeur). |
| `css/` | Captures d'origine (`capture_N_*.html`), `global.css`, logo. Écrans Administration, Plans, Saisie des plans, Exercices, Écritures, Tiers, Balances. |
| `ecrans/` | Un fichier par écran « conçu » (HTML + `<style>` préfixé + script). Voir §4. |
| `ecrans/masque/` | Logo, QR et pied de page appliqués aux PDF générés. |
| `build.cjs` | Assemble coquille + captures + écrans → `SoftCompta_Administration_entite.html`. |
| `build.cjs.avant-*` | Sauvegardes anciennes du build (peuvent être supprimées). |
| `serve.cjs` | Petit serveur local (port **4322**) ; config dans `.claude/launch.json` (nom `maquette`). |
| `deploy/` | Dépôt git de publication (`index.html` = copie du fichier généré). |
| `tickets/` | Tickets DP-01, DP-02, DP-03, DP-06, DP-07 (Markdown). |
| `Correspondances_*.doc` | Fichiers de correspondance champs ↔ tables (Modification du mouvement, Édition du mouvement fiscale, SOE 4F). |
| `PASSATION.md` | Ce fichier. |
| `tp-equipe/`, `diamant-shop.html`, `integrer/`, `extract_glg.cjs` | Hors périmètre SoftCompta (TP annexe, essais, extraction ponctuelle). Peuvent être ignorés. |

## 3. Construire, tester, publier

Prérequis : Node.js, aucun paquet npm.

```bash
cd C:\Artefact
node build.cjs                # génère SoftCompta_Administration_entite.html
node serve.cjs                # http://localhost:4322/#histdem (ou autre ancre)
```

Contrôle de syntaxe après build (doit afficher `40 0`, soit 40 scripts et 0 erreur) :

```bash
node -e "const s=require('fs').readFileSync('SoftCompta_Administration_entite.html','utf8');let bad=0,n=0;const re=/<script>([\s\S]*?)<\/script>/g;let m;while(m=re.exec(s)){n++;try{new Function(m[1])}catch(e){bad++;console.log(e.message)}}console.log(n,bad)"
```

Publication (Render, site statique, dépôt GitHub `cisgsoftappli-rgb/maquette-SoftAccounting`, branche `main`, remote `origin`) — **uniquement sur demande « push »** ; voir le cycle complet au §0 :

```bash
cp SoftCompta_Administration_entite.html deploy/index.html
cd deploy
git add -A
git -c user.name=michael-art-5 -c user.email=cisg.softappli@gmail.com commit -m "message

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git pull --rebase origin main   # reprise de la dernière main avant l'envoi
git push origin main
```

## 4. Écrans et navigation

Routage par ancre (`#id`). Chaque écran vit dans un `<div data-screen="id">`. Dans `build.cjs`, les tables **TITLES / GROUP / PARENT / SAME / MODULE / LEVELS** déclarent titre, groupe de menu, parent, module et niveau de chaque écran ; le fil d'Ariane est dérivé de celui de « Gestion des sélections » (`gsCrumb`). Le menu latéral est construit avec les helpers `groupe / child / inerte / sousGroupe / enfant12`.

Écrans principaux de **Comptabilité Projets & Bailleurs** (`ecrans/`) :

- **Paramétrage** : `procedures_financieres`, `type_marche`, `type_passation`, `type_taxe`, `devis_programme` (+ `dp_filtre.js`), `gestion_selections` (N° paramètre).
- **Modèles / concepteurs d'état** : `modele_soe`, `modele_recapitulatif` / `…2`, `modele_listing`, `modele_etat_drf`, `modele_etat_fiscal` ; `designer_soe`, `designer_listing`, `designer_declaration`. **Duplication de modèle** (Code, Nom, nom du fichier RepX) dans chaque liste et chaque concepteur, via `window.__dupModele` (défini dans `designer_soe.html`) et l'événement `mf-model-dup`.
- **DRF** : `etat_depense` (critères, sélection des mouvements, « Modification du mouvement » en 4 groupes, confection, succès, annulation avec avertissement), `regularisation_drf`.
- **Déclaration fiscale** : `traitement_declaration` (4 étapes, « Édition du mouvement » élargie, mode de déclaration, confirmation, succès, annulation du traitement avec avertissement).
- **Suivi › Historique des demandes** : `historique_demandes` (fenêtre « Filtre » : paramètre, N° de sélection = N° de la demande, période de tri, monnaie, centres *, journaux *, statut ; boutons Filtre / CSV / EXCEL / Imprimer ; tableau d'une ligne par mouvement avec champs de « Modification du mouvement » et imputation analytique).
- **États comptables / général** : balances, grand livre, écritures, tiers, exercices (fichiers `.js` et captures `css/`).

### Données partagées entre écrans (en mémoire)

- `window.__selectionsDRF` : sélections DRF (n°, paramètre, convention, exercice, devise, périodes, centres, journaux, statut). Amorcée dans `etat_depense.html` (5 sélections de démo), mise à jour par « Valider le tri » (statut « En cours ») et par la confection (« Confectionnée ») ; événement `selections-change`. Lue par `historique_demandes.html`.
- `window.__dupModele`, `window.__mfDesigner`, `window.__designerFrom`, `window.__listingModelsList`, `window.__listingSaved`, `window.__recapModelsList2`, `window.__printMask`, `window.__pfProcs`.

## 5. Conventions de développement

- Un écran = un fichier autonome : `<style>` à préfixe unique (ex. `hd-`, `ed-`, `tr-`), script en IIFE qui part de `document.currentScript.parentElement`, aucune dépendance externe.
- Les attributs `data-…` servent de points d'accroche (évite les collisions de classes) ; vérifier l'unicité avant d'ajouter un `data-xx-yyy`.
- Nouvel écran : créer `ecrans/xxx.html`, le lire dans `build.cjs` (`<div data-screen="xxx">`), ajouter ses entrées dans TITLES / GROUP / MODULE (et PARENT / SAME si besoin), l'entrée de menu dans la barre latérale du module, le fil d'Ariane (`data-crumb`).
- Écrire les scripts de modification en `.cjs` via un fichier (pas de heredoc node avec des antislashs) ; avec un heredoc shell, utiliser `<<'EOF'` et vérifier les séquences `\\`.

## 6. Pièges connus

- **Ne jamais écrire `</body>` (ni `</script>`) en clair dans une chaîne de script** : cela coupe le build (le nombre de scripts passe de 34 à 33). Écrire `'</bo'+'dy>'` ou `<\/body>`.
- Les antislashs sont perdus dans les regex/chaînes passées via heredoc node : préférer l'outil d'édition ou `String.fromCharCode(92)`.
- Les chaînes avec apostrophe dans du JS en simples quotes : utiliser l'apostrophe typographique `’`.
- Collisions déjà rencontrées : classe `.tr-sum` (renommée `.tr-sm4`), `data-dl-dup` / `data-df-dup` (dupliquer un élément ≠ dupliquer un modèle → `…-dupm`).
- Un fichier `.doc` ouvert dans Word est verrouillé : écrire une version `_v2`.
- Tests navigateur : cibler par `[data-screen="…"]`, éviter `setTimeout` / promesses dans les outils d'inspection quand le panneau est masqué.

## 7. Hypothèses et limites (à valider avec le client)

- Historique des demandes : valeurs de Statut (En cours, Confectionnée, Payée, En litige, Apurée, Rejetée), colonnes et mouvements de démonstration sont **fictifs** ; seul le paramètre SOE alimente la liste ; centres = « Siège ».
- Les annulations (confection de la DRF, traitement de la déclaration) ne font que **remettre l'écran à zéro** dans la maquette ; les suppressions en table sont décrites dans les tickets, pas simulées.
- Valeurs d'imputation analytique (activités, postes, financements, zones) fictives.
- Duplication de modèle : seule la liste du concepteur « listing » copie réellement la conception.

## 8. Reste à faire / pistes

- DP-07 : compléter ticket et fichier de correspondance avec « Mode de déclaration » (table source à préciser).
- Aligner la maquette sur le fichier de correspondance : Cours, Montant du contrat, Monnaie du contrat en « Figé ».
- Historique des demandes : confirmer colonnes, statuts et éventuelle ouverture du détail d'une demande.
- Tout ce qui a été demandé jusqu'au 20/10/2026 est publié (commit `58a2e8e`).

## 9. Journal des évolutions récentes (ordre chronologique)

1. Saisie des plans ; imputation analytique champ par champ dans « Modification du mouvement » ; retrait des champs barrés.
2. Description des champs avec correspondance (tables d'alimentation) ; tickets DP-06 et DP-07.
3. Déclaration fiscale : « Édition du mouvement » regroupée en 4 groupes, toutes colonnes, élargie sans scroll ; switch « À déclarer » ; « Mode de déclaration » (Par l'entité / Par l'attributaire).
4. Étape 4 Confirmation + écran de succès + « Annuler le traitement de la déclaration » avec modales d'avertissement.
5. État de dépense : écran de succès + « Annuler la confection de la DRF » avec avertissement.
6. Duplication de modèles dans tous les concepteurs et listes.
7. Module **Suivi › Historique des demandes** : filtre, N° de sélection alimenté par l'état de dépense avec préremplissage, boutons CSV / EXCEL / Imprimer, tableau des mouvements avec imputation analytique.

## 10. Charte graphique Softwell (v1.0 du 08/10/2026)

Appliquée en fin de build (`build.cjs`, étape 7) : table de correspondance des teintes de marque (bleus, verts, turquoises, violets → échelle marine `#2E427B`, `#243569`, `#18244F`, `#0B1332`), polices Outfit (titres) + Inter (texte) chargées depuis Google Fonts, puis feuille `ecrans/charte.css` insérée en dernier dans la page (menu latéral navy-900 à 256 px avec filet or sur l'entrée active, barre supérieure blanche, boutons principaux marine, focus visible, animations réduites). Pour ajuster le thème, modifier `ecrans/charte.css` ou la table `MAP` ; ne pas recoder de couleur de marque en dur dans les écrans.
Non appliqué : logo Softwell (la maquette garde le logo SoftAccounting), polices hébergées (`public/fonts`), hauteurs tactiles de 44 px, remplacement des tableaux par des cartes sous 768 px.
Écrans conçus (préfixes ed- gs- pf- rc- md- so- ml- hd- tr- dd- dg- df- ig- ga- el-) : neutres gris chauds / ardoise remappés vers les neutres marine (`MAP`, build.cjs), badges à rayon 6 px en casse de phrase, titres Outfit, champs à contour #878D9A et 44 px de haut (hors tableaux et concepteurs), cartes 12 px / modales 16 px à ombre marine, notifications blanches à rayon 16 px, plus de flou. Règles dans la section « Écrans conçus » de `ecrans/charte.css`.
États comptables › Général (Balance générale, Balance auxiliaire, Grand livre général) : la fenêtre de critères est une pop-up modale (`ecrans/etats_modale.js` + `etats_modale.css`, exécuté en dernier). Le bloc « critères » existant devient le voile modal (affiché/masqué par `crit.style.display` comme avant) ; un fond de page avec le bouton « Critères d'édition » s'affiche tant que la fenêtre est fermée et que le résultat n'est pas affiché. Fermeture : ×, Annuler, Échap, clic sur le voile.
États comptables : barre d'actions unifiée « Filtre (principal) | CSV | EXCEL | PDF » sur Balance générale, Balance auxiliaire, Grand livre général, Balance analytique et États personnalisés › Édition (Liste, Récapitulatif) : `ecrans/etats_boutons.js` (déplace et renomme les boutons existants, sans toucher à leurs comportements) + `etats_boutons.css`, exécutés en dernier. « Filtre » rouvre la fenêtre de critères.

## Corrections d'écarts à la charte (audit du 22/10/2026)
- Polices Inter 400-700 et Outfit 600-700 hébergées (base64 dans `ecrans/polices/*.ttf`, injectées par build.cjs étape 7) ; plus de Google Fonts, plus de police à chasse fixe ni de Plus Jakarta / Fraunces / Space Grotesk / IBM Plex Mono.
- Étape 7 : toute couleur hex ou rgb() hors palette est ramenée au jeton marine ou neutre le plus proche (statuts rouge / vert / ambre conservés) ; textes < 12 px portés à 12 px ; « Sauvegarder » -> « Enregistrer ».
- `ecrans/charte_titres.js` : un seul h1 par écran (titre existant promu en role=heading niveau 1, sinon h1 ajouté depuis le fil d'Ariane).
- `charte.css` (fin) : barre supérieure 64 px, boutons 44 px, puces Balance analytique 6 px, boutons verts -> marine.
- Reste hors charte : icônes Tabler (charte : Lucide), logo SoftAccounting, boutons de tableaux/concepteurs < 44 px, boutons Balance/Grand livre à 32 px dans certaines barres.
- Vérification de syntaxe : `39 0`. Sauvegardes : `build.cjs.avant-ecarts`, `ecrans/charte.css.avant-ecarts`.

## Charte §6 Dimensions et espacements (audit du 22/10/2026)
- build.cjs étape 7 : rayons hors échelle ramenés à 4/6/8/12/16 px ; marges, remplissages et écarts arrondis à la grille de 4 px (6, 10 et 14 px conservés : classes de la charte) ; z-index > 70 ramenés à 50 (modales) ; durées de transition ramenées à 120 / 200 / 280 ms ; ombres sombres teintées marine.
- `charte.css` (fin) : entrées du menu latéral 44 px, notifications 384 px max et z-index 70, courbe cubic-bezier(.2,0,0,1).
- `charte_titres.js` : pilules (rayon complet) des boutons, puces et badges -> 6 / 8 px ; seuls restent ronds les avatars et pastilles carrées.
- Non fait : sous 1 024 px la charte demande une barre de 56 px et un menu tiroir ; la maquette garde le menu fixe de 256 px (à traiter avec le bouton menu d'origine). Sauvegardes : `*.avant-dimensions`.

## Charte §7 (position) et §13.5 (filtres) — 22/10/2026
- Lien d'évitement « Aller au contenu » + `main#main-content` ; champs sans libellé reçoivent un aria-label (`charte_titres.js`).
- Notifications en haut à droite à 16 px ; bouton principal des en-têtes de modèles (listing, récapitulatif, SOE, modèle fiscal, type de taxe) en haut à droite aligné sur le titre (`charte.css`).
- Critères d'édition (Balance générale, auxiliaire, Grand livre) : pied « Réinitialiser, Annuler, Rechercher » à droite (« Consulter » devient « Rechercher »).
- Non fait : barres d'outils à huit boutons (Exercices, Types de marché, Passation, Plans…) à réordonner ; puces de filtres actifs avec compteur or ; panneau de filtres dépliable au lieu de modale (la modale a été demandée) ; pagination sur toutes les listes ; sous-menu 56 px < 1024 px.

## En-tête d'état unifié (22/10/2026)
- Tous les états standard (Balance générale, Balance auxiliaire, Grand livre général, Balance analytique) : titre de l'état à gauche et Filtre | CSV | EXCEL | PDF à droite sur la même ligne, recherche dessous (`etats_boutons.js`, fonction `copierTitre`, et `etats_boutons.css`). Les titres générés dynamiquement sont recopiés dans la barre et l'original est masqué. Sous ~700 px de large, le titre passe au-dessus des boutons.
- Les titres de page « Balance générale / Balance analytique » restent dans le DOM, masqués visuellement (h1 accessible). Sauvegardes : `etats_boutons.*.avant-entete`.
- « Grand livre analytique » et « Détails des mouvements » (menu) ne sont pas des écrans de la maquette.

## Fenêtre de critères : champs harmonisés (22/10/2026)
- `etats_modale.css` (fin) : notes `.filters-hint` masquées (et le champ « Monnaie d'édition » quand il ne contient que la note) ; tous les champs (select, date, sélecteurs multiples) à 44 px, police 14 px, contour #878D9A, rayon 8 px ; grille de colonnes identique dans tous les blocs ; pastilles de niveaux / solde tiers à 44 px. Vaut pour Balance générale, Balance auxiliaire et Grand livre général. Sauvegarde : `etats_modale.css.avant-champs`.
- « Monnaie d'édition » : liste déroulante (`etats_modale.js`, fonction `monnaie`) sur les trois fenêtres de critères ; les boutons radio d'origine restent masqués et suivent le choix. Balance générale : options Monnaie locale — MGA / Devise 1 — USD (liste fixe de la maquette, non reliée au calcul). Sauvegarde : `etats_modale.js.avant-monnaie`.
- Fenêtres de critères : distribution à plat sur deux colonnes, comme le modèle « Critères de sélection des mouvements » (plus de cartes par bloc, libellé en casse de phrase au-dessus du champ, premier champ pleine largeur, cases à cocher sous un filet, corps défilant). Modale de 760 px. Sauvegarde : `etats_modale.css.avant-distribution`.
- Balance analytique › Niveaux d'analyse : cases superposées (une par ligne, pleine largeur, 44 px, badge à droite) — fin de `charte.css`.
- Éditions (Balance générale, auxiliaire, Grand livre) : l'écran d'attente « Critères d'édition » est supprimé ; la fenêtre de critères s'ouvre directement à chaque entrée dans l'écran tant qu'aucun résultat n'est affiché (`etats_modale.js`, `etats_modale.css`). Sauvegarde : `etats_modale.js.avant-direct`.
- Menu latéral repliable : « Replier la barre latérale » (bas du menu) et le bouton menu de la barre supérieure basculent entre 256 px et un rail de 72 px (logo, Tchat, flèche de dépliage) ; l'état est mémorisé dans le navigateur (`charte_titres.js`, `charte.css`). Le contenu suit (marge gauche 72 / 256 px). Les entrées de menu n'ayant pas d'icône dans la maquette, elles sont masquées dans le rail. Sauvegardes : `*.avant-repli`.

## Écran Pays (Paramètres généraux › Pays)
- `ecrans/pays.html` : liste (drapeau, code, libellé, statut) avec recherche, fenêtre modale Nouveau pays / Modifier le pays (Code, Libellé, Statut case « Actif », Drapeau : choix d'image PNG / JPG / SVG ≤ 200 Ko avec prévisualisation et retrait), suppression confirmée, notification. Données en mémoire (4 pays de démonstration). Branché dans `build.cjs` (écran `pays`, fil d'Ariane, TITLES / GROUP, lien du menu « Pays »). Sauvegarde : `build.cjs.avant-pays`. Vérification de syntaxe : `40 0`.
- Écran Pays : largeur pleine (plus de max-width) et plus de carte dans la carte (§2 charte). Sauvegarde : `pays.html.avant-largeur`.

## Charte au niveau des Paramètres (22/10/2026)
- Correctif : le titre de page ajouté (`charte_titres.js`) lisait le premier fil d'Ariane, caché, et affichait « Administration de l'entité » sur Exercices, Devis programme, Procédures financières et Saisie des plans ; il lit maintenant le fil visible. Surtitre ajouté (libellé du niveau parent, ex. « Paramètres comptables »).
- Libellés du formulaire d'Administration de l'entité en casse de phrase 14 px ; panneaux internes de Gestion des accès à plat (plus de carte dans la carte). Sauvegardes : `*.avant-parametres`.
- Reste : barres d'actions « Ajouter / Modifier / Supprimer / Enregistrer / Annuler / Imprimer » des Exercices, Plans, Saisie des plans et Devis programme (action principale à droite) ; Saisie des plans garde sa disposition en deux panneaux.

## Barre d'actions de page (modèle TOM²pro) — généralisée à toutes les interfaces
- `ecrans/barre_actions.js` + `barre_actions.css` : bande blanche unique (`#ba-host`) sous le fil d'Ariane, hors de la carte de contenu. Recherche à gauche ; actions à droite dans l'ordre charte (Filtre, exports, Réinitialiser, Modifier, Supprimer, Annuler, Enregistrer, action d'exécution, puis Ajouter) ; un seul bouton plein, choisi parmi : exécution (Éditer l'état, Suivant), Enregistrer actif, Ajouter, Filtre. Au-delà de 3 exports / secondaires : menu « Plus d'actions ». Symboles et émoticônes d'origine remplacés par des pictogrammes Tabler.
- Les boutons et champs de recherche d'origine restent dans la page (masqués, repliés à 0 px) ; la barre en est le miroir (libellé, désactivé, masqué, rafraîchi toutes les 300 ms) et relaie clics et saisie : aucun écouteur d'écran n'est modifié.
- Écrans équipés (objet `CFG` en tête du fichier) : gestion (Exercices, Saisie des plans, Devis programme, Procédures financières, Types de marché, Passation, Pays, Tiers, Modèles listing / récapitulatif / SOE / fiscal, Type de taxe), recherche seule (Configuration des plans, Modèle d'état), formulaires (Administration de l'entité, Gestion des accès, Gestion des sélections, Saisie d'écritures), assistants (État de dépense, Traitement de déclaration, EJCD) et états (Balances, Grand livre, Historique, Éditions personnalisées : barre visible quand le résultat est affiché).
- Non équipés : concepteurs (designer, designer2, listingdes : leur barre d'outils fait partie de l'outil) et Régularisation (aucun bouton d'action). Pour ajouter un écran : une ligne dans `CFG` (`{ add: 1 }` pour un écran de gestion, `{ txt: /regex/ }` pour repérer les boutons par leur libellé). Sauvegardes : `build.cjs.avant-barre`, `barre_actions.js.v1` / `.v2`.
- Compactage −25 % (fil d'Ariane et barre d'actions) : fil 35 → 26 px, bande d'actions 68 → 51 px, boutons 44 → 33 px (remplissage 16 → 12 px). Police plancher 12 px (charte §5.3) : le fil d'Ariane et les boutons restent donc à 12 px (pas 9 / 10,5 px). Cibles tactiles sous 44 px : à revoir pour un usage tactile. Sauvegarde : `barre_actions.css.avant-compact`.
- Espaces réduits (gain de place) : marge de la zone de contenu 24 → 6 px, remplissage de la carte 20/32 → 12/20 px, barre d'actions alignée (12 px). Fin de `charte.css`, sauvegarde `charte.css.avant-espaces`.

## États financiers (menu + Paramétrage du bilan)
- Menu latéral du module « États financiers » : Bilan, Compte de résultat, Emplois et ressources, Tableau de Flux de trésorerie, chacun avec « Paramétrages » et « Édition » (build.cjs : niveau `etats-financiers`, ids `bilparam/biledit/crparam/cred/erparam/ered/tftparam/tfted`).
- `ecrans/bilan_param.html` : écran complet « Paramétrage du bilan » (sélection / création / duplication / suppression de modèle, lignes du bilan, formulaire de la ligne : code, ordre, libellé, type, nature, fourchettes de comptes, amortissements/provisions, options de présentation). Données en mémoire. Actions (Ajouter, Modifier, Enregistrer, Annuler, Imprimer, Exporter) dans la barre d'actions. Le bouton « X2 » de la maquette d'origine n'est pas repris (doublon de Dupliquer).
- Les 7 autres écrans sont des pages vides (titre + mention « à construire »).
- Attention : dans les scripts inclus par build.cjs, ne pas nommer une fonction `$$` (le remplacement de chaîne la transforme en `$`). Utiliser `q` / `qa`.
- Sauvegarde : build.cjs.avant-etatsfin. Contrôle de syntaxe : 42 scripts, 0 erreur.
- Paramétrage du TFT (`ecrans/tft_param.html`, écran `tftparam`) : même structure que le paramétrage du bilan (modèle, onglets Saisie / Liste, filtres, barre d'actions). Champs : ligne du TFT, libellé, tri, nature (grille / regroupement / formule / titre), style (gras, italique, ligne vide), type, type de mouvement, ligne de rupture. Contrôle de syntaxe : 44 scripts, 0 erreur. Les écrans « Compte de résultat », « Emplois et ressources » et les éditions TFT restent à faire.
- États financiers : les écrans Compte de résultat (`cr_param`, `cr_edition`), Emplois et ressources (`er_param`, `er_edition`) et Tableau de flux de trésorerie (édition : `tft_edition`) sont GÉNÉRÉS par `gen_ef.cjs` à partir de `bilan_param.html` / `bilan_edition.html` (préfixes d'attributs data-* propres à chaque écran : crp, erp, cre, ere, tfe). Pour modifier un principe commun : modifier l'écran du bilan puis relancer `node gen_ef.cjs` puis `node build.cjs`. `tft_param.html` reste écrit à la main (champs spécifiques). Contrôle de syntaxe : 49 scripts, 0 erreur.
- Emplois et ressources (TER) : l'édition reprend le modèle « TABLEAU DES RECETTES ET DES PAIEMENTS (MODELE II) » (fichier Excel fourni ; lignes extraites dans `ecrans/ter_donnees.json`, colonnes Désignation / Trimestre (détail, total) / Cumulatif (détail, total), périodes = trimestres). Le paramétrage ER reprend la même structure (I - RESSOURCES, II - EMPLOIS…). Généré par `gen_ef.cjs` (sauvegarde `gen_ef.cjs.avant-ter`).
- Compte de résultat : l'édition reprend le modèle « Compte de résultat du projet AD2M-II » (capture fournie ; lignes transcrites dans `ecrans/cr_donnees.json`, généré par `mk_cr.cjs`) : colonnes Libellé / Exercice N / Exercice N-1, groupes, lignes, « *** TOTAL *** », totaux généraux et excédent/déficit. L'en-tête des tableaux « .ter » (CR et TER) est en marine, texte blanc. Le paramétrage CR reprend la même structure. Sauvegarde : `gen_ef.cjs.avant-cr`.
- Tableau de bord (`ecrans/tableau_bord.html`, écran `dashboard`, #dashboard) : bandeau marine (aplat), filtres exercice / période / site, 4 indicateurs, courbes CA / charges et anneau de répartition des charges (SVG, données de démonstration). Le module « Tableau de bord » du menu y mène ; la barre latérale reste sur la liste des modules. Sauvegarde : build.cjs.avant-dashboard.
- TFT (édition) : modèle « TFT » fourni (colonnes Libellé / Note / Exercice N / Exercice N-1, 27 lignes avec montants de démonstration cohérents : A + B + C = variation de trésorerie, écart = 0) dans `ecrans/tft_donnees.json` (généré par `mk_tft.cjs`). Bilan (édition) : montants de démonstration ajoutés. Sauvegardes : gen_ef.cjs.avant-tft, bilan_edition.html.avant-donnees.
- Copie TEMPORAIRE « anciennes couleurs » (démo) : `ANCIENNES_COULEURS=1 node build.cjs` produit `SoftCompta_Administration_entite_anciennes_couleurs.html` (teintes d'origine conservées, jetons marine/neutres des écrans récents ramenés vers les bleus et gris d'origine). Le build normal (`node build.cjs`) reste aux couleurs de la charte et n'est pas modifié. Cette copie n'est PAS publiée (deploy/ inchangé). Sauvegarde : build.cjs.avant-anciennes.
- Copie TEMPORAIRE « barre latérale d'origine » (démo) : `ANCIENNE_SIDEBAR=1 node build.cjs` produit `SoftCompta_Administration_entite_sidebar_ancienne.html` : couleurs de la charte partout, sauf la barre latérale (fond ardoise d'origine, élément actif en bleu). Non publiée. Sauvegarde : build.cjs.avant-sidebar.
- Conflit barre latérale (copie « barre latérale d'origine ») : `charte.css` imposait ses couleurs à la barre latérale avec `!important` (texte blanc, fond translucide, trait actif), par-dessus celles d'origine (fond bleuté, texte bleu). En mode `ANCIENNE_SIDEBAR=1`, ces règles de couleur sont retirées de `charte.css` avant injection (la largeur et le repli restent). Build normal inchangé. Sauvegarde : build.cjs.avant-sidebar2.
- Gestion des accès › Permissions : corrigé dans `charte.css` (sauvegarde `charte.css.avant-permissions`). La règle générale « boutons 36 px mini » (sélecteur très spécifique) écrasait les interrupteurs (devenus des ronds) et comprimait les groupes (textes superposés) : règles dédiées renforcées (`button.ga-sw.ga-sw…`, `button.ga-g.ga-g…`), noms de groupes tronqués avec points de suspension, tableau resserré (en-têtes sur deux lignes, colonne des menus plafonnée). Interrupteurs actifs en marine (charte).
- Journaux (`ecrans/journal.html`, écran `journal`, #journal) : sous « Grand livre général » dans États comptables › Général. Fenêtre de critères (exercice, période du/au avec calendrier borné à l'exercice, centres de saisie, axes de regroupement, type général/auxiliaire, monnaie en liste, numéro de journal + description, rupture par mois ou journal/mois) ouverte à l'arrivée ; résultat = écritures du fichier `Journaux.xls` (104 lignes d'extrait dans `ecrans/journal_donnees.json`), avec totaux par mois et total général. Section « Charges analytiques » de la capture non reprise (contenu inconnu). Sauvegardes : build.cjs.avant-journal, barre_actions.js.avant-journal.
- Menu Paramétrages : nouveau sous-module « Gestion des plans » (après Paramètres comptables) avec « Configuration des plans » (déplacée, écran `plans`) et « Plan des comptes » (entrée de menu seulement, écran non intégré). « Saisie des plans » reste dans Paramètres comptables. Fils d'Ariane ajustés. Sauvegardes : build.cjs.avant-gplans, build.cjs.avant-plancomptes. Cahier des charges mis à jour (74 fenêtres).
- Plans (Paramétrages › Gestion des plans › Plan des comptes) : 13 écrans générés depuis `ecrans/plan.tpl.html` + `ecrans/plans_donnees.json` (écrit par `mk_plans.cjs`) : Plan comptable, Activité, Budget, Géo, Financier, Plan 5 à Plan 10, Tiers, Journaux (ids `pl_*`). « Plan des comptes » est un sous-groupe du menu. Chaque plan : onglets Saisie / Liste, filtres, hiérarchie par code parent (niveau calculé), champ complémentaire propre au plan (sens, type, bailleur, type de journal…). Données de démonstration, en partie reprises des fichiers fournis (journaux, tiers, activités). Le gabarit réutilise les styles bp-* du paramétrage du bilan. Sauvegardes : build.cjs.avant-plans, barre_actions.js.avant-plans.
- Pays : refonte en onglets Saisie / Liste (comme le paramétrage du bilan et les plans) — liste filtrable (code, libellé, statut), saisie (code 2-3 lettres, libellé, Actif, drapeau avec prévisualisation), boutons dans la barre d'actions (Ajouter, Modifier, Supprimer, Enregistrer, Annuler, Imprimer, Exporter). La fenêtre modale et la boîte de suppression personnalisée disparaissent (suppression confirmée par le navigateur). Sauvegardes : ecrans/pays.html.avant-onglets, barre_actions.js.avant-pays.
- Exercices comptables : refonte en onglets Saisie / Liste (écran écrit à la main, `ecrans/exercices.html`, remplace la reprise de capture ; `ecrans/exercices.js` n'est plus utilisé). Liste filtrable (année, société, dates, statut, en cours), saisie (année sur 4 chiffres, dates préremplies 01/07 – 30/06, statut Préparatoire / Ouvert / Clôture totale, exercice en cours). Règles : exercice unique par année, dates valides, fin après début, pas de chevauchement, un seul exercice « en cours » qui ne peut pas être supprimé ; bouton « Définir en cours » dans la barre. Le formulaire d'ajout n'avait jamais été capturé : les champs sont une proposition à valider (statut « à revoir » dans le cahier des charges). Sauvegardes : build.cjs.avant-exercices, barre_actions.js.avant-exercices.
- Exercices comptables (saisie réduite) : la saisie ne contient plus que Année, Date début, Date fin (champs date natifs, calendrier du navigateur) et « En cours » ; société et statut ne sont plus saisis. Le statut reste affiché dans la liste : « Préparatoire » à la création, « Ouvert » dès que l'exercice devient « en cours ». L'année n'est modifiable qu'à la création. Sauvegarde : ecrans/exercices.html.avant-champs.
- Exercices comptables (liste) : colonnes Année (tri croissant), Date début, Date fin, En cours, Date de clôture, avec filtres (texte pour l'année, sélecteurs de date, liste tous / oui / non). Société et Statut ne sont plus affichés ; la date de clôture est alimentée par la clôture comptable (non saisissable ici, vide pour l'instant). Les exercices sont triés par année à chaque enregistrement. Sauvegarde : ecrans/exercices.html.avant-liste.

## Configuration des plans (refonte)
- Ecran ecrans/plans_config.html (remplace la capture) : onglets Saisie/Liste ; liste Code, Libellé du plan, Nombre de niveaux (11 plans : PC, Activité, Budget, Géo, Financier, Plan 5 à 10) ; saisie Code (non modifiable en modification), Libellé, Abréviation + tableau des niveaux (Niveau auto, Libellé, Format Numérique/Alphabétique/Alphanumérique ; Ajouter un niveau / retirer le dernier).
- Sauvegardes : build.cjs.avant-cfgplans, ecrans/barre_actions.js.avant-cfgplans, build.cjs.avant-groupes.
- Menu : groupes repliés à l'ouverture de la maquette (premier route()).

- Configuration des plans v2 : plus d'ajout/suppression de plan (barre : Modifier, Enregistrer, Annuler, Imprimer, Exporter) ; Niveaux du plan en sous-onglets Saisie/Liste avec icônes d'action en haut à droite (ajouter, modifier, valider, supprimer). Sauvegardes : ecrans/plans_config.html.avant-onglets, ecrans/barre_actions.js.avant-niv.

- Analytique (Administration de l'entité) : activation des plans ici (cases Activer, PC toujours actif ; défaut PC + PLAN1 à 4), colonnes Code, Libellé, Abréviation (repris de Configuration des plans, window.PLANS_CFG), Regroupement ; Enregistrer/Annuler ; seuls les plans activés restent dans le menu Plan des comptes. Codes de Configuration des plans alignés : PC, PLAN1 Activité, PLAN2 Budget, PLAN3 Financier, PLAN4 Géographique, PLAN5-10. Non branché : états, sélections, grand livre. Sauvegardes : ecrans/analytique.html.avant-plans, ecrans/plans_config.html.avant-codes.

- Règle d'activation des plans (onglet Analytique, window.PLANS_ACTIFS + événement plans-actifs) appliquée : menu Plan des comptes, liste de Configuration des plans, listes de choix « PLANn — … » (ex. gestion des sélections), grand livre général (cases + colonnes plans 1 à 4). Non branché : axes de la saisie d'écritures, état de dépense. Sauvegardes : *.avant-regle (analytique.html, plans_config.html, grand_livre_general.js).

- Règle d'activation généralisée (analytique.html, fonction appliquer) : listes de choix (saisie des plans, sélections, designer, balance analytique), axes + colonnes de la saisie d'écritures, imputations de l'état de dépense, grand livre (cases + colonnes plans 1 à 10). Sauvegarde : ecrans/analytique.html.avant-tous.

- Saisie des plans (plan.tpl.html) : le code suit strictement Configuration des plans (window.PLANS_CFG) : préfixe du code parent + segment du niveau (nombre de caractères et format Numérique/Alphabétique/Alphanumérique), niveaux max, parent non modifiable en modification. Codes de démonstration régénérés par norm_plans.cjs. Sauvegardes : ecrans/plans_donnees.json.avant-norm, ecrans/plan.tpl.html.avant-norm. Tiers et Journaux : pas de configuration, saisie libre.

- Racine des comptes (Paramètres comptables) : ecrans/racines.html, #racines ; C1 à C8 fixes (pas d'ajout/suppression), onglets Saisie/Liste, une colonne/tuile par plan activé (liaison plan comptable ↔ plans, window.RACINES exposé). Sauvegardes : build.cjs.avant-racines, ecrans/barre_actions.js.avant-racines. Non publié (dernier push : c68f855).

- Ancien module « Saisie des plans » de Paramètres comptables (capture) supprimé (menu, écran, fil d'Ariane, titres) ; reste Gestion des plans › Saisie des plans. Sauvegarde : build.cjs.avant-rmsaisie. Non publié (dernier push : c68f855).

- Analytique : colonne « Niveau de regroupement » après Regroupement (liste des niveaux du plan, issus de Configuration des plans ; niveau 1 proposé à la coche, obligatoire pour enregistrer ; window.PLANS_REGROUPEMENT). Sauvegarde : ecrans/analytique.html.avant-niveau. Non publié (dernier push : c68f855).

- Analytique : Plan de regroupement = choix unique (boutons radio, défaut Plan comptable niveau 1), colonne de niveau à largeur uniforme (240 px). Sauvegarde : ecrans/analytique.html.avant-radio. Non publié (dernier push : c68f855).

- Interrupteurs déformés par la règle 36 px corrigés (charte.css) : Modules (ml-sw 38x22), Devis programme (dp-switch 44x24), Types de passation/marché (tp-tg 40x24). Sauvegarde : ecrans/charte.css.avant-switch. Non publié (dernier push : c68f855).

- Type de taxe (Paramètres comptables) : ecrans/taxes.html, #taxes ; Code, Libellé, Taux (%), Forfait, Compte (plan comptable, window.PLAN_COMPTABLE) + radios Sens / Type de déclaration / Type ; onglets Saisie/Liste. Distinct du « Type de taxe » des états fiscaux. Sauvegardes : build.cjs.avant-taxes, ecrans/barre_actions.js.avant-taxes, ecrans/plan.tpl.html.avant-taxes. Non publié (dernier push : c68f855).

- Listes de choix d'un élément de plan : ecrans/combo_plans.js (panneau Code | Libellé avec filtre par colonne, select d'origine conservé) appliqué aux codes parents des plans, compte de Type de taxe, axes de la saisie d'écritures, Du/Au compte (balance, grand livre, balance auxiliaire) et compte collectif/auxiliaire. Ajouter un sélecteur à CIBLES (ou data-combo) pour étendre. Sauvegarde : build.cjs.avant-combo. Non publié (dernier push : c68f855).

- Combo Code | Libellé généralisé : toute liste déroulante dont les options sont « code — libellé » (au moins 2, au moins 60% de la liste) devient un panneau filtrable ; data-no-combo pour exclure. 68 listes équipées, 0 non couverte. Correctif : devis_programme.js avait « sw.click() » mal placé dans showTab (erreur console depuis le « Devis programme désactivé par défaut ») — remis à l'initialisation. Sauvegardes : ecrans/combo_plans.js.avant-tous, ecrans/devis_programme.js.avant-fixtab. Non publié (dernier push : c68f855).

- Panneau Code | Libellé : rayures (zébrage) supprimées, police 12 px. Sauvegarde : ecrans/combo_plans.js.avant-rayures. Non publié (dernier push : c68f855).

- Saisie d'écritures : hauteur des champs réduite d'un cinquième (36 -> 29 px ; textarea 62 -> 50 px), règle en fin de charte.css (selector [data-screen=ecritures] x3). Sauvegarde : ecrans/charte.css.avant-ecr29. Non publié (dernier push : 298b31e).

- Saisie d'écritures : champ Pièce jamais grisé (éditable, placeholder « Proposée : AC0001 » ; numéro saisi utilisé s'il existe, sinon numérotation du journal ; verrouillé comme le reste de l'en-tête une fois validé). Sauvegardes : ecrans/ecritures.js.avant-piece, ecrans/charte.css.avant-piece. Non publié (dernier push : 298b31e).

- Saisie d'écritures : titre « Sélection de l'exercice et du journal » et cadenas supprimés ; en-tête toujours modifiable, saisie des lignes active dès l'ouverture ; la date d'écriture (obligatoire, dans l'exercice ou le DP) est contrôlée à l'ajout d'une ligne et à l'ouverture des infos libres (entetePret). Sauvegarde : ecrans/ecritures.js.avant-entete. Non publié (dernier push : 298b31e).

- Saisie d'écritures : en-tête réorganisé en 3 blocs (Exercice/Site/Journal ; groupe « Dates » = date d'écriture, date pièce, cours 1 ; groupe « Références » = n° facture, référence, pièce). Sauvegardes : ecrans/ecritures.js.avant-groupes, ecrans/charte.css.avant-groupes. Non publié (dernier push : 298b31e).

- Saisie d'écritures : en-tête compacté sur UNE ligne en 3 blocs (Exercice et journal / Dates / Références) pour économiser la hauteur ; passe à 2 lignes sous 1300 px et à 1 colonne sous 800 px. Sauvegardes : ecrans/ecritures.js.avant-ligne, ecrans/charte.css.avant-ligne. Non publié (dernier push : 298b31e).

- Saisie d'écritures : intitulés des blocs d'en-tête supprimés (masqués), tous les fonds blancs (blocs, champs, Cours 1 inclus), ligne de titre vide masquée. Sauvegardes : ecrans/charte.css.avant-blanc, ecrans/ecritures.js.avant-blanc. Non publié (dernier push : 298b31e).

- Saisie d'écritures : en-tête fusionné en UN seul bloc (display:contents sur les groupes ; 9 champs sur une ligne : exercice, site, journal, date d'écriture, date pièce, cours 1, n° facture, référence, pièce ; retour à la ligne automatique si l'écran est étroit). Sauvegarde : ecrans/charte.css.avant-bloc. Non publié (dernier push : b78819d).

- Saisie d'écritures : en-tête forcé sur UNE seule ligne (grid-auto-flow:column, colonnes égales, libellés 10 px, bouton journal sur une ligne) ; retour à la ligne uniquement sous 1000 px. Sauvegarde : ecrans/charte.css.avant-uneligne. Non publié (dernier push : b78819d).

- Saisie d'écritures : liste des lignes de la pièce réduite à Compte, Tiers, Libellé, Débit, Crédit (colonne de sélection conservée ; le détail analytique/échéance/infos reste saisi et conservé dans la ligne mais n'est plus affiché ; boutons de ligne retirés, double-clic = modifier). Sauvegarde : ecrans/ecritures.js.avant-colonnes. Non publié (dernier push : b78819d).

- Saisie d'écritures : « Pièce en cours » et « Lignes de la pièce / n ligne » retirés, message « Aucune ligne en attente » supprimé, total Débit/Crédit/équilibre affiché seulement quand il y a au moins une ligne. Sauvegarde : ecrans/ecritures.js.avant-encadres. Non publié (dernier push : b78819d).

- Saisie des plans (plan.tpl.html) : Niveau = liste des niveaux de Configuration des plans (limite le code parent au niveau précédent) pour tous les plans ; Plan comptable : « Racine de compte rattachée » (niveau 1, window.RACINES), « Comportements du dernier niveau » (sans analytique, tiers, immobilisations, lettrage) et « Comportements analytiques — superclasse Cx » (plans activés et ventilés par la racine ; désactivés si « Sans analytique »). Événement racines-changed émis par Racine des comptes. Sauvegardes : ecrans/plan.tpl.html.avant-niveaux, ecrans/racines.html.avant-event. Non publié (dernier push : b78819d).

- Modèle « Analyse sommaire SoftSE.xlsx » mis à jour pour SoftAccounting : Analyse sommaire SoftAccounting.xlsx (même mise en page, textes et questionnaire adaptés comptabilité générale/tiers/analytique/états ; logos Softwell conservés).

- Menu Comptabilité générale aligné sur la capture fournie : Compte de tiers, Saisie d'écritures, Liste des écritures*, Lettrage* (sous-groupe), Rapprochement bancaire* (Configuration, Pointage, Situation, Hors Compta), Circuit de validation*, puis groupes Gestion des cours* et Petite caisse* (* écrans non intégrés, entrées inertes). Sauvegarde : build.cjs.avant-menucg. Non publié (dernier push : b78819d).

- Saisie des plans : ordre Niveau > Code parent > Code > Libellé ; « Ajouter » depuis une ligne sélectionnée de la liste préremplit niveau suivant + parent = cette ligne (au dernier niveau : frère, même parent) ; sans sélection : niveau 1. Sauvegarde : ecrans/plan.tpl.html.avant-ordre. Non publié (dernier push : b78819d).

- Saisie des plans : champ Code avec tirets (un par caractère encore saisissable, préfixe du parent compris) via un calque aligné sur le champ. Sauvegarde : ecrans/plan.tpl.html.avant-tirets. Non publié (dernier push : b78819d).

- Plans_consolides.xlsx (Projet PARN, export Tom²Pro 09/10/2026) importé : plans comptable (843), budget PCOP (63), activité (504), géographique (28), journaux (97), tiers (9 187 + 108 comptes collectifs) pour « Saisie des plans » ; niveaux de Configuration des plans recalés (PC 1-1-1-3, activité 1-1-2-2, budget 2-1-1-1, géo 4-3) ; saisie d'écritures alimentée par ces plans (comptes de détail, tiers par compte collectif, 16 sites, 97 journaux, axes activité/budget/géo) via ecrans/plans_pc.js. Générateur : import_plans/gen.cjs (+ lire.cjs, dump.json). Non repris : balances, grand livre, balance auxiliaire, écran Compte de tiers (données de la capture). Sauvegardes : *.avant-pc (plans_donnees.json, plans_config.html, ecritures.js, plan.tpl.html, build.cjs). Non publié (dernier push : b78819d).

- Écran Tchat (#tchat) : ecrans/tchat.html ; bouton « Tchat » du menu latéral (bas) -> écran ; Nouveau canal (nom*, description, membres cochés, ≥ 1 membre en plus de l'utilisateur), messages directs, recherche, fil de messages, historique + participants, suppression d'une conversation. Aucun canal au départ ; données en mémoire. Sauvegarde : build.cjs.avant-tchat. Non publié (dernier push : b78819d).

- Saisie des journaux (Gestion des plans › Saisie des plans › Journaux) : écran dédié ecrans/journaux_saisie.html + journaux_donnees.json (97 journaux du classeur, type/nature déduits) ; Type (Opérations diverses/Trésorerie/Hybride) -> Nature (Achat, Vente, Opérations diverses / Banque, Caisse / Avance) ; Banque et Compte associé pour trésorerie/hybride ; signataires 1/2, statut, exclure de la DRF, numérotation automatique ; les journaux actifs alimentent la saisie d'écritures (ECRITURES_REF.journaux). Sauvegarde : build.cjs.avant-journaux. Non publié (dernier push : b78819d).

- Numérotation automatique par journal (écran Saisie des journaux) : préfixe*, longueur*, séparateur, suffixe, dernier numéro, aperçu du prochain numéro ; la saisie d'écritures propose préfixe+séparateur+compteur+suffixe, avance le « dernier numéro » à chaque pièce enregistrée (événement journaux-changed) ; journal en numérotation manuelle : n° de pièce obligatoire. Sauvegardes : ecrans/journaux_saisie.html.avant-num, ecrans/ecritures.js.avant-num. Non publié (dernier push : b78819d).

- Saisie des tiers (Gestion des plans › Saisie des plans › Tiers) : écran dédié ecrans/tiers_saisie.html + tiers_donnees.json (9 187 tiers du classeur, 108 comptes collectifs, détails parsés pour 284) ; liste (code, intitulé, sous-type, compte collectif, collection, débit, crédit, statut Actif/Utilisé) filtrée, triée, paginée ; saisie Identité / Coordonnées / Coordonnées bancaires / Paiement et site ; tiers « Utilisé » (marqué par la saisie d'écritures via TIERS_MARQUER) : suppression impossible, code et compte collectif verrouillés ; création/modification/suppression synchronisées avec la liste des tiers de la saisie d'écritures. Sauvegardes : build.cjs.avant-tiers, ecrans/ecritures.js.avant-tiers. Non publié (dernier push : b78819d).

- Tiers : comptes collectifs limités à la classe 4 (106 ; 146 lignes rattachées à 615/620 écartées -> 9 041 tiers) ; liste : Compte collectif en 1re colonne, puis Code, Intitulé, Sous-type, Adresse, Téléphone, NIF, Statut (à la place de Collection/Débit/Crédit). Sauvegarde : ecrans/tiers_saisie.html.avant-colonnes. Non publié (dernier push : b78819d).

- Module « Comptabilité générale › Compte de tiers » supprimé (menu, écran de la capture, fil d'Ariane, titres) : les tiers se gèrent dans Gestion des plans › Saisie des plans › Tiers. Correctif : l'écran Saisie des journaux utilisait le même attribut racine data-jr que l'écran des états « Journaux » (erreur console, états cassés) -> renommé data-jn / classes jn-. Sauvegardes : build.cjs.avant-rmtiers, ecrans/journaux_saisie.html.avant-prefixe. Non publié (dernier push : b78819d).

- Configuration des plans : colonne « Abréviation » dans la liste (unique, enregistrée en majuscules) ; les abréviations remplacent les noms de plans dans les autres modules (saisie d'écritures : axes, grand livre : cases et colonnes, gestion des sélections, balance analytique, état de dépense, Racine des comptes, comportements analytiques) via analytique.html (appliquer / reecrire) ; sans abréviation (plans 5 à 10 au départ) le nom d'origine reste. Sauvegardes : *.avant-abrev (plans_config.html, analytique.html, racines.html, plan.tpl.html). Non publié (dernier push : b78819d).

- PUBLICATION : le fichier publié (deploy/index.html) est la version ANONYMISÉE (PUBLICATION=1 node build.cjs -> SoftCompta_Administration_entite_publication.html ; données de tiers fictives via import_plans/gen.cjs -> import_plans/publication/). Ne jamais copier SoftCompta_Administration_entite.html (données réelles du Projet PARN) dans deploy. Dernier push : 3ae95f8 (poussé par l'utilisateur depuis son terminal).

## Rapprochement bancaire > Configuration
Nouvel ecran ecrans/rapprochement_config.html (route #rapprochement, menu Comptabilite generale > Rapprochement bancaire > Configuration, fil d Ariane). Champs: Banque*, Compte bancaire* (512 du plan comptable), Libelle, Devise MGA, A nouveau, Date debut*, devises 1 (USD) / 2-3 desactivees, Signataires 1-2 (issus des journaux). Donnees en memoire; Pointage/Situation/Hors Compta restent inertes. Sauvegarde build.cjs.avant-rapprochement.

- Rapprochement > Configuration : champs regroupes en 3 blocs (sans titre, fond blanc) + onglets Saisie/Liste (filtres, Ajouter/Modifier/Supprimer, un compte = une configuration, 2 lignes d exemple 512100/512101). Sauvegarde ecrans/rapprochement_config.html.avant-blocs.

- Rapprochement bancaire > Pointage : nouvel ecran ecrans/rapprochement_pointage.html (route #pointage, menu, fil d Ariane). Compte (issu de Configuration via window.RAPPROCH_CONFIG), releve n, date, solde releve/comptable; listes Releve bancaire (R/?) et Ecritures non pointees (proposition); Importer (simule), Proposer automatiquement (meme montant), Valider (sommes egales), ecart a justifier + Creer l ecriture d agios. Donnees de demo pour 512100 uniquement. Config: 512100=BNI, 512101=BOA. Sauvegarde build.cjs.avant-pointage.

- Barre d actions de page : ecrans Rapprochement Configuration (Ajouter/Modifier/Supprimer/Enregistrer/Annuler) et Pointage (Importer un releve, Proposer automatiquement, Valider le rapprochement) ajoutes a CFG de barre_actions.js (sauvegarde .avant-rapprochement).

- Rapprochement bancaire > Situation : ecran ecrans/rapprochement_situation.html (route #situation, menu, fil d Ariane, barre d actions Enregistrer/Imprimer/Exporter). Compte, reference du releve (liste ou nouvelle), date, tableau Elements (local/USD, solde rapproche = releve - non debitees + non comptabilisees + autres), signataires (issus de Configuration), historique chaine des releves (demo 512100 d apres capture). Enregistrer ajoute la reference chainee. Sauvegardes build.cjs.avant-situation, barre_actions.js.avant-situation.

- Saisie d ecritures (ligne) : libelle Compte general -> abreviation du plan comptable (PLANS_CFG), Compte tiers -> Tiers ; les axes analytiques (plans actifs, abreviations) passent en ligne avec PC et Tiers (bloc .entry-axes-ligne) ; libelle + echeance, puis devise locale / devise 1 / sens sous le libelle (grille 12 colonnes >=1100px). La fenetre Analytique ne garde que Budget et Reglement. Sauvegardes ecritures.js.avant-champs, charte.css.avant-champs.

- Saisie d ecritures (ligne) : bouton Analytique supprime (masque), colonnes de droite laissees vides, champs decales a gauche : L1 Contrat/PC/Tiers, L2 axes, L3 Libelle+Echeance, L4 Devise locale/Devise 1/Sens. Budget et Reglement (ancienne fenetre Analytique) n ont plus de point d acces. Sauvegarde charte.css.avant-gauche.

- Saisie d ecritures : controle d equilibre du bordereau dans la zone de droite de la ligne (colonnes Debit/Credit/Solde, lignes MGA et USD = devise locale et devise 1) ; la ligne stocke desormais montant1 (devise 1). Calcul mis a jour a chaque rendu des lignes. Sauvegardes ecritures.js.avant-equilibre, charte.css.avant-equilibre.

- Listes de selection : code et libelle separes dans le panneau (colonnes Code | Libelle) ; apres choix seul le code reste affiche, libelle en infobulle. Saisie d ecritures (ecritures.js select()) et tous les selects code-libelle (combo_plans.js). Sauvegardes .avant-codeseul.

- Saisie d ecritures (ligne) : champs resserres (seul le code s affiche) : L1 Contrat/PC/Tiers/Echeance, L2 axes, L3 Libelle (hauteur 29px comme les autres champs), L4 Devise locale/Devise 1/Sens ; controle d equilibre elargi (colonnes 9-12). Sauvegarde charte.css.avant-etroit.

- Saisie d ecritures : liste des lignes = Compte, Tiers, imputations analytiques (un axe par plan actif, abreviation en en-tete, codes seuls), Libelle, Debit, Credit ; controle d equilibre retire de la ligne de saisie (champs etendus sur 12 colonnes) ; champs de plans (PC, axes) reduits de moitie (axes 130px). Sauvegardes ecritures.js/charte.css .avant-liste-axes.

- Saisie d ecritures (ligne) : largeur de Contrat, PC, Tiers, Echeance, Devise locale, Devise 1 et Sens reduite de moitie (grille 24 colonnes). Sauvegarde charte.css.avant-moitie.

- Saisie d ecritures, liste des lignes : colonne Compte = code seul (libelle du compte supprime) ; colonnes Libelle / Debit / Credit de nouveau visibles (regle de masquage de colonnes d axes de analytique.html supprimee pour ce tableau, les colonnes d axes sont construites par ecritures.js) ; tableau pleine largeur. Sauvegardes ecritures.js.avant-liste-compte, analytique.html.avant-liste-axes.

- Menu Comptabilite generale (d apres capture) : sous-ecrans inertes ajoutes : Lettrage (automatique, manuel, Delettrage, Prelettrage), Gestion des cours (Saisie, Conversion, Cours applique), Petite caisse (Types d operation, Billetage, Saisie, Generation des ecritures). NB : la capture montre aussi Compte de tiers, supprime sur demande precedente, non remis. Sauvegarde build.cjs.avant-menucg2.

- Saisie d ecritures (ligne) : axes analytiques (plans) lineaires sur la meme ligne que Contrat/PC/Tiers/Echeance (colonnes 14-24) ; libelle en ligne 2, devises/sens en ligne 3. Sauvegarde charte.css.avant-lineaire.

- Saisie d ecritures, liste des lignes : colonnes Debit USD / Credit USD ajoutees (montant en devise 1), totaux du pied alignes sous les colonnes Debit / Credit (local et devise), tiers = code seul, fonds blancs (plus de gris, rouge, jaune ni vert) ; selection = filet bleu. Sauvegardes ecritures.js/charte.css .avant-montants.

- Menu Parametrages > Parametres generaux : entree inerte Fonctions supprimee (build.cjs, sauvegarde .avant-fonction).

- Terme DRF retire de la maquette (choix : ecrans conserves, terme remplace) : Gestion des DRFs -> Gestion des demandes de remboursement ; DRF/DRFs -> demande(s) ; libelles de donnees (plan comptable, grand livre) : DRF -> Demande. 137 occurrences dans build.cjs, ecrans/*, publication/*. Sauvegardes dans sauvegarde_drf/. ATTENTION : ne pas relancer import_plans/gen.cjs sans refiltrer DRF (il regenererait les libelles d origine). Prochain push : reconstruire PUBLICATION=1.

- Administration de l entité > Informations : section « Comptabilité » avec select « Référentiel comptable » (PCG 2005 Madagascar par défaut, SYSCOHADA, SYCEBNL, PCG France, IFRS). Source : ecrans/informations_generales.html. Non poussé.

- Sidebar : entrée inerte « Utilisateurs » (Administration) supprimée (build.cjs ligne 307). Non poussé.

- Gestion des accès > onglet Journaux : rattachement utilisateur/journal (liste utilisateurs avec compteur, tableau des journaux avec cases, tous/aucun, recherche, Enregistrer/Réinitialiser). Source : ecrans/gestion_acces.html (backup .avant-jnl). Utilisateurs fictifs ; journaux = window.JOURNAUX_PLAN ; résultat en window.JOURNAUX_USERS. Non poussé.

- Gestion des accès > onglet Utilisateurs : liste (Identifiant/Nom/Groupe/Email/Rôle/Statut avec bascule) + assistant 3 étapes (groupe existant/nouveau, informations + sociétés/sites/plan de regroupement/éléments niveau 1, modules associés). Données en mémoire (window.GA_USERS), partagées avec l onglet Journaux (événement ga-users-changed). Source : ecrans/gestion_acces.html (backup .avant-users ; fragments gu_fragment.*). Menu « Utilisateurs » du sidebar reste supprimé. Non poussé.

- Gestion des accès > Utilisateurs : boutons Nouvel utilisateur / Modifier / Supprimer / Imprimer / PDF / Excel (XLSX) miroités dans la barre d actions de page (CFG acces + genre nouvel dans barre_actions.js, backup .avant-gu). Sélection de ligne ; Modifier rouvre l assistant prérempli (identifiant verrouillé, mot de passe facultatif) ; Supprimer avec confirmation (superadmin protégé) ; PDF et XLSX générés côté navigateur (liste filtrée par la recherche). Sources gu_export.js / patch_gu2.cjs. Non poussé.

- Utilisateurs : colonnes réparties selon le contenu et bascule Actif/Inactif ramenée à 36x20 (charte.css, fin de fichier, backup .avant-gu3 ; surcharge nécessaire car charte.css impose min-width 210 sur .ga-t first-child et min-height 36 sur les boutons). Non poussé.

- Assistant Nouvel utilisateur : rattachement société / sites / plan de regroupement / éléments niveau 1 supprimé (étape 2 = nom, identifiant, email, mot de passe). Backup ecrans/gestion_acces.html.avant-gu5. Non poussé.

- Gestion des accès : nouveaux onglets « Sites » et « Axes de regroupement » (même principe que Journaux : utilisateurs à gauche avec compteur, éléments à cocher, tous/aucun, recherche, Enregistrer/Réinitialiser miroités dans la barre). Sites = codes site des journaux (15) ; axes = plans actifs (PLANS_ACTIFS/PLANS_CFG, colonne Regroupement via PLANS_REGROUPEMENT). Résultat en window.RATTACHEMENTS.{sites,axes}. Source gu_ratt.js (backup gestion_acces.html.avant-ratt). Non poussé.

- Analytique (Administration de l entité) : bouton radio « Plan de regroupement » remplacé par un interrupteur par plan actif (plusieurs plans de regroupement possibles) ; le choix du niveau se débloque à l activation (niveau 1 par défaut). Backup ecrans/analytique.html.avant-regr. Non poussé.

- Analytique : un seul axe de regroupement à la fois (activer un interrupteur désactive les autres ; possible de n en avoir aucun). Backup analytique.html.avant-regr2. Non poussé.

- Interrupteurs d activation (Analytique an-sw, Utilisateurs gu-sw) : contour nettoyé (plus d ombre sur le curseur, plus de bordure/outline, anneau de focus seulement au clavier). Backup analytique.html.avant-sw. Non poussé.

- Interrupteur Analytique reconstruit en un seul élément (input appearance:none + ::after, plus de span superposé) pour supprimer le liseré. Backup analytique.html.avant-sw2. Non poussé.

- Balayage des conflits CSS/JS : cause du liseré des interrupteurs = ecrans/charte_titres.js (fonction arrondis) qui posait border-radius 6px/8px en style inline sur tout élément à rayon >= 100px, donc sur les pistes d interrupteurs (36x20) ; exclusion ajoutée pour .an-sw, .gu-sw, [role=switch], .ml-sw, .ga-sw, .dp-switch, .tp-tg, [class*=switch] (backup charte_titres.js.avant-ronds). serve.cjs envoie désormais Cache-Control: no-store (redémarrer le serveur si besoin). Non poussé.

- Mécanisme du plan de regroupement : window.REGROUPEMENT() (analytique.html) = plan choisi (un seul, défaut PLAN3 niveau 1) + éléments de ce niveau lus dans « Saisie des plans » (window.PLANS_LIGNES exposé par plan.tpl.html) ; événement regroupement-changed à l enregistrement. Consommateurs : Gestion des accès > Axes de regroupement (éléments cochables), Balance auxiliaire (filtre Plan de regroupement), Journal (Axe de regroupement). Non branchés : Grand livre général (cases = colonnes de plans) et champ capturé inerte « Plan de regroupement » des états de balance. Backups *.avant-regr3. Non poussé.

- Regroupement branché sur les écrans restants : Grand livre général (filtre « Plan de regroupement » = éléments du niveau ; anciennes cases renommées « Plans affichés » ; filtre par préfixe sur la valeur du plan de la ligne, ou sur le compte pour PC) et États de balance (champ capturé inerte remplacé par la liste ; filtre actif sur la balance générale quand le plan de regroupement est PC, sinon note « sans effet »). Les lignes du GL portent des codes financement du type IDA012, absents de « Saisie des plans > Financier » (01 à 04) : un élément Financier ne retient aucune ligne tant que les données ne sont pas alignées. Backups *.avant-regr4. Non poussé.

- « Axe(s) de regroupement » renommé « Plan de regroupement » (Gestion des accès, Journal, balance analytique). Règle générale : si aucun plan de regroupement n est activé (REGROUPEMENT() = null), la classe sans-regroupement sur <html> masque tout élément [data-regr] (onglet Gestion des accès, champs du Journal, Balance auxiliaire, Grand livre, Balance générale, Balance analytique) ; les .filter-label contenant « regroupement » sont marqués automatiquement (analytique.html, appliquerRegroupement). Non masquée : colonne « Plan de regroupement » du tableau du grand livre. Backups *.avant-regr5. Non poussé.

- Gestion des accès : boutons PDF et Excel (XLSX) sur les onglets Journaux, Sites, Plan de regroupement et Permissions (export du tableau affiché, cases/interrupteurs en Oui/Non, nom de fichier gestion_acces_<onglet>), miroités dans la barre d actions ; Utilisateurs avait déjà Imprimer/PDF/Excel. Source gu_xport.js (backup gestion_acces.html.avant-xport). barre_actions.js : le menu « Plus d actions » ne compte plus qu une fois un même bouton répété entre onglets (backup .avant-xport). Non poussé.

- Nouvel écran Paramétrages > Administration > Paramétrage des traces (#traces, ecrans/traces.html ; menu, fil d Ariane, TITLES/GROUP dans build.cjs ; CFG traces dans barre_actions.js) : traçabilité Création/Modification/Suppression regroupée par module (8) puis fonctionnalité (46, actions limitées à celles qui existent), rétention des logs en jours (1 à 3650), recherche, rétention par défaut + appliquer à tout, tout tracer / ne rien tracer, cases de colonne par module, sections repliables ; résultat en window.TRACES_CFG (événement traces-changed). Backups build.cjs.avant-traces, barre_actions.js.avant-traces. Journal de traces / Nettoyages / Alertes restent inertes. Non poussé.

- Paramétrage des traces : colonnes alignées entre tous les modules (table-layout fixe, colgroup 38/14/14/14/20) ; nouvelle section « Sécurité et accès » avec « Tracer les connexions et échecs d authentification » et « Tracer les consultations d états sensibles » (interrupteur + rétention 1-3650 j, window.TRACES_SECURITE ; inclus dans Tout tracer / Ne rien tracer / Appliquer à tout). Backup traces.html.avant-aligne. Non poussé.

- Nouvel écran Paramétrages > Administration > Journal de traces (#jtraces, ecrans/journal_traces.html ; menu/crumb/TITLES/GROUP dans build.cjs, CFG jtraces dans barre_actions.js ; backups *.avant-jtraces) : filtres Du/Au/Module/Utilisateur/Action/Type, historique des manipulations (160 logs de démonstration générés, pagination par 40), double-clic ou Entrée = détail champ / ancienne / nouvelle valeur. Dictionnaire des logs (window.DICTIONNAIRE_LOGS : champs avec libellé, format et description ; entités ; actions ; types) : libellés lisibles + valeurs formatées (montant, date, oui/non, valeurs codées), bascule « noms techniques », termes absents signalés, dictionnaire modifiable (bouton Dictionnaire, ajout de terme, rétablir). Données fictives en mémoire. Non poussé.

- Journal de traces : dictionnaire de données (traduction automatique des logs) — résumé en clair généré pour chaque manipulation (liste + détail, case « Résumé en clair »), libellé généré pour les termes inconnus (CamelCase -> texte) avec mention « à valider », inférence du type de valeur (date, oui/non, montant), dictionnaire enrichi (type de donnée, utilisé dans, exemple, bandeau des termes non documentés + « Compléter automatiquement »). Exports PDF / PDF avec détails / Excel (XLSX) / Excel (XLSX) avec détails de tout le résultat filtré (window.EXPORT_TABLEAU exposé par gu_xport dans gestion_acces.html ; barre_actions cfg.plat = pas de menu Plus d actions). Backups *.avant-jt3 / *.avant-xport2. Non poussé.

- PUSH a8a69ba (deploy/index.html = build PUBLICATION). Ajout : import_plans/publication/balance_auxiliaire_donnees.js (anon_bx.cjs) — balance auxiliaire anonymisée (132 tiers) car elle exposait des noms de personnes + montants dans les pushes précédents. RESTE réel dans la version publiée : libellés/tiers des données du Journal (journal_donnees.json) et du grand livre (glg_donnees.js) — noms de personnes en libellés (ex. frais de mission, honoraires). A anonymiser avant tout nouveau push public.

- Nouvel écran Paramètres comptables > Mode de règlement (#modereglement, ecrans/mode_reglement.html ; menu après « Type de taxe », fil d Ariane, TITLES/GROUP dans build.cjs, CFG modereglement dans barre_actions.js ; ajouté aussi à l arbre des permissions et au Paramétrage des traces). Champs : Code mode de paiement* (A-Z0-9, 10 max, unique, verrouillé après création), Libellé*, Type (Banque/Caisse/non précisé), Statut (Actif/Inactif) ; liste filtrable (VIR, CHQ, ESP, MVO d exemple), Imprimer/PDF/Excel (via window.EXPORT_TABLEAU de Gestion des accès) ; modes actifs exposés en window.MODES_REGLEMENT (+ événement modes-reglement-changed). Pas encore branché sur la saisie d écritures. Piège : un heredoc bash supprime les antislashs des regex (ex. excel \(xlsx\)) -> corriger avec Edit. Non poussé.

- Nouvel écran Paramètres généraux > Signataires (#signataires, ecrans/signataires.html ; entrée de menu existante activée par regex dans build.cjs, fil d Ariane, TITLES/GROUP, CFG signataires dans barre_actions.js ; backups *.avant-signataires). Champs : Code* (A-Z0-9, 12 max, unique, verrouillé après création), Libellé*, Nom du signataire*, Fonction, Type de document (liste de 12 types + « Tous les documents »). 4 signataires d exemple fictifs, Imprimer/PDF/Excel (window.EXPORT_TABLEAU), liste exposée en window.SIGNATAIRES (+ événement signataires-changed). Non branché sur Rapprochement bancaire / Journaux (qui gardent leurs propres listes de signataires). Non poussé.

- Nouvel écran Paramètres généraux > Devise (#devise, ecrans/devises.html ; entrée de menu existante activée par regex, fil d Ariane, TITLES/GROUP, CFG devise dans barre_actions.js ; backups *.avant-devise). Champs : Code* (3 lettres ISO, unique, verrouillé), Libellé*, Nom des décimales, Nombre de décimales* (entier 0-6) ; section Billetage (Type* Billet/Pièce, Valeur faciale* > 0, pas de doublon par type, décimales <= nombre de décimales de la devise ; ajout / modification / suppression de ligne). 5 devises d exemple (MGA, USD, EUR avec billetage ; MUR, XOF sans). Exports Imprimer/PDF/Excel (une ligne par devise, billetage résumé). Liste exposée en window.DEVISES (+ devises-changed). Les listes Monnaie locale / Devise 1-3 d Informations générales ne lisent pas encore ce référentiel. Non poussé.

- RÈGLES D UNIFORMISATION (demande du jour) : (1) sous-section d un onglet de saisie = boutons d action en ICÔNES (+ nouvelle ligne, disquette enregistrer la ligne, flèche retour annuler) — appliqué au Billetage de Devise ; (2) Statut = toujours la case « Actif » dans la saisie ET la colonne Statut (badge + filtre) dans la liste — appliqué à Mode de règlement (liste déroulante -> case), Signataires, Devise (ajoutés), Type de passation / Type de marché (interrupteur -> case) ; déjà conformes : Pays, Journaux, Tiers, Plans. NON concernés car sans notion de statut : Type de taxe, Exercices, Racines, Configuration des plans, Devis programme, Procédures financières, Gestion des sélections, Rapprochement bancaire. Backups *.avant-statut. Non poussé.

- RÈGLE MISE À JOUR (sous-sections de saisie) : les boutons d action d une sous-section (ex. Billetage : + nouvelle ligne, disquette enregistrer, flèche annuler) vivent dans la barre d actions de page, en ICÔNES SEULES groupées à gauche des boutons principaux, séparées par un filet. Mécanisme : attribut data-ba-ico sur le bouton d origine (écran dans CFG de barre_actions.js) -> miroir .ba-ico dans un groupe .ba-ig, visible seulement quand la sous-section est affichée, état désactivé relayé. Billetage de Devise : tableau ajusté au contenu (344 px au lieu de pleine largeur), champs Type/Valeur 200 px max. Backups barre_actions.js.avant-ico, devises.html.avant-ico, charte.css.avant-ico. Non poussé (le push du jour a été refusé : noms réels restants dans Journal et grand livre).

- Devise > Billetage : panneau « Ligne de billetage » (Type, Valeur faciale) placé dans la zone libre à droite du tableau (grille 2 colonnes), piloté par les icônes de la barre (+ nouvelle ligne, disquette enregistrer, flèche annuler) et par le crayon / la corbeille de chaque ligne. Modes de ligne : aucun (panneau grisé), nouvelle (les ajouts s enchaînent), modification (une seule mise à jour). Icônes désactivées hors modification de la devise. Backup devises.html.avant-bcard. Non poussé.

- CORRECTION DE LA RÈGLE « sous-section » : les boutons d action en icônes se placent dans une BARRE D OUTILS A DROITE DE L EN-TETE de la sous-section (zone indiquée par l utilisateur), PAS dans la barre d actions de page. Billetage de Devise : [+ nouvelle][crayon modifier][corbeille supprimer] | [disquette enregistrer][flèche annuler] ; plus de colonne Actions dans le tableau : on sélectionne une ligne (clic, double-clic = modifier) puis on utilise la barre d outils. Champs Type/Valeur faciale restent en ligne au-dessus du tableau. Le mécanisme data-ba-ico de barre_actions.js (icones dans la barre de page) reste disponible mais n est plus utilisé. Backups devises.html.avant-bbar (version panneau latéral) et .avant-bcard. Non poussé.

- Devise > Billetage : statut par ligne (case « Actif » à côté de Type / Valeur faciale, colonne Statut avec badge dans les tableaux, exposé dans window.DEVISES[].billetage[].actif) ; liste en DEUX tableaux côte à côte : Billets à gauche, Pièces à droite (compteurs), la sélection de ligne et la barre d outils fonctionnent sur les deux. Backup devises.html.avant-bstat. Piège rencontré : passer une fonction fléchée comme remplacement dans un patch .cjs insère son code source (utiliser une chaîne). Non poussé.

- Devise > Billetage restructuré : deux tableaux pleine largeur de leur moitié (Billets à gauche, Pièces à droite), colonnes Type | Valeur faciale | Statut (30/35/35 %, largeurs fixes alignées), titres « Billets » / « Pièces » et compteurs supprimés. Backup devises.html.avant-btab. Non poussé.

- Sélecteur de produits de l en-tête (inerte dans la capture) reconstruit : liste déroulante avec SoftAccounting (courant, coche), Soft e-Payment (Paiements et encaissements électroniques) et Soft Budget (Élaboration et suivi budgétaire) ; clic hors maquette = message, Échap / clic extérieur ferment, flèches haut/bas. Source ecrans/produits.js GÉNÉRÉ par gen_produits.cjs (logos recadrés depuis logos/e-payment_capture.png et logos/budget_capture.png, captures basse résolution : remplacer par les vrais logos si disponibles) ; inclus dans build.cjs après barre_actions.js (backup build.cjs.avant-produits). Non poussé.

## Soft e-Payment (ecrans/epayment.js)
Ecran « Ordres de paiement » en couche plein ecran ouverte depuis le selecteur de produits (produits.js -> window.EPAYMENT.ouvrir()). Sidebar/en-tete propres, charte Softwell, donnees fictives en memoire (KPI cliquables, recherche, filtres colonnes, recherche avancee, tri, pagination, saisie modale, initier/approuver/rejeter/supprimer, exports CSV/XLSX/PDF). Seul « Ordres de paiement » est navigable. build.cjs concatene epayment.js avant produits.js. Non pousse.

Comptes emetteurs (e-Payment) : ecran liste+modale (Libelle, Banque, Titulaire, Pays, Devise, IBAN, BIC, Statut=Actif), exports, dans epayment.js (variable ecr = ecran courant). Non pousse.

Liste des banques (Parametres generaux) : ecrans/banques.html (4 sections Identification/Coordonnees bancaires/Adresse/Contact + statut Actif), branche dans build.cjs (screen, crumb, menu, TITLES/GROUP) et barre_actions.js (cfg banques). window.BANQUES + evenement banques-changed. Non pousse.

Pays : pays.html publie window.PAYS + evenement pays-changed ; Liste des banques (champ Pays) et Comptes emetteurs e-Payment (modale) = listes deroulantes sur les pays ACTIFS parametres. Non pousse.

Liste des banques : bouton « Recuperation Soft e-Payment » (modale de filtrage des comptes emetteurs e-Payment via EPAYMENT.comptes(), synchronisation par IBAN : creation/mise a jour). cfg banques plat:1 (pas de menu Plus dactions). Non pousse.

Modales d avertissement : ecrans/modale_alerte.js intercepte window.confirm/alert (modale charte : icone, titre, Annuler par defaut + bouton danger rouge pour Supprimer, avertissement pour Abandonner) ; rejoue le clic apres validation. Concatene avant epayment.js dans build.cjs. Non pousse.

PUSH 216d001 : variante PUBLICATION avec donnees pseudonymisees (anon_pub.cjs -> import_plans/publication/ : journal_donnees.json, glg_donnees.js, etat_depense.html, designer_soe.html, modele_etat_drf.html, gestion_acces.html ; PUB map dans build.cjs). Relancer anon_pub.cjs si les sources changent. Reste en clair volontairement : exemple generique « ENTREPRISE RAKOTO » (declaration fiscale).

Type de passation / Type de marche : reecrits (onglets Saisie/Liste, barre dactions globale, statut Actif, exports PDF/XLSX, import CSV) via gen_types.cjs + types_modele.tpl -> ecrans/type_passation.html et type_marche.html (ne pas editer a la main). Prefixes data-typa / data-typm (data-tp est pris par tft_param). cfg barre_actions passation/typemarche plat:1. Non pousse (dernier push 216d001).

Informations generales : option « Checklist cloture d exercice » (case a cocher, section Comptabilite) ; etat expose window.ENTITE_OPTIONS.checklistCloture + evenement entite-options-changed. Aucun ecran ne la consomme encore. Non pousse.

Cloture comptable (Parametres comptables) : ecrans/cloture.html (Reprise des tiers, comptes de resultat benefice/perte, cloture mensuelle en interrupteur), boutons Annuler/Enregistrer via barre dactions (cfg cloture), menu+crumb+TITLES/GROUP dans build.cjs. window.CLOTURE_CFG + evenement cloture-changed ; non consomme par dautres ecrans. Non pousse.

Cloture comptable : section « Checklist de cloture d exercice » (10 controles : periodes, brouillons, rapprochements, amortissements, analytique, comptes dattente, TVA, balance, lettrage, inventaire) avec cases Inclure / Bloquant ; editable seulement si ENTITE_OPTIONS.checklistCloture (sinon note + cases grisees). CLOTURE_CFG.checklist=[{id,actif,bloquant}]. Non pousse.

Cloture comptable : textes daide, intro checklist et bandeau jaune supprimes ; Reprise des tiers + comptes de resultat sur une ligne (grille 1fr/2fr). Non pousse.

Checklist cloture : (1) cloture.html — section checklist masquee tant que ENTITE_OPTIONS.checklistCloture est faux (window.CLOTURE_CONTROLES expose) ; (2) exercices.html — bouton « Clôturer l exercice » : option active => modale checklist (resultats simules, Marquer comme traite, cloture bloquee tant quun controle bloquant est ko), option inactive => confirmation simple ; renseigne la date de cloture. cfg exercices plat:1. Non pousse.

Listes deroulantes : regle « filtre sur Code ET Libelle partout ». combo_plans.js le fait deja pour les <select> « code — libelle » ; ecritures.js (boutons custom-select : Site, Journal, Compte, Tiers, contrat, ACT/BUD/FIN/GEO) avait un seul champ de recherche -> maintenant deux filtres alignes sur les colonnes Code | Libelle. barre_actions.js champ() ignore les inputs de .custom-select-dropdown/.cb-pan (sinon il les prenait pour la recherche de page et les masquait). Reste sans filtre : listes non « code — libelle » (signataires rapprochement, trimestres, referentiel comptable...). Non pousse.

Listes custom-select (ecritures.js) : presentation charte identique a combo_plans (en-tete Code|Libelle centre, filtres avec loupe, ligne choisie bleu clair #E3EBFE, libelle « Aucun/Selectionner » en gris gras) ; Exercice = colonne Code seule + un seul filtre (opts.sansLibelle). ecritures_donnees.js : entites &amp; &gt; decodees dans les libelles (backup .avant-amp). Non pousse.

Travaux periodiques (Comptabilite generale) : groupe de menu cg-travaux + 4 ecrans : clotper (cloture_periodique.html), clotmens (cloture_mensuelle.html), anouveaux (a_nouveaux.html), clotannuelle (cloture_annuelle.html). Dependances : window.EXERCICES_API (exercices.html : liste/cloturer), CLOTURE_CFG, ENTITE_OPTIONS ; etats partages PERIODES_CLOTUREES, CLOTURES_PERIODIQUES, A_NOUVEAUX. cfg barre_actions plat:1 pour chacun. modale_alerte : libelles Cloturer/Rouvrir/Generer/Annuler la cloture. Montants des a nouveaux simules. Non pousse (dernier push 216d001).

PUSH 3621b0e : variante PUBLICATION (anon_pub.cjs relance avant build). Contient clotures/travaux periodiques/listes Code-Libelle/types passation-marche.

Menu Comptabilite generale : groupe « Travaux periodiques » deplace apres « Petite caisse » (build.cjs). Non pousse (dernier push 3621b0e).

Cloture comptable : option « Cloture periodique » (CLOTURE_CFG.periodique, defaut actif) a droite de la cloture mensuelle ; desactivee => classe html.sans-travaux (charte.css) masque le groupe cg-travaux de la comptabilite generale. Option « Checklist cloture d exercice » activee par defaut (ENTITE_OPTIONS.checklistCloture=true dans informations_generales.html et cloture.html). Non pousse (dernier push 3621b0e).

Menu Travaux periodiques selon les options de Cloture comptable : periodique off => groupe entier masque ; mensuelle off => Cloture mensuelle, A nouveaux provisoires et Cloture annuelle masques (reste Cloture periodique). Classes html sans-travaux / sans-mensuelle (charte.css, posees par cloture.html). Non pousse (dernier push 3621b0e).

Cloture : (1) parametres de Cloture comptable et option checklist conserves au rechargement (localStorage softcompta.cloture / softcompta.checklistCloture, facultatif) ; (2) ecrans A nouveaux provisoires, Cloture annuelle, mensuelle, periodique : actions desactivees + message quand le parametrage les desactive. Non pousse (dernier push 3621b0e).

Lien interrupteurs/menus (Cloture comptable) : mensuelle -> entree Cloture mensuelle ; periodique -> entree Cloture periodique ; A nouveaux provisoires + Cloture annuelle masques seulement si les DEUX sont desactives (groupe Travaux periodiques masque aussi). Classes html sans-mensuelle / sans-periodique / sans-travaux (=les deux). Non pousse (dernier push 3621b0e).

Correction : si mensuelle ET periodique sont desactivees, seules les entrees Cloture mensuelle et Cloture periodique sont masquees ; A nouveaux provisoires et Cloture annuelle restent toujours disponibles (classe sans-travaux supprimee). Non pousse (dernier push 3621b0e).

Cloture annuelle : liste des exercices (periode, statut Ouvert/Cloture, date de cloture, cloture par) + situation de lexercice selectionne ; exercices.html memorise le champ par (superadmin) a la cloture et EXERCICES_API.liste le renvoie. Non pousse (dernier push 3621b0e).

Cloture annuelle : colonne « En cours » (case comme Exercices comptables) ; colonne Statut Ouvert/Cloture et libelle « Ouvert » supprimes (cloture = date + utilisateur renseignes). Non pousse (dernier push 3621b0e).

Cloture annuelle : colonne Periode remplacee par Date debut / Date fin. Non pousse (dernier push 3621b0e).

Cloture annuelle : cloture sur place (plus de navigation vers Exercices comptables ; la fenetre de checklist est deplacee dans body par exercices.html), regle « exercices precedents clotures d abord » (aussi dans Exercices comptables), bloc Situation supprime, evenement exercices-changed. Non pousse (dernier push 3621b0e).

A nouveaux provisoires : fusion avec la consultation des a nouveaux (capture) — apres generation : filtres (site, plan de regroupement[data-regr], compte general/auxiliaire, sens, devise), totaux debit/credit MGA et USD, grille detaillee 9 colonnes avec filtres par colonne, recherche, pagination 10/20/50/100/Tous, export Excel. Lignes simulees (comptes de classes 1-5 du plan charge, equilibrees ; reprise des tiers : detail => plusieurs lignes auxiliaires). A_NOUVEAUX[annee].lignes = detail. Non pousse (dernier push 3621b0e).

A nouveaux provisoires : champs de filtrage du haut (site, plan, comptes, sens, devise) supprimes — filtres par colonne conserves ; totaux debit/credit seuls. Non pousse (dernier push 3621b0e).

A nouveaux provisoires : encadre Total debit/credit deplace a droite du bandeau (meme ligne que Exercice source) ; colonne Exercice (exercice de destination N+1) ajoutee en premiere position (filtres de colonnes decales de 1, export inclus). Non pousse (dernier push 3621b0e).

Menu « A nouveaux provisoires » renomme « A nouveau » (menu, fil, titre). Ecran : bandeau Site + Exercice (exercice = celui qui recoit les a nouveaux, issus de N-1 ; generation impossible sans exercice precedent ou si N-1 cloture) ; A_NOUVEAUX cle « site|exercice ». Non pousse (dernier push 3621b0e).

A nouveau : bouton « Generer les a nouveaux provisoires » -> fenetre (exercice source non cloture suivi dun N+1, cible N+1 en lecture seule, comptes de capitalisation = resultat benefice/perte de Cloture comptable + reprise des tiers) ; regeneration autorisee (confirmation) ; la cloture annuelle de N (evenement exercices-changed) remplace les a nouveaux provisoires de N+1 par des a nouveaux DEFINITIFS (sites 01 et 02), non supprimables. cfg barre_actions mise a jour. Non pousse (dernier push 3621b0e).

A nouveau : bouton Excel du tableau supprime ; action bar : Saisie manuelle (modale ligne : compte combo filtrable, aux, sens, devise, montants ; double-clic pour modifier/supprimer), Importer (xlsx via DecompressionStream deflate-raw + csv ; controle, remplacer/ajouter, modele telechargeable), PDF, Excel (XLSX). Import/saisie desactives sur a nouveaux definitifs. Non pousse (dernier push 3621b0e).

A nouveau : a nouveaux provisoires presents par defaut (semer() : sites 01 et 02, exercices 2022 et 2023 issus de 2021 et 2022) ; la cloture annuelle de N les remplace par des definitifs. Non pousse (dernier push 3621b0e).

PUSH (voir git log deploy) : variante PUBLICATION apres anon_pub.cjs ; contient cloture annuelle, a nouveau, travaux periodiques lies aux parametres.

Exercices : tous du 01/01 au 31/12 (exercices.html : data + pre-remplissage du formulaire). Non pousse (dernier push ac1fb0b).

Importations Excel : assistant commun ecrans/import_assistant.js (colonnes attendues + obligatoire/format/exemple, modele Excel 2 feuilles Modele+Instructions via EXPORT_TABLEAU.modeleImport/xlsxFeuilles, lecture xlsx/csv). Branche sur : A nouveau (Importer), Types de passation/marche (Importer), e-Payment (Importation Excel, cree des brouillons). Reste hors perimetre : Rapprochement « Importer un releve » (simule). Non pousse (dernier push ac1fb0b).

A nouveau import : fenetre de controle elargie (1180 px) avec 3 onglets Lignes retenues / Lignes rejetees / Anomalies (visible seulement s il y a des rejets ; regroupees par regle + ecart debit-credit), bandeau de totaux, motif et valeurs brutes des lignes rejetees. Non pousse (dernier push ac1fb0b).

A nouveau : colonnes montants selon les monnaies de Administration de lentite (Monnaie locale, Devise 1..3) : « Montant local (MGA) », « Montant devise 1 (USD) », « Montant devise 2 (MUR) » ; colonne Devise et Montant rapport supprimees ; lignes {local,d1,d2,d3} ; taux dexemple TAUX (MGA/USD/EUR/MUR...). En-tete, totaux, saisie manuelle, exports, modele et import suivent les monnaies. Non pousse (dernier push ac1fb0b).

- Bilan : un seul module « Bilan » dans le menu États financiers ; Paramétrage et Édition deviennent des onglets du module (barre .bil-onglets en tête des deux écrans, entrée de menu reste active sur les deux). Manipulations inchangées. Autres états (Compte de résultat, Emplois et ressources, Flux) non modifiés. Non pousse (dernier push ac1fb0b).
- Bilan : bascule Paramétrage/Édition en bouton segmenté (au lieu d'onglets soulignés).
- Bilan : le bouton de bascule est dans la barre d'actions (Édition sur Paramétrage, Paramétrage sur Édition) ; bascule segmentée retirée.
- Bilan : bouton de bascule dans la barre d'actions, direct (genre 'nav', jamais dans Plus d'actions), a gauche des boutons ; attribut data-bil-vers.
- Bilan : bouton de bascule tout a droite de la barre, rempli bleu + fleche droite (classe ba-nav).
- Bilan : bouton de bascule meme largeur (min-width 120px) sur les deux ecrans.
- Etats financiers : meme principe que Bilan pour Compte de resultat, Emplois et ressources, Flux de tresorerie (menu a entree unique, bouton de bascule bleu a droite de la barre, data-bil-vers ; clic gere par barre_actions.js). Non pousse (dernier push ac1fb0b).
- PUSH caf7788 (depuis ac1fb0b) : exercices civils, assistant d'import/modeles Excel, a nouveau multi-monnaies, etats financiers a entree unique + bouton de bascule. Variante anonymisee.
- Assistant SoftAccounting IA : ecrans/assistant.js (fenetre de chat ouverte par le bouton rond « Ouvrir l'assistant », reponses simulees par regles sur donnees en memoire, liens de navigation, suggestions, Effacer/Reduire). Ajoute a build.cjs apres produits.js. Non pousse (dernier push caf7788).
- Assistant : analyses financiere (ratios, FR/BFR/tresorerie, rentabilite) et comptable (balance par classe, controles d'anomalies) sur donnees simulees FIN{} dans assistant.js ; chips dediees. Non pousse (dernier push caf7788).
- Assistant : mode plein ecran (bouton dans l'en-tete, Echap pour quitter) + graphiques SVG (barres groupees, anneaux) dans les analyses et sur demande (« graphique du bilan », « graphique des resultats », libre). Non pousse (dernier push caf7788).
- PUSH 3bf76f1 : assistant SoftAccounting IA (analyses, graphiques, plein ecran). Variante anonymisee.
- Assistant : extension d'aide (ecrans/assistant_aide.js, charge avant assistant.js) : index du menu lu dans la sidebar (y compris ecrans non integres), fiches d'ecran generees depuis le DOM, ~20 guides pas a pas, navigation (« ouvre ... »), analyse de la base en memoire (inventaire, qualite, tiers, plan par classe, balance auxiliaire, grand livre, recherche compte/tiers). Crochets AI_PLUGINS / AI_FALLBACK / AI_OUTILS dans assistant.js. Non pousse (dernier push 3bf76f1).
- PUSH 4aa7a38 : assistant IA aide fonctionnelle + analyse base. Variante anonymisee.
- Lettrage > Parametre : ecrans/lettrage_param.html (id lettparam ; format des lettres, ecart tolere + compte d'ecart, criteres du lettrage automatique ; window.LETTRAGE_CFG + localStorage softcompta.lettrage ; menu Comptabilite generale > Lettrage > Parametre en tete du groupe, barre Annuler/Enregistrer). Les 4 autres entrees du Lettrage restent non integrees. Non pousse (dernier push 4aa7a38).
- Lettrage > Parametre : bloc « Lettrage automatique » deplace a droite de « Lettres de lettrage » (ligne 1) ; « Lettrage approche » en ligne 2. Non pousse (dernier push 4aa7a38).
- Lettrage manuel (ecrans/lettrage_manuel.html, id lettmanuel) : criteres compte/tiers/du/au, liste a cocher, totaux D/C, Lettrer (lettre suivante selon le format, ecart tolere accepte, sinon refus), Delettrer (clic sur ligne lettree), etat dans localStorage softcompta.lettrageManuel. Parametre lettrage : cases « Meme numero de piece » et « Montants debit/credit equilibres (+- tolerance) » (LETTRAGE_CFG.memePiece/equilibre) : enregistrees, utilisees seulement par le futur lettrage automatique (non integre). Non pousse (dernier push 4aa7a38).
- Lettrage manuel : totaux figes au pied de page (sticky), liste a defilement interne avec en-tete fige.
- Regle generale des tableaux : ecrans/tableaux.js (charge en dernier) : tri au clic sur le nom de colonne (A/Z, Z/A, ordre d'origine) + ligne de filtres par colonne quand le tableau n'en a pas. Exclus : etats comptables/financiers (EXCLUS dans le fichier), tableaux de modales/barre/assistant, data-no-tf ; tables ayant deja leur tri propre (ex. Plan Tiers) gardent le leur. Non pousse (dernier push 4aa7a38).
- Lettrage manuel : totaux epingles en bas de page meme avec peu de lignes (colonne flex hauteur 100vh-250px, liste flex:1 a defilement interne), criteres/totaux compacts ; champs de filtre de colonne 26px (tableaux.js).
- Lettrage manuel : bouton « Rechercher » en tete de la barre (icone loupe, genre filter) ; criteres compte/tiers/du/au appliques seulement au clic (ou Entree), message « Criteres modifies... » en attente ; filtres de colonne toujours immediats ; Lettrer/Delettrer travaillent sur les criteres appliques. Non pousse (dernier push 4aa7a38).
- Lettrage manuel : filtre de statut « Non lettrees | Lettrees | Toutes » (bouton segmente, defaut Toutes) parmi les criteres, applique par Rechercher.
- Lettrage manuel : bouton « Lettrage automatique » (icone etincelles) -> fenetre de propositions : groupes selon LETTRAGE_CFG (critere montant / ref+montant / ref+montant+date +-5j, meme numero de piece, equilibre exact ou +- ecart tolere), numero de lettre propose modifiable (unicite controlee), case par proposition, « Valider le lettrage (n) ». Non pousse (dernier push 4aa7a38).
- Lettrage manuel : criteres sur une seule ligne compacte (champs 30px, labels 11px) avec « Rechercher » (bleu, loupe) a droite des filtres, hors barre d'actions (exception voulue) ; statut Non lettrees/Lettrees/Toutes dans la meme ligne. Non pousse (dernier push 4aa7a38).
- Lettrage manuel : mention « Criteres modifies » supprimee (les criteres restent appliques au clic sur Rechercher / Entree).
- Menu Lettrage : « Lettrage manuel » devient « Lettrage » (id lettmanuel inchange), entrees inertes « Lettrage automatique » et « Delettrage » supprimees (le lettrage automatique reste un bouton de l'ecran, le delettrage un bouton aussi) ; il reste Parametre / Lettrage / Prelettrage. Non pousse (dernier push 4aa7a38).
- Prelettrage : ecran genere depuis Lettrage par gen_prelettrage.cjs (appele par build.cjs ; id prelettrage ; prefixe data-lpr/.lpr- ; sans equilibre D/C, reference PRE-0001, sans lettrage automatique ; etat localStorage softcompta.prelettrage). Toute modif de lettrage_manuel.html se repercute au build. Filtres de colonne : hauteur 36->29px et police 12->9,6px (reduction d'un cinquieme) via style en ligne dans tableaux.js (tous ecrans hors etats). Non pousse (dernier push 4aa7a38).
- PUSH 2fe99d7 : lettrage (parametre, lettrage, auto, prelettrage), tableaux (tri/filtre), assistant. Variante anonymisee ; note : l'exemple « Telma Madagascar » (societe, vu dans la capture de l'utilisateur) figure dans les donnees d'exemple du lettrage publiees.
- Rapprochement bancaire > Releves (ecrans/releves.html, id releves, menu entre Configuration et Pointage) : creation de releves (compte configure, n°, date, periode, soldes, lignes saisies ou importees Excel Date/Libelle/Montant ; equilibre soldeIni+mouvements=soldeFin obligatoire), liste avec statut Non pointe/En cours/Pointe, bouton bleu « Pointage » (data-ba-nav, genre nav) -> POINTAGE_API.charger(releve) dans rapprochement_pointage.html puis #pointage (ecritures non pointees simulees, solde comptable deduit). Le bouton « Importer un releve » du Pointage renvoie vers Releves. window.RELEVES + localStorage softcompta.releves. Non pousse (dernier push 2fe99d7).
- Releves : plus d'entree de menu separee ; l'entree « Pointage » (id releves) ouvre la liste/creation des releves, le bouton « Pointage » ouvre l'ecran de rapprochement (id pointage, titre « Pointage du releve », fil d'Ariane a 3 niveaux) ; l'entree de menu reste active sur les deux. Non pousse (dernier push 2fe99d7).
- Releves : champs Banque, Periode du/au, Solde initial/final supprimes du formulaire ; periode = dates des lignes, solde initial = solde final du releve precedent du compte (ou valeur d'origine si premier), solde final = initial + mouvements (affiches dans le recapitulatif et la liste) ; plus de controle d'equilibre bloquant. Non pousse (dernier push 2fe99d7).
- Releves : liste reduite a Compte bancaire / N° de releve / Date / Lignes / Statut (colonnes Banque, Du, Au, soldes retirees).
- Releves : cloisonnement par compte bancaire (selecteur du compte actif en tete, liste et saisie limitees a ce compte, compte du formulaire impose/non modifiable) ; « Importer les lignes » (Excel Date/Libelle/Montant) reserve a la saisie d'un releve (grise dans la liste) ; Pointage : bouton « Importer un releve » retire, bouton « Liste des releves » (fleche gauche) de retour. Non pousse (dernier push 2fe99d7).
- Gestion des cours > Saisie : ecrans/cours.html (id cours ; Code monnaie (devises hors monnaie locale), Date, Parite = valeur d'une unite en monnaie locale ; unique par devise+date ; liste + import Excel Devise/Date/Parite ; window.COURS et COURS_API.taux(devise,date) ; localStorage softcompta.cours). Conversion et Cours applique restent non integres. Non pousse (dernier push 2fe99d7).
- Cours : cloisonnement par monnaie (selecteur « Monnaie » en tete ; liste et saisie limitees a la devise, devise du formulaire imposee, import limite a la monnaie choisie) ; parite USDMGA + contrevaleur MGAUSD (saisissables dans les deux sens, colonnes de liste et en-tetes dynamiques selon la devise). Non pousse (dernier push 2fe99d7).
- Gestion des cours > Conversion : ecrans/conversion.html (id conversion, menu apres Saisie) : elements a convertir (4 cases), periode du/au, Site et Journaux (multi-selection « Tous selectionnes (n) » / pastilles), « Convertir uniquement les montants nuls » ; boutons Convertir / Reinitialiser ; controle des cours (COURS) a la fin de periode pour Devise 1-3 de l'entite ; resultat simule + historique (localStorage softcompta.conversions). Seule « Cours applique » reste non integree dans ce groupe. Non pousse (dernier push 2fe99d7).
- Conversion : disposition de la capture (Du/au, Site, Journaux, « Choix des fichiers » = case + zone de synthese, « Monnaies » = monnaie des rapports (Devise 1) + montants nuls) ; Site/Journaux = multi-selection a panneau de la charte (cb-pan : filtres Code/Libelle, case par ligne, ligne « Tous » applicable aux lignes filtrees, pastilles « Tous selectionnes (n) », etat vide rouge avec alerte). Non pousse (dernier push 2fe99d7).
- PUSH bbfd60e : releves/pointage, gestion des cours (saisie, conversion), ajustements lettrage. Variante anonymisee.
- Petite caisse > Types d'operation (ecrans/caisse_types.html, patch_caissetypes.cjs) : liste + saisie (libelle, nature Depense/Recette, compte general filtrable, imputation analytique), CAISSE_TYPES. Non pousse.
- Types d'operation : case imputation analytique affiche les axes Activite / Ligne budgetaire / Zone geographique (PLANS_REF), au moins un requis (patch_caisse_ana.cjs). Non pousse.
- Petite caisse > Saisie (ecrans/caisse_saisie.html, patch_caissesaisie.cjs) : lots de caisse (n° lot, journal, compte, devise, solde initial) + bouton Ajouter des operations (fenetre : date, libelle, recette/depense, decharges, imputation = types d'operation + axes analytiques), CAISSE_LOTS. Non pousse.
- Types d'operation : liste = code seul (compte general), une colonne par plan analytique active (PLANS_ACTIFS, libelle = abrev), vide si sans analytique ; formulaires Types et Saisie caisse listent tous les plans actifs (window.CAISSE_PLANS, ana cle par code plan PLANx). patch_caisse_plans*.cjs. Non pousse.
- Petite caisse Saisie : champs Compte de caisse et Solde initial supprimes, ajout choix du Site (PLANS_REF.sites) ; liste = N° lot, Site, Journal, Devise, Operations, Solde final. patch_caisse_site.cjs. Non pousse.
- Petite caisse > Generation des ecritures (ecrans/caisse_generation.html, patch_caissegen.cjs) : liste des lots (compte caisse = compte du journal), Proposer schema comptable (ecritures debit/credit + analytique, equilibre) puis Generer (statut Genere, localStorage softcompta.caisseGen). Non pousse.
- Generation des ecritures : schema propose dans une fenetre (Site, Journal, N° lot ; colonnes Code, Date piece, Libelle, N° piece, Debit, Credit, Compte, Auxi, SS CPTE + plans analytiques ; Total ; Valider / Fermer), Valider genere. patch_caissegen2.cjs. Non pousse.
- Rapprochement > Situation refaite d'apres captures (rapprochement_situation.html) : 3 onglets (Situation du compte, Ecritures non rapprochees, Ecritures non passees), compte/releve/date/debut, 7 boutons d'impression Detail/Fiche, export CSV ; POINTAGE_API.ecrDe/etat exposes. Non pousse.
- Situation alignee charte (patch_sit_charte.cjs) : champs en libelles majuscules empiles dans un cadre 2 colonnes, bouton Excel neutre (plus de vert), releve 'numero — date'. Non pousse.
- Situation : Compte / Releve / Date du releve sur une ligne (date de debut supprimee) ; 7 boutons d'impression dans la barre d'actions (menu Plus d'actions). patch_sit_barre.cjs. Non pousse.
- Situation : bouton Excel de la carte supprime (reste Exporter dans la barre). Non pousse.
- Situation : masque d'impression 'Etat de rapprochement bancaire' (monnaie locale) pour les boutons (loc) et Fiche, fenetre A4 portrait (imprimerEtat, patch_sit_masque*.cjs). ATTENTION build.cjs injecte le masque dans toute chaine litterale '</style></head><body>' : la couper en morceaux. Non pousse.
- Situation : onglet Ecritures rapprochees (lignes du releve pointees, totaux). patch_sit_rapp.cjs. Non pousse.
- PUSH 3bfdd68 : petite caisse (types, saisie, generation), situation rapprochement + masque impression. Variante anonymisee.
- Archive des sources pour le binome : sources_softaccounting.zip (make_sources_zip.cjs), 2,6 Mo, verifiee : build identique. Non anonymisee, a ne pas publier.
- Depot git local des sources cree dans C:\Artefact (.gitignore, README.md, 2 commits) ; en attente du depot GitHub PRIVE (url) pour pousser. deploy/ ignore.
- PUSH sources : https://github.com/cisgsoftappli-rgb/Ressource-SoftAccounting (main, 14ff422). Depot prive (a verifier).
- Depot sources laisse PUBLIC sur decision de l'utilisateur (donnees non anonymisees dans les sources). Ne pas y ajouter de documents clients.
- Fusion lieu-affectation (binome) dans main, pousse. Ecran Lieu d'affectation + menu Immobilisations.
- PUSH publication 2b89ee2 : Immobilisations > Lieu d'affectation (variante anonymisee).
- Gestion des devis programmes : interrupteur deplace dans Administration de l'entite > Informations generales (a cote de la checklist, option ENTITE_OPTIONS.gestionDP, localStorage softcompta.gestionDP, defaut desactive) ; desactive = menu Devis programme masque (html.sans-dp) et ecran en lecture seule. patch_dp_option.cjs, patch_dp_masque.cjs. Non pousse.
- Configuration des plans > plan financier (PLAN3) : liste 'Type de niveau' (CONVENTION / CATEGORIE, un niveau par type) dans le formulaire et la liste des niveaux. PLANS_CFG[].niveaux[].type. patch_plan_type.cjs. Non pousse.
- Interrupteur Gestion DP corrige : meme composant que l'onglet Analytique (case a cocher sans apparence, .ig-sw). patch_dp_switch.cjs. Non pousse.
- Administration de l'entite : onglet Personnalisation (ecrans/personnalisation_entite.html, ajoute en 4e position dans build.cjs) : sections Comptabilite (referentiel, checklist cloture, gestion DP) et Monnaies deplacees depuis Informations generales ; scripts ENTITE_OPTIONS dans le nouveau fichier (ils doivent suivre les elements dans le document). patch_onglet_perso.cjs, patch_perso_scripts.cjs. Non pousse.
- Procedures financieres : nouvel onglet Selection (charte : bp-tb, filtres/tri, fenetre, boutons Nouvelle selection/Modifier/Supprimer dans la barre d'actions ; PF_SELECTIONS, localStorage softcompta.pfSelections) ; l'onglet Selection a ete retire de Gestion des selections (reste l'axe de la convention). patch_pf_selection.cjs. Non pousse.
- Procedures financieres : onglets principaux Procedure / Selection ; Selection = sous-onglets Saisie (formulaire en ligne, plus de fenetre) / Liste ; colonne Journaux = nombre. patch_pf_onglets.cjs. Non pousse.
- Module Gestion des selections SUPPRIME (menus Parametres financiers et Projets & Bailleurs, ecrans gestsel/gestsel2, fichier gestion_selections.html, droits d'acces, traces, aide assistant). L'axe de la convention n'existe plus ; les selections sont dans Procedures financieres > Selection. patch_suppr_gestsel.cjs. Non pousse.
- Devis programme : titre de page (eyebrow + h1), bandeau 'Devis programme / Projet', pastille Consultation et etat Gestion des DP supprimes (data-sans-titre ignore par charte_titres.js). patch_dp_entete.cjs. Non pousse.
- Procedures financieres > Selection : journaux en tableau Code | Libelle avec filtre par colonne et selection par ligne (patch_pf_journaux.cjs). Non pousse.
- PUSH sources 069dddd + publication cba80ca (fusion avec le commit de publication du binome 58b1790, build complet reconstruit).
- REGLE : toujours fusionner (fetch + merge) avec le depot de publication maquette-SoftAccounting avant de pousser ; jamais de force-push. Voir README.md.
- Procedures financieres activables (Administration de l'entite > Personnalisation > Procedures financieres : IDA, FIDA, FED, FM, BAD ; defaut IDA+FIDA ; ENTITE_OPTIONS.procedures, localStorage softcompta.procedures, PROCEDURES_ACTIVES()). Effets : le module 'Gestion des demandes de remboursement' devient un module par procedure dans Comptabilite Projets & Bailleurs (groupes drf-<PROC>, data-proc, fil d'Ariane = procedure courante) ; Parametres > Procedures financieres ne propose que les procedures actives (BAD ajoutee). patch_procedures.cjs. Non pousse.
- Concepteur SOE (designer, designer_soe.html) aligne charte : palette (bleu 2E427B a la place du vert/rose), modes Designer/Sources/JSON/Apercu en onglets sous l'en-tete, Retour + Enregistrer dans la barre d'actions (sans emoji). Autres concepteurs (designer2 / listingdes) non touches. patch_designer_charte.cjs. Non pousse.
- Designer modele d'etat (designer_declaration.html, designer2) : onglet Donnees (rubriques placees dans la grille avec cellule correspondante : liste, ajout par adresse + type, editeur de la rubrique) ; l'onglet Grille ne garde que la conception du tableau (tableaux, position, dimensions, fusion, largeurs, mise en forme des cellules) avec bouton 'Definir les donnees de la cellule'. patch_designer_donnees.cjs. Non pousse.
- Designer modele d'etat > Donnees : sous-onglets Saisie (adresse de cellule + donnees de la rubrique) et Liste (rubriques, Ajouter / Modifier, double-clic). patch_designer_donnees2.cjs. Non pousse.
- Designer > Grille : gauche = Tableaux du modele + Structure de la grille seulement (position/taille, largeurs de colonnes et hauteurs de lignes retirees de la liste) ; droite = Mise en forme de la cellule (dimensions colonne/ligne de la cellule, police, bordure, paragraphe), sans champ Cellule ni contenu. patch_designer_grille.cjs. Non pousse.
- Designer modele d'etat : masque d'impression PDF par defaut (en-tete logo + titre du projet + QR ; pied = bandeau + 'Edite le [Date] par [Utilisateur]' en bas de feuille), images reelles du masque (window.__MASQUE) au lieu des noms de fichiers, geometrie par defaut calquee sur le masque pour les autres modeles. patch_designer_masque.cjs. Non pousse.
- Designer > Donnees refait sur le modele du parametrage des rubriques d'etats financiers (tft_param) : boutons Ajouter/Modifier/Supprimer, onglets Saisie/Liste, liste filtrable (Cellule, Libelle, Nature, Type, Type de mouvement, Rupture) ; Saisie = Cellule + Libelle, Nature (Titre/Grille/Regroupement/Formule/Constante), Style, Type / Type de mouvement / Sens, rupture, zone propre a la nature. patch_designer_donnees3.cjs. Non pousse.
- Immobilisations > Lieu d'affectation (ecrans/lieu_affectation.html, #lieuaffect) : onglet Structure & codification calque sur Configuration des plans (sous-onglets Saisie/Liste, icones, Niveau / Libelle / Format / Nombre de caracteres) ; le format filtre le code des lieux ; niveau utilise fige ; seul le dernier niveau vide est supprimable ; ecran vide au depart. Pousse (commit cd66c32) et publie (58b1790).
- Immobilisations > Collaborateur responsable (ecrans/collaborateur_responsable.html, #collabresp, sous Lieu d'affectation) : meme principe que Lieu d'affectation (niveaux, format, arbre, rattachement). Ecran GENERE par copie de lieu_affectation.html avec prefixes cor-/data-cor et libelles adaptes : pour un changement commun, modifier d'abord Lieu d'affectation puis reporter. window.COLLABORATEURS_RESPONSABLES + evenement collaborateurs-responsables-changed. Branche collaborateur-responsable (commit 63c18f9), a fusionner dans main par pull request.
- PUBLICATION 0fe1157 (fusion avec le depot de publication cba80ca du binome, build anonymise reconstruit depuis main d22ee41 + collaborateur-responsable ; main seul reconstruit == fichier publie, controle fait avant ecriture). Site : https://maquette-softaccounting.onrender.com/ verifie (ecran present). Pour reconstruire la variante publiee il faut le dossier import_plans/ (hors depot, donnees anonymisees) ; node.exe : C:\Program Files\nodejs\node.exe ; git config core.autocrlf false dans le clone.
- Immobilisations > Famille d'immobilisations (ecrans/famille_immobilisation.html, #famimmo, sous Collaborateur responsable) : onglets Saisie/Liste ; Informations generales (code, libelle, nature, Actif, description), Parametres comptables (comptes immobilisation / amortissement / dotation / sortie / plus-value / moins-value : plan comptable window.PLAN_COMPTABLE, le compte d'immobilisation est limite a la classe 2), Parametres d'amortissement (amortissable, methode lineaire/degressif, duree ans/mois, taux calcule automatiquement, prorata, date de debut, periodicite). Ecran vide au depart. window.FAMILLES_IMMOBILISATION + evenement familles-immobilisation-changed. Commit f99ea76 (meme branche collaborateur-responsable que l'ecran precedent : une seule pull request pour les deux).
- PUBLICATION 4adf2d0 (depot de publication deja a jour a 0fe1157 avant le push ; seules 5 lignes changent par rapport au fichier publie : menu, TITLES, GROUP, MODULE, barre d'actions). Site : https://maquette-softaccounting.onrender.com/ verifie.
- PUSH sources 3e5fbce + publication da1a87f : fusion de la branche collaborateur-responsable du binome (Collaborateur responsable, Famille d'immobilisations) ; conflit barre_actions.js resolu a la main. ATTENTION : le binome publie parfois avant d'avoir pousse ses sources — toujours verifier git ls-remote --heads du depot de sources avant de publier.
- Designer > Donnees > Grille : choix des axes en liste verticale (Compte, plans analytiques actifs ACT/BUD/FIN/GEO, Categories, Tiers, Comptes-Tiers, Journal, Site) + tableau Min/Max/Sens par axe, boutons + / enregistrer / annuler, badge du nombre de fourchettes. patch_designer_axes.cjs. Non pousse.
- PUSH sources 7f4e581 + publication b315df4 : designer d'etat, choix des axes.
- Designer > Donnees > Saisie : Cellule en liste deroulante (adresse — libelle) a cote du Libelle, textes indicatifs et option 'ligne de rupture' supprimes, boutons Ajouter/Modifier/Supprimer/Enregistrer/Annuler a droite (Enregistrer valide nature + libelle, Annuler restaure la rubrique). patch_designer_donnees4.cjs. Non pousse.

- Designer : onglets En-tete/pied et Document supprimes ; panneau de droite de l'onglet Designer = proprietes du champ selectionne (nom, contenu, position, taille, police, couleur, alignement, gras) ou, au clic sur le vide/corps, du document (format, marges, hauteurs, listes en-tete/pied avec ajout, filigrane). Non pousse.
- Designer : plus de blocs En-tete/Pied dans le panneau ; contenu et mise en page par element (onglets Contenu / Mise en page), ajout Texte/Image par zone via barre au-dessus de la feuille. Non pousse.
- Designer : proprietes d'element par type (Texte : contenu, police/taille/couleur/gras/italique/souligne/alignements, position ; Image : source, dimensionnement/ajustement/proportions, position), modifiables uniquement apres clic sur l'element. Non pousse.
- Concepteur SOE : onglet 'Sources & mise en page' scinde en 'Donnees' (Sources de donnees, Regroupement et niveau de detail) et 'Mise en page' (document, filigrane, en-tete, pied). Non pousse.
- Concepteurs d'etat : en-tete uniformise (Retour, titre + sous-titre, boutons icone ; ligne outils a gauche + onglets de vue en boutons a droite + Enregistrer) sur Concepteur SOE, Designer declaration, Designer listing (couleurs charte). Non pousse.
- Concepteur SOE > Donnees : Sources de donnees en sous-onglets Liste / Saisie (Enregistrer, Annuler). Non pousse.
- Concepteur SOE : champs/boutons des onglets Donnees et Mise en page alignes charte (36px, bordures, boutons), textes indicatifs retires. Non pousse.
- Nouvel ecran Gestion des contrats > Saisies > Fiche contrat (ecrans/fiche_contrat.html) : Saisie/Liste, informations generales, sous-onglets Ventilation (plans analytiques actifs, devises, Forex), Modalites de paiement, Execution, Lettres de garantie ; enregistre dans builds, barre_actions, assistant_aide. Non pousse.
- Nouvel ecran Gestion des contrats > Suivi et historique > Suivi des contrats (ecrans/suivi_contrats.html) : criteres (multi-selections, axe de rupture, date d'etat, types, compte fournisseur, monnaie, axes analytiques Du/Au), resultat 12 colonnes du modele suivi_des_marches.xlsx avec sous-totaux et total, exports PDF/Excel ; donnees fictives (le fichier client n'est pas embarque). Non pousse.
- Suivi des contrats : presentation etats comptables (charte) ; criteres dans une pop-up (Critères / Rechercher / Reinitialiser / Annuler), barre Critères-PDF-Excel, etat avec titre et sous-totaux. Non pousse.
- Suivi des contrats : Axes analytiques a droite de Criteres de selection dans la pop-up (2 colonnes, repli en 1 colonne sous 900 px). Non pousse.
- Suivi des contrats : pop-up sans titre/sous-titre d'en-tete ni titre 'Choix de la monnaie'. Non pousse.
- Nouvel ecran Gestion des contrats > Suivi et historique > Detail d'un contrat (ecrans/detail_contrat.html) : pop-up criteres (centre de saisie, code du contrat, periode, monnaie locale/rapport via COURS_API), identification, montants initial/avenant/total, paye/facture/soldes, decomptes (recherche, Excel, PDF, pagination). Donnees simulees. Non pousse.
- Tableaux Suivi des contrats / Detail d'un contrat : police alignee sur les tableaux charte (en-tete 12px/600/#0B1332 sans majuscules, cellules 13px). Non pousse.
- Detail d'un contrat : champs compacts (identification en 3 colonnes + montants a droite), plus de scroll de page, decomptes pagines (10 par defaut), icone export Excel supprimee. Non pousse.
- Nouvel ecran Gestion des contrats > Saisies > Generation des reliquats (ecrans/generation_reliquats.html) : onglets Simulation et Generation / Journal des operations ; exercices N et N+1, simulation, contrats eligibles a cocher, generation, journal pagine (localStorage softcompta.reliquats). Non pousse.
- Immobilisations > Saisies > Liste d'immobilisations (ecrans/fiche_immobilisation.html, #immolist, groupe de menu Saisies) : liste + saisie d'une fiche. Onglet General : informations generales (annee = exercices EXERCICES_API, site = PLANS_REF.sites, reference facture, designation, compte general classe 2, quantite, prix unitaire, valeur d'acquisition calculee, dates d'acquisition (dans l'exercice) et de mise en service, montants dans les devises actives d'apres COURS_API) et informations complementaires (n° d'identification propose IMM-annee-NNN, etat, famille = FAMILLES_IMMOBILISATION, emplacement = LIEUX_AFFECTATION, responsable = COLLABORATEURS_RESPONSABLES). Onglet Ecritures : fournisseur collectif (comptes 40x de PLANS_REF.tiers), compte auxiliaire (tiers du collectif), ventilation analytique par plan (Plan 1 a 10, plans non actives grises ; PLANS_ACTIFS / PLANS_LIGNES). Bouton Generer ecriture (barre d'actions + bloc Ecriture comptable) : fiche enregistree + collectif et auxiliaire renseignes ; ecriture automatique debit compte general (imputations analytiques) / credit collectif+auxiliaire dans le premier journal d'achats actif (hypothese : le journal n'est pas dans la capture), n° de piece par JOURNAUX_NUMERO ; fiche -> 'Ecriture generee', non modifiable. window.FICHES_IMMOBILISATION, window.ECRITURES_IMMOBILISATIONS (evenement ecritures-immobilisation-generees) ; les ecritures ne sont pas encore visibles dans Saisie d'ecritures (pas de stockage de pieces). Commit a8b249b, branche fiche-immobilisation (partie de main de0fc0e).
- PUBLICATION 2bd1829 (depot de publication avance par le binome jusqu'a b315df4 avant le push : sources de main de0fc0e deja incluses ; seules 5 lignes remplacees par rapport au fichier publie : menu, TITLES, GROUP, MODULE, barre d'actions). Site https://maquette-softaccounting.onrender.com/ verifie (9161602 octets).
- Liste d'immobilisations > onglet General : bloc « Informations de cession / sortie » (case Immobilisation cedee ou sortie ; type de sortie Cession / Mise au rebut / Don / Perte-vol ; date de cession >= mise en service ; valeur de cession et cessionnaire (obligatoires pour une Cession) ; reference de la facture de cession ; motif). Calculs en lecture seule d'apres la famille (methode, duree, taux depuis la mise en service, decompte en mois) : amortissements cumules, VNC, plus-value ou moins-value de cession. Les informations de cession restent modifiables apres la generation de l'ecriture d'acquisition (le reste de la fiche est verrouille) ; une fiche cedee ne peut plus etre supprimee. Exposition : window.FICHES_IMMOBILISATION[].sortie. Pas fait : ecriture de cession (sortie, solde de l'amortissement, plus/moins-value) car la famille n'expose pas ses comptes de sortie / plus-value / moins-value. Commit 86a51cf, fusion de origin/main (Gestion des contrats) eeac099.
- PUBLICATION ade27a9 (sur dcc2915 du binome : le fichier du binome == build de main seul, le notre n'ajoute que la cession). Incident : le binome a publie (dcc2915) pendant notre rebase ; le rebase s'est arrete faute d'identite Git (git config user.name / user.email dans deploy/) ; rebase abandonne, deploy remis sur origin/main, build reapplique par-dessus, push sans force. Site https://maquette-softaccounting.onrender.com/ verifie (9287931 octets). Toujours : git fetch juste avant de copier le fichier et pousser, et configurer l'identite Git dans deploy/.
