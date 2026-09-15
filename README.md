# Notely - Application de prise de notes sécurisée

Notely est une application complète de prise de notes sécurisée sous architecture monorepo, conçue avec un backend Express en TypeScript strict avec Prisma ORM (SQLite) et un frontend React Native for Web bundlé avec Vite.

---

## 1. Structure du projet

```text
notely/
├── backend/
│   ├── prisma/
│   │   ├── dev.db
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── lib/
│   │   │   └── prisma.ts
│   │   ├── middlewares/
│   │   │   └── auth.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── notes.ts
│   │   │   └── share.ts
│   │   └── index.ts
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── screens/
│   │   │   ├── AuthScreen.tsx
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── NoteEditorScreen.tsx
│   │   │   └── PublicViewScreen.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── store/
│   │   │   └── authStore.ts
│   │   ├── types.ts
│   │   ├── react-native.d.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── package.json
```

---

## 2. Installation et Prérequis

Ce projet fonctionne avec **Node.js / npm** ou directement avec **Bun**.

```bash
# Installation des dépendances à la racine
bun install
# ou
npm install
```

---

## 3. Base de données & Migrations Prisma

Dans le dossier `backend/` :

```bash
cd backend

# Génération du client Prisma
bunx prisma generate
# ou: npx prisma generate

# Application des migrations SQLite (crée backend/prisma/dev.db)
bunx prisma migrate dev --name init
# ou: npx prisma migrate dev --name init
```

---

## 4. Démarrage en local

### Démarrage du Backend (Port 4000)

```bash
cd backend
bun run dev
# ou
npm run dev
```

Le serveur écoute sur `http://localhost:4000`.

### Démarrage du Frontend (Port 5173)

Dans un second terminal :

```bash
cd frontend
bun run dev
# ou
npm run dev
```

L'application web est accessible sur `http://localhost:5173`.

---

## 5. Fonctionnalités implémentées

- **Authentification & Sécurité :**
  - Validation Zod stricte des formulaires côté backend et frontend.
  - Hachage sécurisé des mots de passe utilisateurs et des mots de passe de notes avec `bcryptjs`.
  - Authentification par jetons JWT (7 jours de validité).
  - Middleware de protection `authMiddleware`.
- **Gestion des Notes (`/api/notes`) :**
  - Listing des notes créées et des notes partagées (`NoteShare`).
  - Création et modification de notes privées, publiques ou protégées par mot de passe.
  - Suppression réservée à l'auteur.
  - Partage de note avec un autre utilisateur par email ou nom d'utilisateur avec permission d'édition optionnelle (`canEdit`).
- **Partage Public & Déverrouillage (`/api/share`) :**
  - Accès public sans authentification via `?share=<shareToken>`.
  - Notes publiques : lecture directe du contenu.
  - Notes protégées : masquage strict du contenu et invite de saisie du mot de passe pour déverrouiller l'accès.
  - Notes privées : accès rejeté (403).
- **Interface Utilisateur :**
  - Composants React Native for Web (View, Text, TextInput, TouchableOpacity, FlatList, ScrollView).
  - Badges de statut de visibilité (Privée, Publique, Protégée MDP).
  - Gestion d'état global avec Zustand et requêtes synchronisées avec TanStack Query.
