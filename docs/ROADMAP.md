# Louma Guinard — Roadmap incrémentale

## Règles d’exécution

- Une phase commence seulement après validation de la précédente et autorisation explicite.
- Chaque phase reste livrable, testée et suffisamment petite pour être relue.
- Les migrations, modèles, routes, pages et dépendances ne sont créés que lorsqu’ils servent la phase active.
- Les critères métier détaillés restent définis dans [BUSINESS_RULES.md](BUSINESS_RULES.md) et les choix structurels dans [ARCHITECTURE.md](ARCHITECTURE.md).
- Le périmètre Paiements Wave manuels et reversements de la Phase 9 est exécuté sur autorisation explicite, même si le séquencement historique le référence encore sous la Phase 12.

## Phase 0 — Audit, architecture et documentation

**Objectif**

Établir l’état réel du starter kit, le périmètre fonctionnel, les règles métier, l’architecture, les risques et la séquence de réalisation.

**Fichiers ou modules concernés**

- `AGENTS.md` ;
- `docs/PROJECT.md` ;
- `docs/BUSINESS_RULES.md` ;
- `docs/ARCHITECTURE.md` ;
- `docs/ROADMAP.md`.

**Dépendances**

Aucune dépendance logicielle supplémentaire.

**Critères d’acceptation**

- Le projet existant est audité sans fonctionnalité métier ajoutée.
- La séparation V1/V2 et les ambiguïtés sont explicites.
- Le schéma proposé, les transitions, les risques et les responsabilités sont documentés.

**Tests nécessaires**

- Exécuter la suite existante pour établir une référence.
- Vérifier les liens internes et la présence des documents ; aucun test métier à ce stade.

## Phase 1 — Base de données et modèles fondamentaux

**Objectif**

Créer le socle relationnel pour rôles, boutiques, commandes et historique, sans interface complète.

**Fichiers ou modules concernés**

- migrations d’extension `users`, `shops`, `orders`, `order_status_histories` ;
- modèles `User`, `Shop`, `Order`, `OrderStatusHistory` ;
- enums `UserRole`, `OrderStatus`, `OrderSource` ;
- factories et seeders utiles.

**Dépendances**

- Arbitrage sur le moteur de production, le compteur de référence et la multiplicité des boutiques.
- Phase 0 validée.

**Critères d’acceptation**

- Relations, casts, contraintes, index et règles de suppression correspondent à l’architecture.
- Les montants sont des entiers FCFA et les instantanés sont immuables par convention applicative.
- Aucun package de permissions n’est ajouté.

**Tests nécessaires**

- Factories valides et relations Eloquent.
- Contraintes d’unicité, valeurs par défaut, enums/casts et suppressions restreintes utiles.
- Migrations fraîches et rollback local vérifiés.

## Phase 2 — Authentification, rôles et activation

**Objectif**

Adapter Fortify aux seuls comptes admin/vendeur et sécuriser l’accès selon le rôle et l’état actif.

**Fichiers ou modules concernés**

- configuration Fortify ;
- middleware d’activation/rôle si nécessaire ;
- `UserRole`, `User`, Policies/Gates ;
- mécanisme sûr de création du premier administrateur ;
- routes et tests d’authentification.

**Dépendances**

- Phase 1.
- Décision sur inscription vendeur : désactivation publique recommandée.
- Décision sur 2FA administrateur.

**Critères d’acceptation**

- Un client n’a pas besoin de compte.
- Aucun visiteur ne peut s’auto-attribuer `admin` ou `seller`.
- Un compte désactivé ne peut pas utiliser les espaces protégés.
- Les fonctionnalités Fortify conservées continuent de fonctionner.

**Tests nécessaires**

- Inscription publique refusée ou flux validé.
- Connexion admin/vendeur actif réussie.
- Compte désactivé refusé.
- Escalade de rôle et mass assignment refusés.
- Régression de la suite auth existante.

## Phase 3 — Gestion des vendeurs

**Objectif**

Permettre à l’administrateur de créer, modifier, consulter et désactiver les vendeurs.

**Fichiers ou modules concernés**

- controllers, Form Requests et routes admin vendeurs ;
- Policy/Gate ;
- pages et composants `resources/js/pages/admin` ;
- actions de création/désactivation si la logique le justifie.

**Dépendances**

- Phase 2.

**Critères d’acceptation**

- Seul un administrateur peut gérer les vendeurs.
- Les mots de passe sont générés/définis par un flux sûr et toujours hashés.
- La désactivation préserve l’historique.
- Les URLs et formulaires utilisent Wayfinder.

