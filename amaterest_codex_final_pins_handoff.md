# Amaterest — Handoff Codex pour intégration des pins finaux

## Objectif
Intégrer les **pins finaux Pinterest** dans le projet **Amaterest**, avec les vrais visuels, les bons liens Amazon, le pipeline de lancement, et le scheduler déjà en place.

---

## Racine du projet
```text
C:\Users\leves\Documents\New project\amaterest
```

Tout doit tourner **dans `amaterest` uniquement**.

---

## Statut actuel du système
Le projet est déjà structuré et fonctionnel localement.

### Déjà en place
- app Next.js autonome dans `amaterest`
- démo OAuth Pinterest : `/pinterest-demo`
- callback Pinterest : `/pinterest/callback`
- lecture des boards OK
- board de test existant : `Amazon Finds Organisation Maison`
- board id connu : `1132303600003950351`
- système de lancement des 10 pins : `/pinterest-launch`
- exports JSON / CSV des pins
- visuels locaux dédiés à chaque pin dans `public/pinterest-launch`
- scheduler 3 pins / jour : `/pinterest-schedule`
- queue locale persistée en JSON
- batch dry-run validé
- vrai publish protégé tant que `PINTEREST_ENABLE_PUBLISH=false`

### Blocage restant
Le vrai publish Pinterest dépend encore de l’approbation des scopes write :
- `boards:write`
- `pins:write`

---

## Variables d’environnement à utiliser
Créer / compléter `amaterest/.env.local`.

### Pinterest
```env
PINTEREST_APP_ID=1562330
PINTEREST_APP_SECRET=AJOUTER_SECRET_REGENERE_ICI
PINTEREST_REDIRECT_URI=http://localhost:3301/pinterest/callback
PINTEREST_ACCESS_TOKEN=AJOUTER_TOKEN_REGENERE_ICI
PINTEREST_TEST_BOARD_ID=1132303600003950351
PINTEREST_LAUNCH_BOARD_ID=1132303600003950351
PINTEREST_TEST_IMAGE_URL=http://localhost:3301/icon-512.png
PINTEREST_FALLBACK_IMAGE_URL=http://localhost:3301/icon-512.png
PINTEREST_ENABLE_PUBLISH=false
PINTEREST_SCHEDULE_TIMEZONE=America/Toronto
PINTEREST_DAILY_SLOTS=09:00,14:00,20:00
```

### Amazon
```env
AMAZON_ASSOCIATE_TAG=AJOUTER_TAG_ICI
AMAZON_MARKETPLACE=CA
AMAZON_DEFAULT_CURRENCY=CAD

AMAZON_PRODUCT_URL_DRAWER_1=https://www.amazon.ca/dp/B08KXKVT4K
AMAZON_PRODUCT_URL_DRAWER_2=https://www.amazon.ca/dp/B07JGWT25L
AMAZON_PRODUCT_URL_UNDER_SINK_1=https://www.amazon.ca/dp/B0BZCMRNB9
AMAZON_PRODUCT_URL_UNDER_SINK_2=https://www.amazon.ca/dp/B0C1X4PGK4
AMAZON_PRODUCT_URL_PANTRY_1=https://amzn.to/41BjXCA
AMAZON_PRODUCT_URL_PANTRY_2=https://www.amazon.ca/dp/B08ZK5WDWN
AMAZON_PRODUCT_URL_CLOSET_1=https://www.amazon.ca/dp/B07SJ2CTV5
AMAZON_PRODUCT_URL_CLOSET_2=https://www.amazon.ca/dp/B0819K32QK
AMAZON_PRODUCT_URL_SHOES_1=https://www.amazon.ca/dp/B0CNGTZ3B5
AMAZON_PRODUCT_URL_SHOES_2=https://www.amazon.ca/dp/B01N125MU5
```

### Important
- Régénérer le **secret Pinterest** et le **token Pinterest** avant usage réel.
- Remplacer plus tard les URLs Amazon par les **liens finaux** si nécessaire.
- Si possible, éviter les liens raccourcis `amzn.to` dans la version finale.

---

## Routes déjà disponibles

### Démo / OAuth
- `/pinterest-demo`
- `/pinterest/callback`
- `/api/pinterest/auth/start`
- `/api/pinterest/auth/callback`
- `/api/pinterest/auth/session`
- `/api/pinterest/auth/disconnect`

### Pinterest backend existant
- `GET /api/pinterest/boards`
- `POST /api/pinterest/test-pin`

### Lancement des 10 pins
- `/pinterest-launch`
- `POST /api/pinterest/launch/dry-run`
- `POST /api/pinterest/launch/publish`

### Scheduler
- `/pinterest-schedule`
- `GET /api/pinterest/schedule/list`
- `POST /api/pinterest/schedule/fill`
- `POST /api/pinterest/schedule/clear`
- `POST /api/pinterest/schedule/run`
- `POST /api/pinterest/schedule/dry-run-due`
- `POST /api/pinterest/schedule/publish-due`

