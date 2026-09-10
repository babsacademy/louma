# Louma Guinard — Architecture proposée

## État du projet audité

Le dépôt est un Laravel 13.31 sur PHP 8.3, basé sur le starter kit React :

- Inertia Laravel 3.3 et `@inertiajs/react` 3.7 ;
- React 19 et TypeScript strict ;
- Tailwind CSS 4 avec configuration CSS-first et composants shadcn/Radix ;
- Wayfinder configuré dans Vite avec variantes de formulaire ;
- Fortify avec inscription, réinitialisation du mot de passe, vérification e-mail, 2FA et passkeys ;
- Pest 4, base SQLite en mémoire pour les tests et 39 tests existants au vert ;
- Pint, Larastan niveau 7 et workflow CI pour les contrôles PHP/JS ;
- Laravel Boost 2.8, guidelines et skills répliqués pour les agents compatibles, MCP configuré pour Codex et les autres outils.

Le code métier n’existe pas encore. La base ne contient que les tables Laravel/Fortify (`users`, sessions, cache, jobs, passkeys). Le dossier `.ai` n’existe pas ; aucune règle projet enregistrée via Boost n’est donc à dupliquer.

## Style architectural retenu

Un monolithe Laravel/Inertia modulaire par dossiers techniques est suffisant :

```text
Requête Inertia/HTTP
    → Form Request
    → Policy ou Gate
    → Controller fin
    → Action métier transactionnelle
    → Models Eloquent / base de données
    → Event ou Notification après commit, uniquement si utile
```

Principes :

- conserver la structure du starter kit et l’enrichir progressivement ;
- utiliser Eloquent directement, sans repository pattern ;
- placer une opération métier importante dans une Action focalisée ;
- réserver les Services aux capacités réutilisables qui ne sont pas une commande applicative unique, par exemple le calcul tarifaire ;
- ne créer un Event, Listener, Notification ou Job que lorsqu’un consommateur réel existe ;
- garder les intégrations externes derrière une frontière claire lorsqu’elles seront effectivement implémentées.

## Backend proposé

### Organisation

```text
app/
├── Actions/
│   ├── Fortify/                 # existe déjà
│   ├── Orders/
│   ├── Payments/
│   └── Shops/
├── Concerns/                    # existe déjà ; réservé aux comportements partagés réels
├── Enums/
├── Events/                      # seulement si un listener existe
├── Http/
│   ├── Controllers/
│   │   ├── Public/
│   │   ├── Seller/
│   │   └── Admin/
│   ├── Middleware/
│   └── Requests/
│       ├── Public/
│       ├── Seller/
│       └── Admin/
├── Models/
├── Policies/
├── Services/
└── Providers/
```

Ces dossiers sont des cibles de roadmap, pas des éléments à créer avant qu’une fonctionnalité autorisée en ait besoin.

### Controllers

- Les controllers publics coordonnent consultation et création de commande.
- Les controllers vendeur exposent uniquement les ressources autorisées du vendeur et des opérations étroites de stock/poids.
- Les controllers admin coordonnent la gestion et les transitions.
- Un controller ne calcule pas les montants et ne contient pas la transaction de stock.
- Les routes sont nommées et les paramètres utilisent le route model binding ; les ressources imbriquées sont scoped lorsque cela réduit les risques d’IDOR.

### Form Requests

Chaque écriture applicative reçoit un Form Request dédié. Il valide la forme des données et peut appeler une Policy dans `authorize()`. Exemples futurs :

- `StorePublicOrderRequest` ;
- `UpdateShopInventoryRequest` ;
- `StoreAdminShopRequest` ;
- `TransitionOrderStatusRequest` ;
- `RecordPaymentRequest` ;
- `RecordSellerPayoutRequest`.

`validated()` ou `safe()->only()` limite les données transmises. Les Form Requests ne valident pas les montants provenant du navigateur : ces champs ne font simplement pas partie de l’entrée acceptée.

