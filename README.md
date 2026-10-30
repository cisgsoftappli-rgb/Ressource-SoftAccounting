Sources SoftAccounting (maquette) — dossier de travail à placer dans C:\Artefact (ou tout dossier).

Construire : node build.cjs   → SoftCompta_Administration_entite.html
Tester     : node serve.cjs   → http://localhost:4322/SoftCompta_Administration_entite.html
Publier (anonymisé, une seule personne, depuis la version fusionnée) :
  node anon_pub.cjs ; PUBLICATION=1 node build.cjs ; node scan_pub.cjs
  puis copier SoftCompta_Administration_entite_publication.html vers deploy/index.html (dépôt de publication) et pousser.

Ajouter un écran : créer ecrans/<nom>.html ; dans build.cjs ajouter le div data-screen, le fil d'Ariane, l'entrée de menu (child), TITLES / GROUP / MODULE ;
dans ecrans/barre_actions.js une entrée CFG ; dans ecrans/assistant_aide.js la description et le guide. Voir PASSATION.md.
Attention : ne jamais écrire la chaîne littérale </style></head><body> dans un écran (build.cjs y injecte le masque) ; la couper en morceaux.
Ne pas écraser deploy/index.html à la main : c'est un fichier construit.
## Travail à deux (dépôt privé)
- Une branche par personne ou par écran : `git switch -c lieu-affectation`, commits fréquents, pull request vers `main`.
- Avant de commencer : `git pull`. Fichiers partagés qui entrent en conflit : `build.cjs`, `ecrans/barre_actions.js`, `ecrans/assistant_aide.js` (une ligne par écran ; garder les deux côtés).
- Publication : une seule personne, depuis `main` à jour (voir plus haut). Le dépôt de publication (`deploy/`) est un autre dépôt, ignoré ici.
