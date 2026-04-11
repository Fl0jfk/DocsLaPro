# Gmail → S3 → API `ingest-from-email`

Lambda Node.js qui **interroge Gmail** (messages non lus avec pièce jointe PDF), dépose les fichiers sous `devis-incoming/…` sur S3, puis appelle votre app Next.js ([`app/api/travels/ingest-from-email/route.ts`](../../app/api/travels/ingest-from-email/route.ts)) avec le secret partagé.

## Cadence (coût minimal)

Dans **Amazon EventBridge**, créez une règle planifiée :

- **Toutes les 2 h** : `rate(2 hours)` (défaut recommandé pour limiter les invocations)
- **Toutes les 1 h** : `rate(1 hour)`

Les deux font le même traitement ; seule la fréquence change.

## Côté application (Amplify / env)

Ajoutez une variable **`TRAVEL_EMAIL_INGEST_SECRET`** (chaîne longue aléatoire). La même valeur doit être fournie à la Lambda sous **`INGEST_SECRET`**.

## Google Cloud / Gmail

1. Projet Google Cloud → activer **Gmail API**.
2. Écran de consentement OAuth (interne ou externe selon votre cas).
3. Créer des identifiants **OAuth client** de type **Application de bureau** (ou « Autre » / installed app).
4. Une fois le **refresh token** obtenu (script local ou `oauth2l`), stockez-le dans les paramètres de la Lambda (ou Secrets Manager) avec `GMAIL_CLIENT_ID` et `GMAIL_CLIENT_SECRET`.

Compte utilisé : boîte **dédiée** aux devis (ex. `devis-transport@…`), pour limiter le périmètre des mails lus.

## Déploiement Lambda (résumé)

1. `cd lambda/gmail-devis-poller && npm install && zip -r function.zip .` (sans `node_modules` de dev inutiles ; inclure `node_modules` pour déploiement zip classique).
2. Runtime **Node.js 20+**, handler **`index.handler`** (fichier `index.mjs`, package `"type": "module"`).
3. **Rôle IAM** : `s3:PutObject` sur `arn:aws:s3:::VOTRE_BUCKET/devis-incoming/*` ; l’app Amplify doit pouvoir lire/écrire aussi `travels/email-ingest-markers/*` (jetons d’ingestion async).
4. Variables : `GMAIL_*`, `S3_BUCKET`, `INGEST_URL`, `INGEST_SECRET`.

## Comportement

- Ne traite que les **PDF** en pièce jointe (nom se terminant par `.pdf`).
- L’API d’ingestion répond vite (**202**) et enchaîne Textract + Mistral **en arrière-plan** (évite les **504** du timeout ~30 s Amplify). Tant que le traitement n’est pas fini, la Lambda voit `pendingIngest` et **ne marque pas** le mail lu.
- **Deuxième passage** (relance manuelle de la Lambda ou prochain cron) : l’API renvoie **200** avec `completed: true` (souvent `duplicate: true`) → la Lambda peut alors marquer le message lu si toutes les PJ sont OK.
- Si l’API renvoie une erreur HTTP (4xx/5xx), le message reste non lu pour **nouvel essai** au prochain cycle.

Les transporteurs doivent mettre la **référence du dossier** (ex. `Réf. 1712345678900`) dans l’objet ou le corps du mail, comme indiqué sur le PDF de demande.