### Policies et Gates

- `ShopPolicy` contrôle consultation privée, mise à jour et propriété vendeur.
- `OrderPolicy` limite la vue vendeur aux commandes de ses boutiques et réserve les mutations de workflow à l’administrateur.
- `PaymentPolicy` et `SellerPayoutPolicy` réservent les opérations financières à l’administrateur.
- Les capacités générales d’administration peuvent utiliser un Gate ou des méthodes `before` cohérentes, mais les règles liées à une ressource restent dans sa Policy.
- Les résultats d’autorisation utiles à React sont calculés côté Laravel et transmis en props ; masquer un bouton dans React n’est jamais un contrôle d’accès.

### Actions et Services

Actions proposées, à créer uniquement dans leur phase :

- `CreateOrder` : transaction, verrou, calcul, décrément et référence ;
- `TransitionOrderStatus` : machine d’état, horodatage et historique ;
- `CancelOrder` : transition et restitution idempotente du stock ;
- `UpdateShopInventory` : modification autorisée du stock/poids ;
- `RecordPayment` : enregistrement financier unique ;
- `RecordSellerPayout` : contrôle des préconditions et enregistrement unique.

Un service pur tel que `ChickenPricing` centralise la grille et retourne un résultat typé contenant le prix unitaire, le sous-total, la commission et le montant vendeur. Il ne lit pas une valeur financière du frontend.

### Enums

- `UserRole`: `Admin`, `Seller` ;
- `OrderStatus`: `Pending`, `Confirmed`, `Preparing`, `PickedUp`, `Delivering`, `Delivered`, `Cancelled` ;
- `OrderSource`: `WebWhatsapp`, puis `WhatsappCloudApi` en V2 ;
- `PaymentMethod`: `Wave` seulement si un enum apporte une vraie validation dès la V1.

Les valeurs persistées restent des chaînes stables. Les transitions autorisées appartiennent à la logique métier testée, pas à une liste fournie par React.

### Events, notifications et jobs

- Ne pas créer d’événements décoratifs. `OrderCreated`, `OrderStatusChanged`, `PaymentRecorded` ou `SellerPayoutRecorded` ne sont justifiés que lorsqu’un listener, une notification ou un audit secondaire en dépend.
- Tout événement dépendant d’une transaction doit être émis après commit.
- Le lien WhatsApp V1 est une réponse synchronisée ; aucun Job n’est requis.
- Une expiration automatique des commandes `pending` pourrait utiliser une commande planifiée qui appelle `CancelOrder`. Elle n’est activée qu’après définition du délai métier.
- Les appels WhatsApp Cloud ou Wave de V2 seront asynchrones et pourront utiliser des Jobs avec retry, idempotence et observabilité.

## Modèles retenus

### V1

| Modèle               | Rôle                                           | Décision                                                                    |
| -------------------- | ---------------------------------------------- | --------------------------------------------------------------------------- |
| `User`               | Comptes admin et vendeur                       | Étendre le modèle existant avec rôle et activation ; aucun modèle client V1 |
| `Shop`               | Boutique, zone, stock et poids courant         | Appartient à un vendeur ; un vendeur peut en posséder plusieurs             |
| `Order`              | Commande mono-boutique et instantané financier | Porte quantité, poids, prix et workflow                                     |
| `OrderStatusHistory` | Audit minimal des transitions                  | Recommandé pour tracer auteur, motif et chronologie                         |
| `Payment`            | Paiement client manuel                         | Un au maximum par commande en V1                                            |
| `SellerPayout`       | Reversement manuel                             | Un au maximum par commande en V1                                            |

### Non retenus en V1

