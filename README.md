# Amaterest

`amaterest` est maintenant la racine cible du projet Pinterest + Amazon. L'objectif est de pouvoir faire :

```powershell
cd C:\Users\leves\Documents\New project\amaterest
npm install
npm run dev
```

sans dépendre du dossier parent.

## Ce que contient cette racine

- `app/` : pages Next.js et routes API
- `lib/` : logique Pinterest, Amazon et lecture d'environnement
- `public/` : assets publics utilises par l'app
- `.env.local.example` : modele d'environnement
- `package.json` : scripts npm autonomes

Les dossiers `pinterest-launch/` et `site/` sont conserves comme assets et references de travail existantes.

## Installation

Depuis ce dossier :

```powershell
cd C:\Users\leves\Documents\New project\amaterest
npm install
```

## Creer `.env.local`

```powershell
Copy-Item .env.local.example .env.local
```

Puis remplir au minimum :

- `PINTEREST_APP_ID`
- `PINTEREST_APP_SECRET`
- `PINTEREST_REDIRECT_URI`
- `PINTEREST_ACCESS_TOKEN`
- `PINTEREST_TEST_BOARD_ID`
- `AMAZON_PRODUCT_URL_DRAWER_1` ou une autre URL Amazon de test

Pour la demo OAuth locale, la redirect URI doit pointer vers :

```text
http://localhost:3301/pinterest/callback
```

Si `PINTEREST_TEST_IMAGE_URL` est vide, l'API utilise automatiquement :

```text
http://localhost:3301/icon-512.png
```

quand le serveur tourne sur `3301`.

## Lancer le projet

```powershell
npm run dev
```

ou pour le port de test :

```powershell
npm run dev:test
```

## Demo Pinterest OAuth

Ouvrir ensuite :

```text
http://localhost:3301/pinterest-demo
```

Parcours conseille pour la video :

1. Cliquer sur `Connect Pinterest`
2. Autoriser l'application Pinterest
3. Revenir automatiquement sur `/pinterest/callback`
4. Laisser la page revenir sur `/pinterest-demo`
5. Cliquer sur `Load Boards`
6. Selectionner le board cible
7. Cliquer sur `Use sample Amazon product`
8. Lancer `Dry Run` ou `Create Test Pin`

## Pinterest Launch

Ouvrir aussi :

```text
http://localhost:3301/pinterest-launch
```

Cette page permet de :

- voir les 10 pins de lancement
- lancer un dry-run pin par pin
- lancer un dry-run en lot
- garder un bouton `Publish all` visible
- copier le lancement en JSON ou CSV

Variables utiles pour ce lot :

- `PINTEREST_ENABLE_PUBLISH=false`
- `PINTEREST_LAUNCH_BOARD_ID`
- `PINTEREST_SCHEDULE_TIMEZONE=America/Toronto`
- `PINTEREST_DAILY_SLOTS=09:00,14:00,20:00`
- `PINTEREST_FALLBACK_IMAGE_URL`

Pour les visuels des 10 pins :

- deposer les images finales dans `public/pinterest-launch/`
- utiliser les noms `pin-01.jpg` a `pin-10.jpg`
- si une image dediee manque, l'app utilise automatiquement un fallback
- l'UI de `/pinterest-launch` affiche clairement `local image`, `fallback image` ou `test image`

Checklist avant canary publish reel :

- deployer la derniere version sur Cloudflare Pages
- verifier en local que `http://localhost:3301/pinterest-launch/pin-01.jpg` repond avec `Content-Type: image/jpeg`
- verifier que `https://amaterest.pages.dev/pinterest-launch/pin-01.jpg` affiche directement l'image
- verifier que l'URL publique repond avec `Content-Type: image/jpeg`
- ne pas publier tant qu'une URL `/pinterest-launch/pin-*.jpg` publique renvoie la homepage ou du HTML
- garder `PINTEREST_PUBLIC_BASE_URL=https://amaterest.pages.dev` pour les URLs image destinees a Pinterest