**Tests nécessaires**

- CRUD autorisé pour admin et refusé pour seller/guest.
- Validation nom/e-mail/état.
- E-mail unique et rôle protégé.
- Désactivation sans suppression d’historique.

## Phase 4 — Gestion des boutiques

**Objectif**

Permettre à l’administrateur de créer, attribuer, modifier et désactiver les boutiques.

**Fichiers ou modules concernés**

- controllers, Form Requests, Policies et routes `Shop` ;
- pages admin boutiques ;
- upload optionnel d’image via Storage ;
- normalisation de zone et génération de slug.

**Dépendances**

- Phase 3.
- Liste officielle ou règle de saisie des zones de Dakar.

**Critères d’acceptation**

- Une boutique appartient à un vendeur valide.
- Le slug est unique et stable selon la règle retenue.
- La désactivation empêche les nouvelles commandes sans supprimer l’historique.
- Les images sont validées et stockées en sécurité.

**Tests nécessaires**

- Autorisations admin/seller/guest.
- Validation vendeur, zone, poids, stock, slug et image.
- Attribution à un vendeur désactivé refusée selon la règle validée.
- Upload Storage fake et suppression/remplacement contrôlé.

## Phase 5 — Marketplace publique mobile-first

**Objectif**

Afficher les boutiques actives et permettre recherche, filtre et consultation publique.

**Fichiers ou modules concernés**

- controllers publics de lecture ;
- routes publiques nommées ;
- pages `public/shops/index` et `public/shops/show` ;
- composants publics, layout public et types Inertia.

**Dépendances**

- Phase 4.

**Critères d’acceptation**

- Seules les boutiques actives de vendeurs actifs sont visibles.
- Recherche par nom et filtre par zone sont combinables et persistants dans l’URL.
- L’interface est utilisable d’abord sur mobile, accessible et performante.
- Aucun détail privé vendeur n’est exposé.

**Tests nécessaires**

- Visibilité active/inactive.
- Recherche et filtre, y compris entrées invalides ou caractères spéciaux.
- Props Inertia minimales et pagination ordonnée.
- Vérification type/build frontend.

## Phase 6 — Stock et calcul tarifaire

**Objectif**

Centraliser les règles de poids/prix et permettre au vendeur autorisé de maintenir son stock et son poids moyen.

**Fichiers ou modules concernés**

- service ou Action pure `ChickenPricing` ;
- Actions et Form Requests vendeur pour inventaire ;
- `ShopPolicy` ;
- dashboard vendeur minimal pour la mise à jour.

**Dépendances**

- Phases 1, 2 et 4.
- Confirmation de la précision du poids.

**Critères d’acceptation**

- Le seuil `2000 g`, les tarifs et la commission sont définis une seule fois côté serveur.
- Le stock ne peut jamais devenir négatif.
- Un vendeur ne modifie que ses propres boutiques et aucun champ administratif.

**Tests nécessaires**

- Prix sous, au niveau et au-dessus du seuil.
- Totaux, commission et montant vendeur avec valeurs connues.
- Validation stock/poids.
- Accès à une boutique étrangère refusé.
- Mass assignment de `seller_id`, `active` ou prix refusé.

## Phase 7 — Création et workflow des commandes

**Objectif**

Créer une commande publique atomique, réserver le stock, générer la référence et contrôler tout le workflow.

**Fichiers ou modules concernés**

- `CreateOrder`, `TransitionOrderStatus`, `CancelOrder` ;
- Form Requests public/admin ;
- `OrderPolicy`, controllers et routes ;
- historique des statuts ;
- formulaire public de quantité et coordonnées.

**Dépendances**

- Phases 5 et 6.
- Arbitrages sur référence, délai `pending`, normalisation téléphone et conditions de paiement/livraison.
- Base de production compatible avec les verrous de ligne.

**Critères d’acceptation**

- Tous les montants sont recalculés dans Laravel sous verrou.
- Le stock est décrémenté une seule fois et jamais sous zéro.
- Une référence unique est créée.
- Les transitions invalides et les doubles annulations sont refusées.
- Les changements de poids ultérieurs ne modifient pas la commande.

**Tests nécessaires**

- Création valide et échec stock insuffisant.
- Champs financiers malveillants ignorés.
- Double soumission idempotente.
- Annulation et restitution unique.
- Matrice complète des transitions.
- Référence et historique.
- Test concurrent sur le moteur cible.

## Phase 8 — WhatsApp prérempli V1

**Objectif**

Ouvrir WhatsApp après création réussie avec un message fiable issu de la commande persistée.