- `OrderItem` : inutile tant qu’une commande contient une quantité homogène de poulets d’une seule boutique et d’un seul tarif. L’ajouter lorsque le catalogue devient multi-produit ou qu’un panier mélange plusieurs lignes.
- `Delivery` : le workflow, l’adresse et les horodatages de l’`Order` suffisent tant qu’il n’existe ni livreur assigné, ni tarification, ni tentative de livraison indépendante. L’introduire quand la livraison devient une entité autonome.
- `Customer` : le téléphone et les coordonnées sont des instantanés sur la commande. Un compte ou carnet d’adresses client est hors V1.
- `PricingRule` : la configuration versionnée et les instantanés de commande suffisent avec deux tarifs fixes. Une table devient utile si l’administration doit programmer les tarifs.

## Schéma de base de données proposé

Les types ci-dessous sont conceptuels. Les migrations Laravel devront adapter précisément les tailles et contraintes au moteur de production choisi.

### `users` — extension de la table existante

| Colonne        | Type conceptuel | Null         | Contraintes / index                     |
| -------------- | --------------- | ------------ | --------------------------------------- |
| `id`           | bigint          | non          | clé primaire existante                  |
| `name`         | varchar         | non          | existant                                |
| `email`        | varchar         | non          | unique existant                         |
| `password`     | varchar         | non          | hash existant                           |
| `role`         | varchar         | non          | index ; valeur enum `admin` ou `seller` |
| `active`       | boolean         | non          | défaut `true`, index                    |
| `disabled_at`  | timestamp       | oui          | audit de désactivation                  |
| `created_by`   | bigint          | oui          | FK vers `users.id`, `nullOnDelete`      |
| champs Fortify | existants       | selon schéma | préserver vérification, 2FA et passkeys |
| timestamps     | timestamps      | non          | existants                               |

Ne pas supprimer un vendeur portant un historique ; le désactiver. Le bootstrap du premier administrateur doit être une procédure explicite et sûre.

### `shops`

| Colonne          | Type conceptuel            | Null | Contraintes / index                          |
| ---------------- | -------------------------- | ---- | -------------------------------------------- |
| `id`             | bigint                     | non  | clé primaire                                 |
| `seller_id`      | bigint                     | non  | FK `users.id`, suppression restreinte, index |
| `name`           | varchar                    | non  | recherche applicative                        |
| `slug`           | varchar                    | non  | unique, route publique                       |
| `zone`           | varchar                    | non  | index ; valeur normalisée administrativement |
| `description`    | text                       | oui  | contenu échappé à l’affichage                |
| `image_path`     | varchar                    | oui  | chemin Storage, jamais nom client brut       |
| `stock_quantity` | unsigned integer           | non  | défaut `0`, `CHECK >= 0`                     |
| `average_weight` | unsigned integer (grammes) | non  | `CHECK > 0`, `2100` = 2,1 kg                 |
| `active`         | boolean                    | non  | défaut `true`, index                         |
| timestamps       | timestamps                 | non  |                                              |

Index candidat après validation des requêtes : `(active, zone)` pour la marketplace. La recherche `contains` sur le nom peut rester simple avec le faible volume V1 ; ne pas ajouter un moteur de recherche prématurément.

### `orders`

