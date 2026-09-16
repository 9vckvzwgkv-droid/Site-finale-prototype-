# MAELIE — Version finale

Boutique e-commerce full-stack conservant l'identité MAELIE : rose poudré, beige, blanc, formes douces et expérience élégante.

## Inclus

- Accueil éditorial et catalogue enrichi
- Boutique avec recherche, filtres et tri
- Fiches produits
- Panier et favoris persistants
- Compte client + historique des commandes
- Checkout avec validation serveur
- Livraison gratuite dès 80 € et code MAELIE10
- API REST Express + SQLite
- Stock vérifié côté serveur
- Administration produits, stocks et commandes
- Stripe Checkout préparé + webhook
- Sécurité de base : JWT, bcrypt, validation, rate limiting, headers

## Installation

Node.js 20+ recommandé.

```bash
npm install
cp .env.example .env
npm start
```

Puis : http://localhost:3000

## Admin

Configurez `ADMIN_EMAIL` et `ADMIN_PASSWORD` dans `.env`.

## Stripe

Renseignez `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` et `PUBLIC_URL`. Le paiement utilise Stripe Checkout. En production, le webhook `/api/stripe/webhook` doit être exposé en HTTPS.

## Mise en production

Utiliser HTTPS, un secret JWT long et aléatoire, un vrai mot de passe admin, sauvegarder la base SQLite et placer l'application derrière un reverse proxy.