---

## Fichiers clés existants

### Core Pinterest
- `lib/env.ts`
- `lib/pinterest.ts`
- `lib/pinterest-oauth.ts`
- `lib/amazon.ts`
- `lib/pinterest-content.ts`
- `lib/pinterest-launch.ts`
- `lib/pinterest-schedule.ts`

### Pages / UI
- `app/pinterest-demo/page.tsx`
- `app/pinterest-demo/pinterest-demo-client.tsx`
- `app/pinterest-launch/page.tsx`
- `app/pinterest-launch/pinterest-launch-client.tsx`
- `app/pinterest-schedule/page.tsx`
- `app/pinterest-schedule/pinterest-schedule-client.tsx`

### Queue locale
- `data/pinterest-schedule-queue.json`

### Visuels pins
- `public/pinterest-launch/pin-01.jpg`
- `public/pinterest-launch/pin-02.jpg`
- `public/pinterest-launch/pin-03.jpg`
- `public/pinterest-launch/pin-04.jpg`
- `public/pinterest-launch/pin-05.jpg`
- `public/pinterest-launch/pin-06.jpg`
- `public/pinterest-launch/pin-07.jpg`
- `public/pinterest-launch/pin-08.jpg`
- `public/pinterest-launch/pin-09.jpg`
- `public/pinterest-launch/pin-10.jpg`
- `public/pinterest-launch/README.md`
- `public/pinterest-launch/IMAGE-CONVENTION.md`

---

## Mapping final des 10 pins

### Structure générale
Chaque pin doit garder :
- `pinNumber`
- `productKey`
- `category`
- `pinTitle`
- `pinDescription`
- `imageUrl`
- `imageAssetPath`
- `imageSourceType`
- `boardId`
- `link`
- `status`
- `mode`

### Pins

#### PIN 1
- productKey: `drawer_1`
- category: `drawer`
- title: `Ce tiroir était un cauchemar… regarde ça 😳`
- image: `/pinterest-launch/pin-01.jpg`
- intent: drawer before/after

#### PIN 2
- productKey: `under_sink_1`
- category: `under_sink`
- title: `Le coin le plus chaotique de la maison 😬`
- image: `/pinterest-launch/pin-02.jpg`
- intent: under sink organization

#### PIN 3
- productKey: `pantry_1`
- category: `pantry`
- title: `Une cuisine simple et propre, ça change tout 😍`
- image: `/pinterest-launch/pin-03.jpg`
- intent: pantry containers aesthetic

#### PIN 4
- productKey: `mix_top_products`
- category: `mix`
- title: `5 produits simples qui améliorent une maison`
- image: `/pinterest-launch/pin-04.jpg`
- intent: collage top 5 products

#### PIN 5
- productKey: `closet_1`
- category: `closet`
- title: `Petit espace = vite désorganisé 😤`
- image: `/pinterest-launch/pin-05.jpg`
- intent: closet organization small space

#### PIN 6
- productKey: `shoes_1`
- category: `shoes`
- title: `L’entrée peut vite devenir un désordre total 😂`
- image: `/pinterest-launch/pin-06.jpg`
- intent: shoe rack entryway

#### PIN 7
- productKey: `drawer_2`
- category: `drawer`
- title: `Un petit produit qui change beaucoup`
- image: `/pinterest-launch/pin-07.jpg`
- intent: drawer organizer lifestyle

#### PIN 8
- productKey: `under_sink_2`
- category: `under_sink`
- title: `Une maison organisée, c’est plus simple`
- image: `/pinterest-launch/pin-08.jpg`
- intent: clean routine under sink

#### PIN 9
- productKey: `under_sink_1`
- category: `under_sink`
- title: `Si ça ressemble à ça… il y a une solution`
- image: `/pinterest-launch/pin-09.jpg`
- intent: problem/solution under sink

#### PIN 10
- productKey: `pantry_2`
- category: `pantry`
- title: `C’est simple… mais très satisfaisant 😍`
- image: `/pinterest-launch/pin-10.jpg`
- intent: satisfying pantry aesthetic

---

## Style des descriptions
Les descriptions doivent rester :
- neutres
- crédibles
- non personnelles
- sans “mon tiroir”, “ma maison”, “j’utilise ça”
- orientées problème / solution
- avec CTA léger

### Règles de ton
- pas de mensonge personnel
- pas de promesse excessive
- pas de texte trop long
- style Pinterest simple et visuel

---

## Convention visuelle finale
Déjà documentée dans :
- `public/pinterest-launch/IMAGE-CONVENTION.md`

### Résumé
- format : vertical Pinterest
- ratio : `2:3`
- image propre, lisible, peu chargée
- peu ou pas de texte dans l’image
- priorité au contraste visuel avant/après ou au rendu premium propre