| Colonne                   | Type conceptuel            | Null                           | Contraintes / index                          |
| ------------------------- | -------------------------- | ------------------------------ | -------------------------------------------- |
| `id`                      | bigint                     | non                            | clé primaire                                 |
| `reference`               | varchar                    | non à la fin de la transaction | unique                                       |
| `request_token`           | uuid/varchar               | non                            | unique, idempotence de création              |
| `shop_id`                 | bigint                     | non                            | FK `shops.id`, suppression restreinte, index |
| `source`                  | varchar                    | non                            | défaut `web_whatsapp`, index si utile        |
| `customer_name`           | varchar                    | non                            | validé                                       |
| `customer_phone`          | varchar                    | non                            | format normalisé, index                      |
| `delivery_address`        | text                       | non                            | données privées                              |
| `quantity`                | unsigned integer           | non                            | `CHECK > 0`                                  |
| `average_weight_snapshot` | unsigned integer (grammes) | non                            | poids ayant déterminé le tarif               |
| `unit_price`              | unsigned integer           | non                            | FCFA, calcul serveur                         |
| `commission_per_unit`     | unsigned integer           | non                            | FCFA, snapshot                               |
| `subtotal`                | unsigned bigint            | non                            | FCFA, calcul serveur                         |
| `platform_commission`     | unsigned bigint            | non                            | FCFA, calcul serveur                         |
| `seller_amount`           | unsigned bigint            | non                            | FCFA, calcul serveur                         |
| `status`                  | varchar                    | non                            | défaut `pending`, index                      |
| `stock_reserved_at`       | timestamp                  | non                            | réservation lors de la création              |
| `stock_released_at`       | timestamp                  | oui                            | garde idempotente d’annulation               |
| `confirmed_at`            | timestamp                  | oui                            |                                              |
| `preparing_at`            | timestamp                  | oui                            |                                              |
| `picked_up_at`            | timestamp                  | oui                            |                                              |
| `delivering_at`           | timestamp                  | oui                            |                                              |
| `delivered_at`            | timestamp                  | oui                            |                                              |
| `cancelled_at`            | timestamp                  | oui                            |                                              |
| `cancellation_reason`     | text                       | oui                            | requis selon transition                      |
| `reservation_expires_at`  | timestamp                  | oui                            | réservé à une expiration validée             |
| timestamps                | timestamps                 | non                            | index candidat `(status, created_at)`        |

Les contraintes arithmétiques complexes restent vérifiées par l’Action et les tests ; les valeurs sont immuables après création, sauf statut, horodatages opérationnels et motif.

### `order_status_histories`

| Colonne       | Type conceptuel | Null | Contraintes / index                                       |
| ------------- | --------------- | ---- | --------------------------------------------------------- |
| `id`          | bigint          | non  | clé primaire                                              |
| `order_id`    | bigint          | non  | FK `orders.id`, suppression restreinte, index             |
| `from_status` | varchar         | oui  | nul pour la création initiale                             |
| `to_status`   | varchar         | non  |                                                           |
| `changed_by`  | bigint          | oui  | FK `users.id`, `nullOnDelete`; nul pour création publique |
| `reason`      | text            | oui  |                                                           |
| `created_at`  | timestamp       | non  | index candidat `(order_id, created_at)`                   |

Aucun `updated_at` n’est nécessaire pour cet historique append-only.

### `payments`

| Colonne              | Type conceptuel | Null | Contraintes / index                          |
| -------------------- | --------------- | ---- | -------------------------------------------- |
| `id`                 | bigint          | non  | clé primaire                                 |
| `order_id`           | bigint          | non  | FK `orders.id`, unique                       |
| `amount`             | unsigned bigint | non  | FCFA ; doit égaler le montant attendu        |
| `method`             | varchar         | non  | `wave` en V1                                 |
| `external_reference` | varchar         | oui  | unique lorsque renseignée                    |
| `recorded_by`        | bigint          | non  | FK `users.id`, suppression restreinte, index |
| `paid_at`            | timestamp       | non  |                                              |
| timestamps           | timestamps      | non  |                                              |

L’absence de ligne signifie « paiement non enregistré » en V1. Une gestion de tentatives, remboursements ou callbacks Wave justifiera un modèle d’état plus riche en V2.

### `seller_payouts`

