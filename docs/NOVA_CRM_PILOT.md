# Nova CRM — pilote de développement

Branche : `feat/nova-crm-pilot`. Page : `/app/crm-pilote`.
Aucune migration distante ni mise en production n’a été effectuée.

## Démarrage local le plus rapide

```sh
git switch feat/nova-crm-pilot
npm ci
NOVA_LOCAL_TEST_DB_PATH=/tmp/nova-crm-mon-test npm run crm:local-db
```

Créer `.env.local` (ignoré par Git) avec :

```dotenv
NOVA_LOCAL_TEST_DB_PATH=/tmp/nova-crm-mon-test
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<générer localement un secret de test>
CRON_SECRET=<générer localement un secret pour le worker>
```

Puis `npm run dev -- --hostname 0.0.0.0`. Créer un compte dans `/signup`, une organisation, puis finir l’onboarding. L’import CSV est disponible à l’étape 4 et depuis les paramètres. Ouvrir « Nova CRM · pilote » dans le menu, ou `/app/crm-pilote`.

PGlite fournit un vrai moteur PostgreSQL embarqué, avec persistance locale. Il sert à tester ce pilote ; il ne remplace pas une validation sur une branche Neon de test avec plusieurs connexions. Une seule instance du serveur doit utiliser un dossier local donné. Utiliser un dossier neuf si la migration du pilote change pendant le développement. Le pilote local est refusé quand `NODE_ENV=production`.

## Parcours de test

1. Importer `docs/fixtures/crm-test.csv`, associer les colonnes et consulter l’aperçu. Attendu : 2 contacts valides, 1 doublon, 1 erreur. Confirmer puis réimporter : aucun nouveau contact et aucune information existante écrasée.
2. Rechercher « David » : deux personnes, à sélectionner par leur e-mail. Modifier le bon contact, son entreprise et son statut. Renseigner une adresse et un identifiant légal de test pour la facturation.
3. Dans le profil émetteur, renseigner le nom légal, l’adresse, l’identifiant légal, éventuellement l’identifiant TVA, et les conditions/coordonnées de paiement. Le pilote accepte uniquement des données explicitement saisies : ne pas inventer de données légales réelles.
4. Préparer « Prestation », quantité `1`, prix HT `500`, TVA `20`, paiement à `30` jours. Attendu : 500 € HT, 100 € de TVA, 600 € TTC. Modifier le brouillon, enregistrer, puis valider la finalisation. Ouvrir le PDF conservé. Une seconde finalisation conserve le même numéro.
5. Préparer l’e-mail avec la facture : vérifier destinataire, objet, contenu et pièce jointe avant de valider. Sans Resend configuré, l’interface affiche `EMAIL_NOT_CONFIGURED`, sans annoncer d’envoi. Avec un fournisseur réellement configuré, contrôler son résultat et son identifiant dans le journal ; « accepted » ne prouve pas la livraison.
6. Créer une note et une tâche passée, puis la marquer terminée. Vérifier les suggestions et l’historique.
7. Le chat utilise les mêmes fonctions serveur. Recherche, création/modification, notes, tâches, brouillons et préparation d’e-mail nécessitent un accès IA réel pour être testés de bout en bout. La finalisation et l’envoi passent par les cartes de validation humaines ; aucun outil du modèle ne peut approuver à la place de l’utilisateur.

## Services réels et variables

Configurer les valeurs localement dans `.env.local`, ou dans **Vercel → projet → Settings → Environment Variables → Preview**, limitées à cette branche. Ne pas utiliser les variables de production.