### Vérification d’une pin “visually ready”
Une pin est considérée prête visuellement uniquement si :
```text
imageSourceType === "local"
et
isFallback === false
```

---

## Logique actuelle UI / readiness
Sur `/pinterest-launch`, le résumé haut de page affiche :
- total pins
- local images
- fallback images
- dry-runs ok
- launch readiness

### Calcul readiness
```text
Math.round((localImages / totalPins) * 100)
```

### Statut global
- `Needs dry-run fixes`
- `Needs visual assets`
- `Ready for content review`
- `Ready to publish when Pinterest write scopes are approved`
- `Ready to publish`

---

## Scheduler 3 pins / jour

### Page
- `/pinterest-schedule`

### Logique
- 3 créneaux / jour
- heures par défaut : `09:00`, `14:00`, `20:00`
- fuseau : `America/Toronto`
- queue persistée dans `data/pinterest-schedule-queue.json`

### Parcours
1. ouvrir `/pinterest-schedule`
2. cliquer `Schedule next 7 days`
3. vérifier les pins planifiées
4. cliquer `Dry-run due now`
5. plus tard, quand Pinterest approuve : `Publish due now`

### Routes utiles
- `POST /api/pinterest/schedule/fill`
- `POST /api/pinterest/schedule/dry-run-due`
- `POST /api/pinterest/schedule/publish-due`

### Mode safe
Tant que :
```env
PINTEREST_ENABLE_PUBLISH=false
```
le publish réel ne doit pas être exécuté.

---

## Priorité board à respecter
Ordre de priorité :
1. `PINTEREST_LAUNCH_BOARD_ID`
2. `PINTEREST_TEST_BOARD_ID`
3. `boardId` explicite de la pin

Board actuel connu :
```text
Amazon Finds Organisation Maison
1132303600003950351
```

---

## Ce que Codex doit faire maintenant pour intégrer les pins finaux

### Tâches prioritaires
1. remplacer les placeholders par les **vraies images finales** si ce n’est pas déjà fait
2. remplacer les URLs Amazon temporaires par les **vraies URLs finales / affiliées**
3. vérifier que chaque pin a :
   - `imageSourceType=local`
   - `isFallback=false`
4. vérifier que `/pinterest-launch` affiche bien les 10 cartes finales
5. vérifier que `Run all dry-runs` retourne 10 succès
6. vérifier que `/pinterest-schedule` planifie bien les 10 pins sur 4 jours
7. garder `PINTEREST_ENABLE_PUBLISH=false` tant que Pinterest n’a pas approuvé les scopes write

### Tâches secondaires
- améliorer le polish visuel de `/pinterest-launch` si nécessaire
- améliorer le polish de `/pinterest-demo` pour une vidéo plus crédible
- préparer l’extension du catalogue au-delà de 10 pins

---

## Checklist finale avant publication réelle

### Contenu
- [ ] 10 images finales déposées
- [ ] 10 liens Amazon finaux vérifiés
- [ ] 10 titres validés
- [ ] 10 descriptions validées
- [ ] badges `local image` visibles partout
- [ ] `Run all dry-runs` = 10 succès

### Pinterest
- [ ] accès Standard approuvé
- [ ] scopes `boards:write` et `pins:write` actifs
- [ ] token Pinterest régénéré
- [ ] secret Pinterest régénéré
- [ ] `.env.local` mis à jour

### Publish
- [ ] `PINTEREST_ENABLE_PUBLISH=true`
- [ ] `/pinterest-demo` reconnecté si nécessaire
- [ ] `/pinterest-schedule` prêt
- [ ] `Publish due now` testé

---

## Commandes utiles

### Lancer le projet
```powershell
cd "C:\Users\leves\Documents\New project\amaterest"
npm install
npm run dev:test
```

### Ouvrir les pages
```text
http://localhost:3301/pinterest-demo
http://localhost:3301/pinterest-launch
http://localhost:3301/pinterest-schedule
```

### Dry-run batch launch
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3301/api/pinterest/launch/dry-run -ContentType "application/json" -Body "{}"
```

### Scheduler list
```powershell
Invoke-RestMethod -Uri http://localhost:3301/api/pinterest/schedule/list
```

### Scheduler fill
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3301/api/pinterest/schedule/fill -ContentType 'application/json' -Body '{}'
```

### Scheduler dry-run due
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3301/api/pinterest/schedule/dry-run-due -ContentType 'application/json' -Body '{}'
```

### Scheduler publish due
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3301/api/pinterest/schedule/publish-due -ContentType 'application/json' -Body '{}'
```

---

## Note finale pour Codex
Le système existe déjà. Il ne faut **pas reconstruire** l’architecture.
Il faut **finir l’intégration des pins finales**, valider les assets et les liens, puis garder le publish réel verrouillé jusqu’à l’approbation Pinterest.