| Colonne              | Type conceptuel | Null | Contraintes / index                          |
| -------------------- | --------------- | ---- | -------------------------------------------- |
| `id`                 | bigint          | non  | clé primaire                                 |
| `order_id`           | bigint          | non  | FK `orders.id`, unique                       |
| `seller_id`          | bigint          | non  | FK `users.id`, suppression restreinte, index |
| `amount`             | unsigned bigint | non  | FCFA ; doit égaler `orders.seller_amount`    |
| `method`             | varchar         | non  | `wave` recommandé en V1                      |
| `external_reference` | varchar         | oui  | unique lorsque renseignée                    |
| `recorded_by`        | bigint          | non  | FK `users.id`, suppression restreinte        |
| `paid_at`            | timestamp       | non  | index candidat avec `seller_id`              |
| timestamps           | timestamps      | non  |                                              |

Inclure `seller_id` facilite l’audit et conserve explicitement le bénéficiaire, même si la relation est aussi accessible par la boutique de la commande.

## Stratégie stock et commande

### Création

`CreateOrder` reçoit uniquement la boutique, la quantité, les coordonnées validées et le jeton de requête. Dans une transaction courte avec retry limité :

1. résoudre le doublon éventuel par `request_token` ;
2. verrouiller la boutique ;
3. revérifier activation et stock ;
4. calculer avec `ChickenPricing` ;
5. décrémenter le stock ;
6. créer la commande et son entrée d’historique ;
7. générer la référence à partir de l’année et de l’identifiant ;
8. commit ;
9. construire le message WhatsApp avec les valeurs persistées.

La transaction ne doit pas ouvrir WhatsApp ni effectuer d’appel réseau.

### Annulation et transitions

`TransitionOrderStatus` verrouille la commande et applique la table de transitions. `CancelOrder` verrouille aussi la boutique et utilise `stock_released_at` avant toute restitution. Ces Actions sont les seuls chemins autorisés pour modifier le workflow.

### Moteur de production

SQLite reste le moteur local actuel. Pour la production, utiliser PostgreSQL ou MySQL/MariaDB afin de disposer de verrous de ligne et de garanties adaptées à la concurrence. Tester au moins une fois le scénario concurrent sur le même moteur que la production.

## Stratégie WhatsApp

### V1

- Laravel crée la commande et renvoie une redirection vers `wa.me` ou l’URL WhatsApp retenue.
- Le message est construit côté serveur à partir de la commande persistée : référence, boutique, quantité, prix et adresse utile.
- Le destinataire recommandé est un numéro central de la plateforme, puisque l’administration centralise livraison et paiement.
- L’ouverture du lien ne prouve pas que le message a été envoyé ; la commande reste `pending` jusqu’à confirmation administrative.

### Préparation V2

Le même `CreateOrder` doit pouvoir être appelé par un futur adaptateur de webhook après authentification et validation du message :

```text
WhatsApp Cloud API
    → endpoint webhook dédié
    → vérification de signature et idempotence d’événement
    → normalisation du message
    → CreateOrder
    → dashboard administrateur
```

Ne pas créer aujourd’hui d’interface ou de table de webhook sans usage V1. La colonne `source` et une Action indépendante du controller suffisent comme point d’évolution.

## Stratégie paiements et reversements

- Le paiement et le reversement sont des enregistrements séparés du statut logistique.
- Les Actions lisent les montants depuis la commande verrouillée.
- Les contraintes uniques par commande sont la dernière ligne de défense contre les doubles opérations.
- Les opérations conservent l’auteur et l’horodatage.
- `RecordOrderPayment` et `RecordSellerPayout` verrouillent la commande avec `lockForUpdate()`, recalculent leurs montants depuis les snapshots et refusent les doublons. Le paiement client est disponible après `delivered`, puis le reversement après paiement.
- Une future API Wave ajoutera les identifiants fournisseur, états de callback et clés d’idempotence sans recalculer les commandes historiques.

## Frontend proposé

La structure existante possède déjà `components`, `layouts`, `pages`, `hooks`, `types` et `lib`. Elle est conservée et étendue :

