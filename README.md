# UBOBO

> Plateforme de livraison locale — **Cap Ferret / Bassin d'Arcachon**
> Stack : Vite + React 19 + TypeScript · Express + Socket.io · Prisma + SQLite (Postgres-ready) · Tailwind 3 · Stripe · i18n FR/EN · dark mode

UBOBO est une application web mobile-first style Uber Eats, conçue pour le bassin d'Arcachon.
Identité visuelle : océan + sable + coucher de soleil. Frais de livraison **entièrement configurables** depuis le dashboard admin (aucune valeur en dur).

---

## Sommaire

- [Démarrage rapide](#démarrage-rapide)
- [Architecture](#architecture)
- [Fonctionnalités](#fonctionnalités)
- [Configuration des frais de livraison](#configuration-des-frais-de-livraison)
- [Compte admin](#compte-admin)
- [Stripe (paiements)](#stripe-paiements)
- [Passage en production (Postgres)](#passage-en-production-postgres)
- [Scripts disponibles](#scripts-disponibles)
- [Structure du projet](#structure-du-projet)

---

## Démarrage rapide

```bash
# 1. Installation (≈ 1-2 min)
npm install

# 2. Variables d'environnement
cp .env.example .env

# 3. Initialiser la base de données (SQLite) + données d'exemple
npm run db:push
npm run db:seed

# 4. Lancer frontend + backend en parallèle
npm run dev
```

L'application est ensuite accessible :

- **Frontend** → http://localhost:5173
- **API** → http://localhost:4000/api
- **WebSocket** → ws://localhost:4000
- **Admin** → http://localhost:5173/admin (compte par défaut ci-dessous)

> Tout est en une commande : `npm run setup` (install + db:push + db:seed).

---

## Architecture

```
┌─────────────────┐       HTTP        ┌──────────────────┐
│  Vite Frontend  │ ──────────────►   │  Express API     │
│  (port 5173)    │                   │  (port 4000)     │
│                 │ ◄── Socket.io ──► │                  │
└─────────────────┘                   └────────┬─────────┘
                                               │ Prisma
                                               ▼
                                      ┌──────────────────┐
                                      │  SQLite (dev)    │
                                      │  Postgres (prod) │
                                      └──────────────────┘
```

Le frontend (SPA React Router) et le backend (Express + Socket.io) sont
servis sur des ports séparés en dev pour faciliter le hot reload.

En prod, le frontend peut être déployé sur Vercel/Netlify (build statique)
et le backend sur Railway/Fly/Render. La base de données passe sur Postgres
en changeant **uniquement** `DATABASE_URL` et `provider = "postgresql"` dans
`prisma/schema.prisma`.

---

## Fonctionnalités

### Côté client

- **Accueil** : hero, services, restaurants à la une, simulateur de livraison, courses, waitlist.
- **Recherche** intelligente avec filtres (catégorie, ouvert maintenant) et tri (populaire, plus proche, plus rapide, mieux noté).
- **Liste des restaurants** par catégorie.
- **Page restaurant** : menu groupé par catégorie, options/sauces, avis clients, bouton favori.
- **Panier latéral** persistant (localStorage via Zustand) avec code promo.
- **Checkout** : adresse, paiement carte/cash, frais calculés en live depuis l'API.
- **Suivi de commande temps réel** via WebSocket : statut mis à jour automatiquement (PENDING → PAID → ACCEPTED → PREPARING → READY → ON_THE_WAY → DELIVERED).
- **Favoris** et **avis** (notation 1-5 étoiles).
- **Compte client** : inscription, connexion, mes commandes.
- **i18n** : FR (défaut) / EN, sélecteur en haut.
- **Dark mode** + détection système.

### Côté admin (single-admin)

- **Tableau de bord** : KPIs (CA jour/mois/total, commandes), graphique CA 14 jours, top restaurants.
- **Commandes en direct** : liste mise à jour automatiquement via WebSocket, changement de statut en 1 clic, notification toast sur nouvelle commande.
- **Restaurants** : activation/désactivation/pause via dropdown.
- **Paramètres** : configuration des **frais de livraison** (base, par km, gratuité, minimum), mode maintenance.
- **Promotions** : création de codes promo (% / montant / livraison offerte).
- **Liste d'attente** : export CSV.

---

## Configuration des frais de livraison

🎯 **Point critique du projet** : aucune valeur n'est codée en dur.

La source de vérité est la table `AppSettings` (1 ligne, id `singleton`).
Modifiable :

1. **Via le dashboard admin** : `/admin/settings`
2. **Via l'API** : `PATCH /api/settings` (admin)
3. **Via Prisma Studio** : `npm run db:studio`

### Champs

| Champ | Description | Défaut |
|---|---|---|
| `deliveryBaseFee` | Tarif appliqué pour le 1er km | 5,00 € |
| `deliveryPerKmFee` | Coût par km supplémentaire | 1,00 € |
| `deliveryFreeAbove` | Sous-total au-dessus duquel la livraison est offerte | _null_ |
| `deliveryMinOrder` | Commande minimum acceptée | 0 € |
| `deliveryMaxDistanceKm` | Distance maximum livrée | 4 km |
| `acceptingOrders` | Désactive la création de nouvelles commandes | `true` |

### Évolution future : frais par zone

Le schéma inclut déjà la table `DeliveryZone` (id, nom, codePostal, baseFee, perKmFee, freeAbove, priority, isActive). Si une zone matche le code postal d'une commande, ses tarifs **prennent le pas** sur les défauts d'`AppSettings`. CRUD prêt côté API (`/api/settings/zones`).

### Endpoint de quote

`POST /api/settings/quote` retourne le détail du calcul :

```json
POST /api/settings/quote
{ "distanceKm": 2.5, "subtotal": 18.50 }

→ { "fee": { "baseFee": 5, "perKmFee": 1, "distanceKm": 2.5, "raw": 6, "free": false, "total": 6, "source": "settings" } }
```

Cet endpoint est appelé en live depuis le checkout.

---

## Compte admin

UBOBO fonctionne en **mode single-admin** : un seul compte avec le rôle `ADMIN`.

Compte créé automatiquement au démarrage du serveur à partir des variables d'env :

```
ADMIN_EMAIL=admin@ubobo.fr
ADMIN_PASSWORD=admin123
```

🔐 **À changer impérativement avant production** dans `.env`.

Accès → http://localhost:5173/admin/login

---

## Stripe (paiements)

Stripe est intégré en **mode test** par défaut. Tant que les clés sont les placeholders de `.env.example`, le système fonctionne en mode dégradé : la commande est créée mais sans confirmation Stripe (l'admin marque manuellement la commande comme payée).

### Activer Stripe

1. Créer un compte Stripe → https://dashboard.stripe.com/test/apikeys
2. Récupérer les clés de test (`sk_test_...`, `pk_test_...`)
3. Renseigner dans `.env` :
   ```
   STRIPE_SECRET_KEY=sk_test_xxx
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   ```
4. Pour les webhooks (recommandé) :
   ```
   stripe listen --forward-to localhost:4000/api/stripe/webhook
   ```
   Et ajouter le `whsec_...` dans `STRIPE_WEBHOOK_SECRET`.

### Endpoints

- `POST /api/stripe/payment-intent` (body: `{ orderNumber }`) — créé une intention de paiement, retourne le `clientSecret`.
- `POST /api/stripe/webhook` — écoute `payment_intent.succeeded` / `payment_intent.payment_failed`, met à jour le `paymentStatus` de la commande et émet l'événement WS au client.

### Passage en production

Remplacer les clés `sk_test_*` par les `sk_live_*`. Aucune modification de code.

---

## Passage en production (Postgres)

1. Provisionner une base Postgres (Neon, Supabase, Railway, RDS…) et récupérer la `DATABASE_URL`.
2. Dans `prisma/schema.prisma`, changer :
   ```diff
   datasource db {
   -  provider = "sqlite"
   +  provider = "postgresql"
      url      = env("DATABASE_URL")
   }
   ```
3. Mettre à jour `.env` avec la nouvelle `DATABASE_URL`.
4. Initialiser :
   ```bash
   npm run db:generate
   npm run db:migrate     # crée les migrations
   npm run db:seed
   ```
5. Build :
   ```bash
   npm run build
   ```
6. Démarrer :
   ```bash
   npm start              # backend Node
   # + servir dist/ côté frontend (CDN, S3, Vercel…)
   ```

---

## Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Frontend + backend en parallèle (concurrently) |
| `npm run dev:web` | Frontend seul (Vite) |
| `npm run dev:api` | Backend seul (tsx watch) |
| `npm run build` | Build prod (frontend + backend) |
| `npm start` | Lance le backend Node compilé |
| `npm run db:push` | Crée/met à jour le schéma SQLite (dev) |
| `npm run db:migrate` | Crée une migration Prisma (prod) |
| `npm run db:reset` | Reset complet de la DB + reseed |
| `npm run db:seed` | Insère les données d'exemple |
| `npm run db:studio` | Ouvre Prisma Studio (GUI base de données) |
| `npm run setup` | install + db:push + db:seed (raccourci) |

---

## Structure du projet

```
ubobo/
├── prisma/
│   ├── schema.prisma          # Modèle de données (Postgres-compatible)
│   └── seed.ts                # Données d'exemple
│
├── server/                    # Backend Express + Socket.io
│   ├── index.ts               # Entry point
│   ├── lib/
│   │   ├── prisma.ts          # Client Prisma singleton
│   │   ├── auth.ts            # JWT + middlewares
│   │   ├── socket.ts          # Socket.io init + emitters
│   │   ├── delivery.ts        # ⭐ Calcul de frais (source unique)
│   │   ├── env.ts             # Validation env
│   │   └── orderNumber.ts     # Génération UB-XXXXX
│   └── routes/
│       ├── auth.routes.ts     # /api/auth
│       ├── restaurant.routes.ts
│       ├── order.routes.ts
│       ├── settings.routes.ts # ⭐ AppSettings + DeliveryZones
│       ├── favorite.routes.ts
│       ├── review.routes.ts
│       ├── promotion.routes.ts
│       ├── waitlist.routes.ts
│       ├── stripe.routes.ts   # Stripe + webhook
│       └── admin.routes.ts    # /api/admin/stats
│
├── src/                       # Frontend React 19
│   ├── main.tsx               # Bootstrap (theme/auth/settings/i18n)
│   ├── App.tsx                # Router + AnimatedRoutes
│   ├── index.css              # Tailwind base + dark mode vars
│   ├── i18n/
│   │   ├── index.ts           # i18next config
│   │   └── messages/{fr,en}.json
│   ├── lib/
│   │   ├── api.ts             # ⭐ Client HTTP typé
│   │   ├── socket.ts          # Socket.io client
│   │   ├── format.ts          # formatPrice, formatDate
│   │   ├── delivery.ts        # (legacy local helper)
│   │   └── cn.ts
│   ├── hooks/
│   │   ├── useAuth.ts         # Zustand auth state
│   │   ├── useSettings.ts     # AppSettings cache
│   │   ├── useTheme.ts        # light / dark / system
│   │   ├── useToast.ts        # Toasts globaux
│   │   ├── useRestaurants.ts  # Fetch restaurants
│   │   ├── useOrder.ts        # Fetch + subscribe WS
│   │   └── usePromotions.ts
│   ├── store/
│   │   └── cart.store.ts      # Zustand panier + submitOrder API
│   ├── components/
│   │   ├── ui/                # Button, Badge, Card, Section
│   │   ├── layout/            # Navbar, Footer, CartDrawer, Layout
│   │   ├── sections/          # Hero, HowItWorks, RestaurantsGrid…
│   │   ├── customer/          # FavoriteButton, ReviewStars, PromoBanner
│   │   ├── shared/            # ThemeToggle, LanguageSelector, Toaster
│   │   └── RestaurantCard.tsx
│   ├── data/restaurants.ts    # Données initiales (utilisées par le seed)
│   ├── types/index.ts
│   └── pages/
│       ├── HomePage.tsx
│       ├── RestaurantsPage.tsx
│       ├── RestaurantDetailPage.tsx
│       ├── SearchPage.tsx
│       ├── CartPage.tsx
│       ├── CheckoutPage.tsx
│       ├── ConfirmationPage.tsx       # redirige vers /suivi/:n
│       ├── OrderTrackingPage.tsx      # ⭐ live via WS
│       ├── FavoritesPage.tsx
│       ├── MyOrdersPage.tsx
│       ├── LoginPage.tsx
│       ├── RegisterPage.tsx
│       ├── CoursesPage.tsx
│       └── admin/
│           ├── AdminLayout.tsx        # Sidebar + auth guard
│           ├── AdminLoginPage.tsx
│           ├── AdminDashboardPage.tsx # KPIs + charts
│           ├── AdminOrdersPage.tsx    # ⭐ live orders
│           ├── AdminRestaurantsPage.tsx
│           ├── AdminSettingsPage.tsx  # ⭐ frais de livraison
│           ├── AdminPromotionsPage.tsx
│           └── AdminWaitlistPage.tsx
│
├── tailwind.config.js         # Palette océan/sable/pin/sun + dark mode class
├── tsconfig.app.json          # Frontend
├── tsconfig.server.json       # Backend
├── vite.config.ts
└── .env.example
```

---

## Données seed

Le seed importe les 6 restaurants existants depuis `src/data/restaurants.ts` :

- **Chez Nounours** (snack légendaire, 33 items) — actif, mis en avant
- **La Cabane du Pêcheur** (poisson) — actif
- **Cap Burger** (fast-food) — actif
- **La Pignada**, **Pizzeria du Phare**, **Le Snack du Port**, **Glaces & Gourmandises** — en attente / arrivée prochaine

Plus :

- 1 administrateur (admin@ubobo.fr / admin123)
- 3 clients fictifs avec avis (pour démontrer le système de notation)
- 2 promotions actives (`CAPFERRET10`, `FREEDELIVERY`)

---

## Tester le parcours complet

1. Ouvrir http://localhost:5173
2. Cliquer "Voir les restaurants" → choisir **Chez Nounours**
3. Ajouter quelques articles au panier
4. Aller au panier → appliquer `CAPFERRET10`
5. Checkout → renseigner adresse → choisir paiement
6. Validation → redirection vers `/suivi/UB-XXXXXX` (suivi temps réel)
7. Dans un autre onglet, se connecter en admin (`/admin/login`) :
   - Voir la commande dans **Commandes**
   - Cliquer "ACCEPTED" → l'onglet client se met à jour automatiquement
   - Continuer : PREPARING → READY → ON_THE_WAY → DELIVERED

---

## License

Propriétaire — UBOBO 2026