- IA : `AI_GATEWAY_API_KEY` (Vercel AI Gateway). Alternative sur Vercel : un `VERCEL_OIDC_TOKEN` valide injecté par la plateforme. `NOVA_MODEL` / `NOVA_MODEL_FAST` / `NOVA_MODEL_REASONING` peuvent choisir un modèle prenant en charge les outils. `NOVA_GATEWAY_READY` est un ancien indicateur de configuration, pas une preuve d’accès ; il ne remplace pas une clé ou un jeton fonctionnel.
- E-mails : `RESEND_API_KEY`, `NOVA_EMAIL_FROM` (expéditeur/domaine vérifié chez Resend).
- Automatisation : `CRON_SECRET`, `NOVA_TEST_EMAIL_ALLOWLIST` (adresses de test exactes séparées par des virgules), éventuellement `NOVA_CRM_WORKER_URL` pour l’ordonnanceur.
- Preview distante : `DATABASE_URL` vers une branche Neon/PostgreSQL identifiée comme test, `NOVA_DATABASE_ENV=test`, `BETTER_AUTH_SECRET` et `BETTER_AUTH_URL` vers l’URL de preview. `DATABASE_URL_UNPOOLED` est facultatif pour les migrations. Les variables `NOVA_TEST_DB_HOST` et `NOVA_TEST_DB_NAME` doivent identifier indépendamment la destination avant `npm run db:migrate`.

Le pilote refuse une base distante sans `NOVA_DATABASE_ENV=test`. Les previews Vercel refusent aussi toute base qui n’est pas identifiée comme test. Aucune migration n’est lancée au démarrage ni pendant le build. L’index unique des e-mails peut empêcher la migration si des doublons préexistent : les résoudre explicitement, sans supprimer ni fusionner silencieusement des contacts.

## Règle de relance serveur

Critère : statut `contacted`, dernière activité déclarée depuis au moins 7 jours. Les réponses entrantes et leur association au contact ne sont pas connectées. Les suggestions pour les vrais contacts exigent donc une validation humaine. Les envois automatiques ne visent que les contacts marqués `isTest` **et** dont l’adresse figure dans `NOVA_TEST_EMAIL_ALLOWLIST`.

Activer la règle dans l’interface avec délai, objet et modèle (`{{firstName}}` est la seule variable). Cliquer « Désactiver la règle » pour l’arrêter ; le chat possède également une commande serveur de désactivation.

Lancer l’ordonnanceur local dans un second terminal :

```sh
npm run crm:worker
# Une seule exécution pour vérifier sans ouvrir le chat :
npm run crm:worker -- --once
```

Le worker appelle `POST /api/cron/crm-followups` toutes les 60 secondes, avec `Authorization: Bearer <CRON_SECRET>`. Pour une preview distante, utiliser un ordonnanceur de test qui appelle cette même route ; aucun cron de production n’a été ajouté. Sans processus/ordonnanceur actif, la règle configurée ne s’exécute pas spontanément.

Une clé unique par prospect limite l’automatisation à une relance sur tout ce pilote. La réservation atomique empêche deux traitements d’envoyer le même e-mail. Une tentative laissée `sending` après interruption est incertaine : ne pas la renvoyer sans contrôle du fournisseur. Les états `failed` et `uncertain` ne sont pas relancés automatiquement. Une tentative incertaine bloque aussi la préparation d’un autre message pour ce contact.

## Tests et limites

`npm test`, `npm run typecheck -- --incremental false`, `npm run lint`. La suite CRM utilise une base PostgreSQL embarquée neuve et un transport e-mail factice explicitement limité aux tests. Elle vérifie les calculs, l’import/réimport, les noms ambigus, les permissions et organisations, les brouillons versionnés, la finalisation, le PDF stocké, la déduplication des envois et les erreurs fournisseur, puis les règles sans chat.

Le PDF simple utilise Helvetica ; les caractères non représentables sont refusés avant la finalisation au lieu de modifier une information légale. Le paiement est déclaré manuellement, séparément du statut de la facture et de l’envoi. Ce pilote n’est pas un logiciel comptable certifié ni une intégration de facturation électronique réglementaire.

## Téléphone

Le plus rapide sans hébergement : sur un ordinateur du même Wi-Fi, lancer le serveur sur `0.0.0.0`, mettre `BETTER_AUTH_URL=http://<IP-LAN-du-PC>:3000`, redémarrer et ouvrir `http://<IP-LAN-du-PC>:3000/app/crm-pilote` depuis le téléphone. Le téléphone doit utiliser cette origine dès l’inscription/connexion. Le serveur doit rester ouvert sur le PC.

Une URL publique fonctionnelle demande une preview avec une base distante de test et les variables d’authentification. Une preview compilée sans base test n’est pas un CRM utilisable. Ne pas partager un lien de production comme lien de test.