```text
resources/js/
├── actions/                     # généré par Wayfinder, non édité manuellement
├── components/
│   ├── ui/                      # composants shadcn existants
│   ├── public/
│   ├── seller/
│   └── admin/
├── hooks/
├── layouts/
│   ├── auth/                    # existe déjà
│   ├── public-layout.tsx
│   ├── seller-layout.tsx
│   └── admin-layout.tsx
├── lib/
├── pages/
│   ├── auth/                    # existe déjà
│   ├── settings/                # existe déjà
│   ├── public/
│   ├── seller/
│   └── admin/
├── routes/                      # généré par Wayfinder, non édité manuellement
└── types/
```

Conventions :

- garder les noms de pages en minuscules/kebab-case comme le starter kit actuel ;
- utiliser `<Form>`, `Link`, `router` et `useHttp` selon le type d’interaction Inertia v3 ;
- utiliser les fonctions Wayfinder générées pour tous les liens et formulaires internes ;
- typer les props de page et les capacités reçues du backend ;
- réutiliser `components/ui`, `cn`, les layouts et le système de thème existants ;
- maintenir les variantes dark mode déjà présentes ;
- fournir un squelette animé pour les props différées ;
- concevoir la marketplace publique mobile-first, puis enrichir les breakpoints.

Les dossiers `actions`, `routes` et `wayfinder` sont générés et déjà ignorés par Git. Ils ne doivent pas être recréés ou modifiés manuellement.

## Authentification et rôles

Fortify est déjà opérationnel avec session web, réinitialisation, vérification e-mail, 2FA et passkeys. Il faut l’étendre, pas le remplacer.

- Les clients restent publics.
- Les utilisateurs authentifiés ont un rôle `admin` ou `seller`.
- L’inscription publique actuellement activée par le starter kit doit être désactivée ou restreinte pendant la Phase 2, car un vendeur est créé ou validé par un administrateur.
- Le premier compte administrateur doit être provisionné explicitement par un seeder contrôlé, une commande sécurisée ou une procédure de déploiement documentée ; jamais par une route publique.
- Un compte inactif ne peut plus ouvrir de session ni exécuter d’action protégée.
- La 2FA peut être rendue obligatoire pour les administrateurs après validation produit, sans ajouter un package de permissions.

## Sécurité

- Validation serveur via Form Requests et validation sous transaction pour les invariants mutables.
- Policies/Gates sur chaque ressource privée et tests anti-IDOR.
- Middleware `auth`, `verified`, rôle/activation et rate limiting selon la surface.
- Protection CSRF du groupe `web` conservée pour les formulaires Inertia.
- Échappement React par défaut ; pas d’injection HTML non assainie.
- Attributs Eloquent explicitement mass-assignables selon les conventions Laravel 13 existantes.
- Uploads limités aux images attendues, contrôlés par contenu, taille et dimensions, nommés par Storage.
- Aucun secret, référence de paiement sensible ou donnée client inutile dans les props Inertia.
- Téléphone et adresse accessibles uniquement aux rôles qui en ont besoin.
- Filtres et tris mappés sur des listes autorisées ; aucune interpolation SQL.
- Rate limiter nommé pour la création publique de commande, segmenté au minimum par IP et éventuellement par téléphone normalisé.
- Journaux sans mots de passe, secrets 2FA, données de paiement complètes ou adresse client en clair inutile.

## Stratégie de tests Pest

Les tests de comportement HTTP restent prioritaires, complétés par des tests unitaires pour la logique pure et des tests de Policy pour les matrices d’autorisation.

### Calculs

- prix à `1999 g` ;
- prix à `2000 g` ;
- prix à `2100 g` ;
- commission pour plusieurs quantités ;
- total client et montant vendeur connus, sans réutiliser l’algorithme dans l’attendu ;
- conservation des snapshots après changement de poids ou de configuration.

### Commandes et stock

- création valide et référence au format attendu ;
- recalcul malgré des champs financiers malveillants ;
- boutique ou vendeur inactif ;
- stock insuffisant ;
- stock jamais négatif ;
- même `request_token` reçu deux fois ;
- annulation remet le stock une seule fois ;
- transition invalide refusée ;
- statuts terminaux immuables ;
- scénario concurrent vérifié sur le moteur de production.