**Fichiers ou modules concernés**

- constructeur de message/URL WhatsApp ;
- réponse ou controller de redirection ;
- écran de confirmation/fallback ;
- configuration du numéro destinataire.

**Dépendances**

- Phase 7.
- Numéro WhatsApp central ou par boutique confirmé.

**Critères d’acceptation**

- Le message contient référence, boutique, quantité et récapitulatif serveur.
- Le numéro et le texte sont correctement encodés.
- Une URL invalide ou WhatsApp indisponible laisse une référence et des instructions utilisables.
- Aucun appel à la Cloud API n’est effectué.

**Tests nécessaires**

- URL et encodage pour accents, espaces et téléphone.
- Contenu construit depuis la commande, pas depuis l’entrée brute.
- Commande non dupliquée lors d’un nouvel affichage du lien.

## Phase 9 — Dashboard vendeur

**Objectif**

Donner au vendeur une vue utile de ses boutiques, stocks et commandes à préparer sans exposer les données superflues.

**Fichiers ou modules concernés**

- controllers/pages/components seller ;
- requêtes Eloquent autorisées et eager loading ;
- `ShopPolicy` et `OrderPolicy` ;
- layout/navigation vendeur.

**Dépendances**

- Phases 6 et 7.
- Périmètre exact des informations visibles validé.

**Critères d’acceptation**

- Le vendeur ne voit que ses boutiques et commandes.
- Les coordonnées client et données financières non nécessaires sont masquées.
- La mise à jour stock/poids est mobile-friendly et autorisée.

**Tests nécessaires**

- Isolation stricte entre deux vendeurs.
- Props sans données sensibles.
- Boutique inactive visible pour gestion mais non commandable publiquement.
- Tests frontend de types/build.

## Phase 10 — Dashboard administrateur

**Objectif**

Centraliser les vues opérationnelles et les actions autorisées sur vendeurs, boutiques et commandes.

**Fichiers ou modules concernés**

- pages/components/layout admin ;
- filtres de commandes par statut, date, boutique et zone ;
- actions de workflow existantes ;
- navigation par capacités.

**Dépendances**

- Phases 3, 4, 7 et 9.

**Critères d’acceptation**

- L’administrateur voit les commandes prioritaires et leur historique.
- Chaque action affichée correspond à une capacité réellement autorisée.
- Les listes sont paginées, ordonnées de façon déterministe et sans N+1.

**Tests nécessaires**

- Accès admin uniquement.
- Filtres et pagination.
- Transitions possibles affichées depuis les capacités serveur.
- Requêtes critiques inspectées pour les N+1.

## Phase 11 — Organisation de la livraison

**Objectif**

Couvrir le retrait chez le vendeur et la livraison avec le workflow de commande, sans créer une entité logistique inutile.

**Fichiers ou modules concernés**

- étapes `preparing`, `picked_up`, `delivering`, `delivered` ;
- horodatages et notes opérationnelles strictement nécessaires ;
- vues admin et vendeur associées.

**Dépendances**

- Phase 10.
- Confirmation du processus réel de récupération/livraison.

**Critères d’acceptation**

- Les étapes reflètent les opérations réelles.
- Une annulation standard après retrait est impossible.
- Un modèle `Delivery` n’est ajouté que si un livreur, un coût ou plusieurs tentatives deviennent des entités propres.

**Tests nécessaires**

- Transitions et préconditions logistiques.
- Horodatages serveur.
- Visibilité des notes et données client selon le rôle.

## Phase 12 — Paiements et reversements manuels

**Objectif**

Enregistrer manuellement le paiement Wave du client et le reversement vendeur avec intégrité et audit.

**Fichiers ou modules concernés**

- migrations/modèles `Payment` et `SellerPayout` ;
- `RecordPayment`, `RecordSellerPayout` ;
- Policies, Form Requests et UI admin ;
- vues récapitulatives vendeur autorisées.

**Dépendances**

- Phases 10 et 11.
- Conditions exactes de paiement et reversement validées.

**Critères d’acceptation**

- Les montants viennent exclusivement de la commande.
- Un seul paiement et un seul reversement existent par commande.
- Le reversement exige les préconditions métier.
- L’auteur, la date et la référence externe sont traçables.

**Tests nécessaires**

- Paiement admin réussi, seller/guest refusés.
- Montant entrant falsifié ignoré/refusé.
- Double paiement et référence dupliquée refusés.
- Reversement prématuré et double reversement refusés.
- Transactions et historique vérifiés.

## Phase 13 — Durcissement, qualité et optimisation