## Tester les routes Pinterest

Boards :

```powershell
Invoke-RestMethod -Uri http://localhost:3301/api/pinterest/boards
```

Test pin :

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3301/api/pinterest/test-pin -ContentType 'application/json' -Body '{}'
```

Test pin sans publication reelle :

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3301/api/pinterest/test-pin -ContentType 'application/json' -Body '{"dryRun":true}'
```

Dry-run du lot de lancement :

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3301/api/pinterest/launch/dry-run -ContentType 'application/json' -Body '{}'
```

Publish du lot de lancement :

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3301/api/pinterest/launch/publish -ContentType 'application/json' -Body '{}'
```

## Pinterest Schedule

Ouvrir aussi :

```text
http://localhost:3301/pinterest-schedule
```

Cette page permet de :

- voir la queue locale de publication
- planifier automatiquement `3 pins / jour`
- vider les dates planifiees sans supprimer les pins
- lancer manuellement `Run due now`
- forcer `Dry-run due now`
- garder `Publish due now` visible mais securise

## Pinterest Library (Phase 2)

Ouvrir aussi :

```text
http://localhost:3301/pinterest-library
```

Cette page ajoute un content engine local :

- 20 produits premium centralises
- 3 angles par produit (60 pins de base)
- scoring `overallScore /100` avec tier `A/B/C`
- suivi performance local (impressions, clicks, saves, winner)
- export JSON/CSV
- envoi de pins selectionnees vers le scheduler existant

Routes library :

```powershell
Invoke-RestMethod -Uri http://localhost:3301/api/pinterest/library/list
Invoke-RestMethod -Uri http://localhost:3301/api/pinterest/library/export?format=json
Invoke-RestMethod -Uri http://localhost:3301/api/pinterest/library/export?format=csv
Invoke-RestMethod -Method Post -Uri http://localhost:3301/api/pinterest/library/send-to-scheduler -ContentType 'application/json' -Body '{\"pinIds\":[\"lib-pantry_airtight_01-before-after\"]}'
Invoke-RestMethod -Method Post -Uri http://localhost:3301/api/pinterest/library/performance -ContentType 'application/json' -Body '{\"pinId\":\"lib-pantry_airtight_01-before-after\",\"winningPin\":true}'
```

## Pinterest Ops (Phase 3)

Ouvrir aussi :

```text
http://localhost:3301/pinterest-ops
```

Routes ops + monetization :

```powershell
Invoke-RestMethod -Uri http://localhost:3301/api/pinterest/ops/summary
Invoke-RestMethod -Method Post -Uri http://localhost:3301/api/pinterest/ops/run-qa
Invoke-RestMethod -Method Post -Uri http://localhost:3301/api/pinterest/ops/fill-30-days
Invoke-RestMethod -Method Post -Uri http://localhost:3301/api/pinterest/ops/generate-winner-variants
Invoke-RestMethod -Method Post -Uri http://localhost:3301/api/pinterest/ops/send-ready-to-scheduler
Invoke-RestMethod -Method Post -Uri http://localhost:3301/api/pinterest/ops/run-cycle
Invoke-RestMethod -Uri http://localhost:3301/api/pinterest/ops/export?format=json
Invoke-RestMethod -Uri http://localhost:3301/api/pinterest/ops/export?format=csv
Invoke-RestMethod -Method Post -Uri http://localhost:3301/api/pinterest/monetization/affiliate-url -ContentType 'application/json' -Body '{\"productKey\":\"pantry_airtight_01\",\"amazonAffiliateUrl\":\"https://amzn.to/xxx\"}'
Invoke-RestMethod -Method Post -Uri http://localhost:3301/api/pinterest/monetization/affiliate-url/bulk -ContentType 'application/json' -Body '{\"format\":\"csv\",\"payload\":\"productKey,amazonAffiliateUrl\\npantry_airtight_01,https://amzn.to/xxx\"}'
```