### Autorisations

- matrice `admin`/`seller` au niveau des Policies ;
- endpoint vendeur refusant une boutique étrangère, idéalement sans révéler son existence ;
- vendeur refusé dans l’administration, les paiements et les reversements ;
- utilisateur désactivé refusé ;
- client public limité aux données publiques.

### Paiements

- montant imposé depuis la commande ;
- double paiement refusé ;
- reversement avant paiement ou livraison refusé ;
- double reversement refusé ;
- auteur et horodatages conservés.

Utiliser les factories et leurs états nommés, isoler le temps et les appels externes, et exécuter d’abord le fichier ou filtre concerné. La suite existante utilise `RefreshDatabase`; conserver cette convention tant qu’une décision coordonnée ne la remplace pas.

## Analyse des risques et réponses V1

| Risque                          | Impact                                | Réponse pragmatique V1                                                                      |
| ------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------- |
| Commandes concurrentes          | Survente, stock négatif               | Transaction courte, verrou de boutique, revérification et base production adaptée           |
| Double soumission               | Double commande et double décrément   | Jeton unique, contrainte unique et Action idempotente                                       |
| Montants falsifiés              | Perte financière                      | Ignorer les montants entrants, calcul centralisé et snapshots entiers FCFA                  |
| Changement de poids/tarif       | Recalcul incohérent de l’historique   | Copier poids, prix et commission sur chaque commande                                        |
| Transition libre                | Workflow incohérent                   | Enum, table de transitions et Action unique sous verrou                                     |
| IDOR vendeur                    | Fuite ou modification inter-vendeurs  | Policies, scoping, minimisation des props et tests croisés                                  |
| Double paiement/reversement     | Perte financière                      | Contraintes uniques, verrou commande et Actions administrateur                              |
| WhatsApp abandonné              | Stock réservé sans commande confirmée | État `pending`, vue admin, annulation idempotente ; expiration seulement après délai validé |
| Numéro erroné                   | Client injoignable                    | Validation/normalisation sénégalaise, confirmation visuelle et message récapitulatif        |
| Vendeur ou boutique désactivé   | Nouvelle commande non traitable       | Revérification dans la transaction ; historique préservé                                    |
| Annulation après retrait        | Stock physique faux                   | Interdire l’annulation standard après `picked_up`, traiter l’exception séparément           |
| SQLite en production            | Verrouillage concurrent insuffisant   | PostgreSQL ou MySQL/MariaDB avant lancement                                                 |
| Upload malveillant              | XSS, exécution ou saturation          | Validation contenu/taille/dimensions et stockage géré                                       |
| Inscription publique actuelle   | Création de comptes non autorisés     | Désactiver/restrict Fortify Registration en Phase 2                                         |
| Données client trop exposées    | Risque de confidentialité             | Props minimales, autorisation et journalisation prudente                                    |
| Changement futur des règles     | Dette ou historique faux              | Configuration centralisée V1, snapshots ; table tarifaire seulement si nécessaire           |
| Paiement/livraison mal ordonnés | Reversement indu                      | Préconditions explicites et arbitrage métier avant Phase 7/12                               |

## Décisions à valider avant implémentation

1. Numéro WhatsApp central ou numéro de boutique.
2. Délai et mécanisme d’expiration des commandes `pending`.
3. Paiement Wave manuel enregistré après `delivered`.
4. Reversement Wave manuel par commande après paiement client et livraison.
5. Compteur de référence global ou annuel.
6. Une ou plusieurs boutiques par vendeur dès la V1.
7. Liste officielle et normalisation des zones de Dakar.
8. Moteur de base de données de production.
9. 2FA obligatoire ou optionnelle pour les administrateurs.