**Objectif**

Finaliser sécurité, performance, accessibilité, observabilité et couverture des risques avant lancement.

**Fichiers ou modules concernés**

- rate limiters, logs et gestion d’erreurs ;
- Policies et tests de sécurité ;
- requêtes/index validés par les usages ;
- CI, analyse statique, formatage et frontend ;
- commande éventuelle d’expiration `pending` après décision.

**Dépendances**

- Toutes les fonctionnalités V1.

**Critères d’acceptation**

- Aucun risque critique identifié dans l’architecture ne reste sans mitigation.
- Les données sensibles ne figurent pas dans les props ou logs inutiles.
- Les pages principales satisfont les exigences mobile/accessibilité.
- Les index correspondent aux requêtes mesurées.

**Tests nécessaires**

- Suite Pest complète, analyse Larastan, Pint, TypeScript et build.
- Tests anti-IDOR, XSS, entrées inattendues, uploads et rate limiting.
- Test de concurrence sur moteur production.
- Revue manuelle mobile et parcours complet.

## Phase 14 — Déploiement

**Objectif**

Déployer la V1 dans un environnement production reproductible, sécurisé et observable.

**Fichiers ou modules concernés**

- configuration d’environnement et base de données ;
- stockage public des images ;
- sessions/cache/queue selon hébergeur ;
- commandes build/deploy et migrations ;
- sauvegardes, domaine, HTTPS et supervision.

**Dépendances**

- Phase 13.
- Hébergeur, domaine, moteur DB et politique de sauvegarde confirmés.

**Critères d’acceptation**

- Secrets hors dépôt, `APP_DEBUG=false`, HTTPS et sauvegardes actives.
- PostgreSQL ou MySQL/MariaDB utilisé pour la concurrence de stock.
- Migrations et build sont reproductibles.
- Un administrateur initial sécurisé existe.
- Un test de fumée couvre le parcours jusqu’au lien WhatsApp.

**Tests nécessaires**

- CI verte sur le commit déployé.
- Smoke tests post-déploiement.
- Vérification de sauvegarde/restauration et des tâches planifiées réellement activées.

## V2 — Intégrations et évolution

### WhatsApp Business Cloud API

**Objectif** : recevoir les messages et créer des commandes automatiquement.

**Modules** : webhook signé, idempotence d’événements, parser/normalisateur, Jobs avec retry, adaptateur vers `CreateOrder`, notifications admin.

**Dépendances** : V1 stable, compte Meta configuré, politique de consentement et modèles de messages validés.

**Acceptation** : un événement authentique est traité exactement une fois ; un événement invalide est refusé ; les erreurs sont rejouables et observables.

**Tests** : signatures, doublons, ordre des webhooks, retries, payloads inconnus et intégration simulée.

### Bot WhatsApp

**Objectif** : guider recherche, sélection et commande dans la conversation.

**Modules** : machine conversationnelle, état minimal, validation et reprise.

**Dépendances** : webhook WhatsApp robuste et parcours métier stabilisé.

**Acceptation** : le bot appelle les mêmes Actions Laravel et ne possède aucune logique financière parallèle.

**Tests** : scénarios de conversation, reprise, expiration, entrées ambiguës et langues retenues.

### API Wave

**Objectif** : automatiser éventuellement paiement et reversement.

**Modules** : contrat de passerelle, client API, webhooks signés, idempotence fournisseur, Jobs, rapprochement.

**Dépendances** : accès fournisseur, règles de remboursement et de rapprochement définies.

**Acceptation** : aucun callback ne crée de double mouvement ; les montants sont rapprochés des snapshots de commande.

**Tests** : succès, échec, timeout, retry, doublon, signature invalide et incohérence de montant.

### Statistiques et historique avancé

**Objectif** : indicateurs vendeurs/admin, exports et analyses historiques.

**Modules** : requêtes agrégées, éventuels snapshots ou tables tarifaires, exports asynchrones si nécessaires.

**Dépendances** : volume et besoins réels mesurés.

**Acceptation** : les rapports respectent les autorisations et ne ralentissent pas le flux transactionnel.

**Tests** : agrégats connus, isolation vendeur, gros volumes et exports.

## Première phase recommandée après autorisation

Commencer par la **Phase 1 — Base de données et modèles fondamentaux**, après résolution des décisions bloquantes suivantes : moteur de production, multiplicité des boutiques, stratégie exacte de référence et liste/normalisation des zones. La phase doit rester limitée au schéma, aux modèles, enums, factories et tests ; aucune interface métier ne doit être anticipée.
