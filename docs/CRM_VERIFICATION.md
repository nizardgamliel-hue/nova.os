# Vérification du pilote — 2 octobre 2026

## Navigateur local, base de test PGlite

- Inscription, création d’organisation et onboarding.
- Import CSV avec correspondance et aperçu : deux contacts importés, un doublon et une ligne invalide. Réimport : aucun nouveau contact proposé.
- Recherche de David : deux contacts distincts ; sélection par e-mail. Modification des coordonnées et du statut, création d’entreprise, note et tâche.
- Profil émetteur, brouillon à 500 € HT + 100 € TVA = 600 € TTC, validation explicite, numéro NOVA-00000001, PDF conservé et contenu vérifié, déclaration manuelle du paiement.
- Préparation d’e-mail : destinataire, objet, corps et PDF visibles. Validation affiche EMAIL_NOT_CONFIGURED sans succès fictif.
- Suggestions pour prospect en attente et tâche en retard. Activation puis désactivation de la règle. Worker HTTP exécuté sans chat : échec de configuration e-mail journalisé.
- Conversation créée, requête envoyée : erreur explicite d’accès AI Gateway absent ; aucun résultat IA inventé.
- Écran CRM testé à 390 × 844 : aucune erreur Next.js visible ni débordement horizontal.

## Vérifications automatisées locales

34 tests réussis, ESLint, TypeScript et compilation Next.js (`npm run build`) réussis. La compilation a utilisé une URL factice sans connexion ni migration distante. Tests sur une base PostgreSQL embarquée neuve : isolation des organisations, droits, calculs monétaires, réimport, versions et finalisations concurrentes, numéros uniques, PDF persistant et facture immuable. Transport e-mail factice dans les tests uniquement : succès accepté, refus, résultat incertain, prévention des doubles envois, exécution de règle sans chat et limitation aux contacts de test autorisés.

## Services réels non validés

Pas de clé AI Gateway, de clé Resend ni d’expéditeur configuré. Aucun envoi réel ni échange avec un modèle validé. Pas de validation multi-connexion sur une base distante de test. Réception e-mail non connectée ; automatisation limitée aux contacts de test explicitement autorisés. Aucun ordonnanceur hébergé configuré. Aucun projet Vercel accessible pour fournir une preview publique fonctionnelle. Aucune migration distante ou mise en production.

Les variables et le démarrage, y compris depuis un téléphone sur le même Wi-Fi, sont détaillés dans [NOVA_CRM_PILOT.md](NOVA_CRM_PILOT.md).