Variables utiles pour le scheduler :

- `PINTEREST_ENABLE_PUBLISH=false`
- `PINTEREST_LAUNCH_BOARD_ID`
- `PINTEREST_SCHEDULE_TIMEZONE=America/Toronto`
- `PINTEREST_DAILY_SLOTS=09:00,14:00,20:00`

Routes scheduler :

```powershell
Invoke-RestMethod -Uri http://localhost:3301/api/pinterest/schedule/list
Invoke-RestMethod -Method Post -Uri http://localhost:3301/api/pinterest/schedule/fill -ContentType 'application/json' -Body '{}'
Invoke-RestMethod -Method Post -Uri http://localhost:3301/api/pinterest/schedule/run -ContentType 'application/json' -Body '{"mode":"auto"}'
Invoke-RestMethod -Method Post -Uri http://localhost:3301/api/pinterest/schedule/dry-run-due -ContentType 'application/json' -Body '{}'
Invoke-RestMethod -Method Post -Uri http://localhost:3301/api/pinterest/schedule/publish-due -ContentType 'application/json' -Body '{}'
```

## Pinterest Ops / Phase 5 Live

Ouvrir :

```text
http://localhost:3301/pinterest-ops
```

Cette page ajoute le centre de controle live :

- `Canary publish 1 pin` publie une seule pin reelle, seulement si `PINTEREST_ENABLE_PUBLISH=true`
- `Sync analytics` recupere les metriques des pins deja publiees
- `Recently published`, `Top performers`, `Needs review` et `Confirmed winners` donnent la revue quotidienne

Variables utiles :

- `PINTEREST_ENABLE_PUBLISH=false`
- `PINTEREST_CANARY_BOARD_ID=`
- `PINTEREST_ANALYTICS_LOOKBACK_DAYS=30`
- `PINTEREST_LIVE_PUBLISH_LIMIT=1`
- `PINTEREST_AD_ACCOUNT_ID=` requis pour l'endpoint Pinterest analytics pins

Routes live :

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3301/api/pinterest/publish/canary -ContentType 'application/json' -Body '{"boardId":"<board_id>"}'
Invoke-RestMethod -Uri http://localhost:3301/api/pinterest/analytics/list
Invoke-RestMethod -Method Post -Uri http://localhost:3301/api/pinterest/analytics/sync -ContentType 'application/json' -Body '{}'
```

Le fichier local `data/pinterest-published.json` garde l'historique des publications reelles :

- `internalPinId`
- `pinterestPinId`
- `productKey`
- `boardId`
- `title`
- `description`
- `link`
- `imageUrl`
- `publishedAt`
- `publishMode`
- `result`
- `errorMessage`

Regles winner :

- `winnerCandidate` apres un minimum de volume et premiers signaux
- `confirmedWinner` seulement apres plus de volume et au moins 2 jours live
- `generateVariantsReady=true` uniquement quand `confirmedWinner=true`

Checklist readiness integree dans `/pinterest-ops` :

- website claimed
- Amazon Storefront linked, si utilise
- board live pret
- publish enabled
- write scopes actifs
- canary publish valide
- analytics sync valide

## Notes

- Les secrets ne sont jamais codés en dur.
- L'app lit `process.env` uniquement depuis cette racine quand elle est lancee ici.
- Les erreurs d'environnement sont renvoyees comme erreurs metier claires, pas comme `404`.
- Le token OAuth Pinterest de demo reste cote serveur dans une session locale minimale et n'est jamais rendu dans le HTML.

## Publier sur GitHub

`amaterest` peut maintenant vivre comme depot autonome, independamment du dossier parent.

Une fois le depot GitHub vide cree, depuis ce dossier :

```powershell
git remote add origin https://github.com/<owner>/amaterest.git
git push -u origin main
```

Important :

- ne pas versionner `.env.local`
- partager uniquement `.env.local.example`
- travailler depuis `C:\Users\leves\Documents\New project\amaterest`
