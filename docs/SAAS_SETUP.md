# Mise en place SaaS — ce que vous devez faire

## 1. Bucket S3 : pas de nouveau bucket obligatoire

Vous pouvez **garder le même bucket** (`BUCKET_NAME` dans `.env.local`).

Ce qui change : chaque **client** (organisation Clerk) a son **dossier racine** :

```
votre-bucket/
  tenants/
    org_2abc.../          ← id Clerk de l’organisation « La Providence »
      travels/
      absences/
      settings/
      reservation-rooms/
      ...
    org_3xyz.../          ← autre école cliente
      travels/
      ...
  travels/                ← anciennes données (avant migration)
  absences/
  ...
```

Vous n’avez **pas** à créer manuellement tous les sous-dossiers : l’app les crée à la première écriture.

### Migration de vos données actuelles

1. Dans Clerk, créez l’organisation et copiez son **Organization ID** (ex. `org_2nXxx...`).
2. Dans `.env.local` :
   ```env
   LEGACY_TENANT_ORG_ID=org_2nXxx...
   ```
3. Lancez une fois :
   ```bash
   LEGACY_TENANT_ORG_ID=org_2nXxx... node scripts/migrate-s3-to-tenant.mjs
   ```
   Cela **copie** (sans supprimer) `travels/`, `absences/`, etc. vers `tenants/org_2nXxx/...`.

Tant que `LEGACY_TENANT_ORG_ID` est défini, l’app lit **d’abord** le chemin tenant, puis retombe sur les anciens chemins plats si besoin.

## 2. Clerk

1. Activer **Organizations** dans le dashboard Clerk.
2. Créer l’org de votre établissement.
3. Vous attribuer le rôle **org:admin** (pour Paramètres généraux).
4. Inviter les utilisateurs dans cette org.

Sur l’intranet : sélecteur d’organisation en haut (à côté du profil). **Sans org sélectionnée**, les modules admin ne fonctionnent pas.

## 3. Paramètres & établissements

Les « sous-établissements » (École, Collège, Lycée) ne sont **pas** des dossiers S3 séparés : ce sont des entrées dans :

`tenants/{orgId}/settings/establishments.json`

- Interface : **Paramètres généraux** (`/parametres`) → onglet Établissements (ajout / suppression / emails direction).
- Ou une fois : `POST /api/settings/seed` (connecté en org:admin).

## 4. Nouveau client vendu

1. Nouvelle **organisation Clerk**.
2. Premier admin → `org:admin` → `/parametres` ou seed.
3. Renseigner identité, établissements, emails, salles.
4. Aucune migration script nécessaire (dossier tenant vide au départ).

## 5. Registre utilisateurs (`users-registry.json` à la racine du bucket)

Fichier global (pas dans `tenants/`) :

```json
{
  "version": 1,
  "organizations": {
    "org_VOTRE_ID": {
      "users": [
        {
          "clerkUserId": "user_xxx",
          "email": "vous@laprovidence.org",
          "roles": ["admin", "direction_lycee"],
          "pending": false
        }
      ]
    }
  }
}
```

- **Qui appartient à quelle org** → entrée sous `organizations.{orgId}`.
- **Rôles dashboard** → tableau `roles` (dont `admin` pour Paramètres / Utilisateurs).
- À chaque modification, l’API **synchronise Clerk** (`publicMetadata.role` + `tenantOrgId`).

Première mise en place : `node scripts/seed-users-registry.mjs` (avec `LEGACY_TENANT_ORG_ID` et clés AWS/Clerk), puis ajoutez `admin` à votre ligne dans le JSON ou via la page **Utilisateurs**.

## 6. Plus de 20 personnes (La Providence ~150)

Clerk limite à **20 membres par organisation** sur le plan gratuit. L’intranet **ne met plus tout le monde dans l’organisation** :

- Chaque salarié = **utilisateur Clerk** (jusqu’à 50k sur le plan gratuit).
- Le dossier S3 = `LEGACY_TENANT_ORG_ID` dans `.env` (une org technique, pas 150 memberships).
- Rôles dashboard = métadonnées `publicMetadata.role` (page **Membres**).
- Admin Paramètres / Membres = métadonnée `org_admin: true` (2–3 personnes max), sans payer l’add-on B2B.

## 7. Variables d’environnement

```env
BUCKET_NAME=votre-bucket
LEGACY_TENANT_ORG_ID=org_...   # uniquement pour votre établissement migré
```
