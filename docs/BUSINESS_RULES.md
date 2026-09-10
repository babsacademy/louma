# Louma Guinard — Règles métier

## Principes invariants

- Laravel est l’unique autorité pour le prix, les totaux, la commission, le montant vendeur, le stock, la propriété des ressources et les statuts.
- Les montants sont stockés et calculés en nombres entiers de FCFA. Aucun flottant n’est utilisé pour l’argent.
- Le poids moyen est stocké en grammes entiers dans `shops.average_weight` (par exemple `2100` = 2,1 kg). L'interface accepte une saisie en kilogrammes, puis Laravel la convertit en grammes avant toute persistance. Aucun flottant n'est stocké.
- Les valeurs tarifaires et le poids ayant servi au calcul sont copiés sur la commande. Une modification ultérieure d’une boutique ne modifie jamais une commande existante.
- Les opérations critiques sont atomiques, idempotentes lorsque nécessaire et protégées par des contraintes de base de données.

## Prix unitaire

Le prix d’un poulet dépend du poids moyen courant de la boutique :

| Poids moyen persisté (grammes)   | Prix unitaire |
| -------------------------------- | ------------: |
| Strictement inférieur à `2000 g` |  `2 900 FCFA` |
| Supérieur ou égal à `2000 g`     |  `3 250 FCFA` |

Le seuil est inclus dans la tranche haute. Ainsi, `1999 g` vaut `2 900 FCFA`, `2000 g` vaut `3 250 FCFA` et `2100 g` vaut `3 250 FCFA`.

Le backend lit le poids sur la boutique verrouillée au moment de créer la commande. Une valeur `unit_price` envoyée par le navigateur ou par un futur webhook est ignorée.

## Commission et montants

La commission de la plateforme est de `400 FCFA` par poulet vendu.

Pour une quantité `q` :

```text
prix_unitaire = tarif déterminé par le poids moyen de la boutique
sous_total_client = q × prix_unitaire
commission_plateforme = q × 400
montant_vendeur = sous_total_client - commission_plateforme
```

Pour la V1, aucun frais de livraison séparé, remise ou taxe n’est défini. Le `subtotal` constitue donc le montant client attendu. Si des frais de livraison sont ajoutés plus tard, ils devront être stockés séparément et le champ `total` devra être introduit sans changer la signification historique de `subtotal`.

### Exemples

| Quantité | Poids moyen | Prix unitaire | Total client | Commission | Montant vendeur |
| -------: | ----------: | ------------: | -----------: | ---------: | --------------: |
|        1 |      1800 g |         2 900 |        2 900 |        400 |           2 500 |
|        3 |      1999 g |         2 900 |        8 700 |      1 200 |           7 500 |
|        5 |      2000 g |         3 250 |       16 250 |      2 000 |          14 250 |
|       12 |      2300 g |         3 250 |       39 000 |      4 800 |          34 200 |

## Configuration et historique tarifaire

En V1, les deux tarifs et la commission peuvent être des valeurs de configuration applicative centralisées, lues par un calculateur métier unique. Elles ne doivent pas être répétées dans les controllers, modèles ou composants React.

Chaque commande conserve au minimum :

- `average_weight_snapshot` ;
- `unit_price` ;
- `commission_per_unit` ;
- `subtotal` ;
- `platform_commission` ;
- `seller_amount`.

Cette copie constitue l’historique tarifaire de la V1. Une table de grilles tarifaires ne devient utile que si les règles doivent être administrables, programmées ou auditées indépendamment des commandes.

## Règles de stock

### Valeur disponible

- `shops.stock_quantity` représente le nombre de poulets encore disponibles à la commande.
- Le stock est un entier positif ou nul.
- Le stock négatif est interdit dans la validation, la logique métier et, lorsque le moteur le permet, par une contrainte `CHECK`.
- Une quantité commandée doit être un entier strictement positif.
- Une boutique inactive ou appartenant à un vendeur inactif ne peut accepter une nouvelle commande.

### Réservation et décrémentation

La V1 réserve le stock lors de la création backend de la commande publique :

1. Démarrer une transaction SQL.
2. Relire la boutique avec un verrou d’écriture (`lockForUpdate`).
3. Vérifier dans la transaction que le vendeur et la boutique sont actifs, que le poids est valide et que le stock est suffisant.
4. Recalculer le prix et tous les montants depuis les données verrouillées.
5. Décrémenter le stock une seule fois.
6. Créer la commande avec ses instantanés et sa référence.
7. Valider la transaction, puis seulement rediriger le client vers la page de confirmation.

Une validation effectuée avant la transaction améliore les messages d’erreur, mais elle ne remplace jamais la vérification sous verrou.

### Concurrence

Le verrou de ligne sérialise les commandes visant la même boutique. Deux commandes concurrentes peuvent avancer en parallèle sur des boutiques différentes. La base de production doit être PostgreSQL ou MySQL/MariaDB ; SQLite reste adapté au développement et aux tests simples, mais pas à la garantie de verrouillage concurrent attendue en production.

Les transactions peuvent être retentées un petit nombre de fois en cas d’interblocage. Elles doivent rester courtes et ne contenir aucun appel WhatsApp, réseau ou autre travail lent.

### Idempotence et double soumission

- Le formulaire de commande reçoit un jeton opaque de soumission unique.
- Ce jeton est soumis à une contrainte unique sur la commande.
- Une nouvelle réception du même jeton retourne la commande déjà créée et ne décrémente pas le stock une seconde fois.
- Le blocage du bouton pendant le traitement améliore l’expérience, mais la protection réelle reste côté serveur et en base.

### Libération du stock

- Une annulation autorisée avant le retrait remet la quantité en stock.
- La remise en stock et le passage à `cancelled` se font dans une même transaction, après verrouillage de la commande et de la boutique.
- Un marqueur tel que `stock_released_at` rend la restitution idempotente : si ce champ est déjà renseigné, aucun stock supplémentaire n’est ajouté.
- Une commande `delivered` ne restitue jamais son stock.
- Une annulation après `picked_up` n’est pas autorisée dans le workflow V1, car le simple retour en stock ne reflète plus nécessairement la réalité physique.

Les commandes `pending` abandonnées constituent une réservation réelle. En première version, l’administrateur peut les annuler manuellement. Une expiration automatique ne doit être activée qu’après validation d’un délai métier ; elle doit réutiliser exactement la même action d’annulation idempotente.

La Phase 7 enregistre une `reservation_expires_at` de 30 minutes à la création pour rendre cette échéance visible, mais aucun ordonnanceur ne libère encore automatiquement le stock. Une commande expirée reste donc réservée jusqu’à une annulation explicite de l’administrateur ; l’ajout futur d’un traitement automatique devra appeler la même Action d’annulation verrouillée.

La Phase 7.5 active cette expiration automatique : la commande Artisan `orders:expire-reservations`, planifiée toutes les cinq minutes, annule uniquement les commandes `pending` dont `reservation_expires_at` est atteinte et dont le stock n’a pas été libéré. Elle verrouille d’abord la commande puis la boutique avant de rendre le stock. La transition renseigne `cancelled_at`, `stock_released_at`, le motif `Réservation expirée` et son historique. Une relance est sans effet sur une commande déjà annulée ou libérée.

En production, le scheduler Laravel doit être exécuté chaque minute par le processus de planification du serveur, par exemple avec l’entrée cron suivante :

```text
* * * * * cd /chemin/vers/loumarguinar && php artisan schedule:run >> /dev/null 2>&1
```

Le scheduler local SQLite ne reproduit pas les verrous ligne de MySQL/MariaDB ou PostgreSQL : la concurrence réelle des actions de confirmation et d’expiration doit être validée sur le SGBD de production.

## Création et référence de commande

Une commande publique doit contenir des coordonnées validées, une boutique active et une quantité disponible. La référence est générée par Laravel et possède le format lisible :

```text
LG-AAAA-NNNNNN
```

Stratégie V1 recommandée : créer la ligne dans la transaction, puis construire la référence avec l’année de création et l’identifiant numérique complété à six chiffres, par exemple `LG-2026-000001`. La référence reçoit une contrainte unique. Cette stratégie évite un compteur métier concurrent supplémentaire ; le numéro est global et ne revient pas à `000001` chaque année.

L’implémentation utilise d’abord une valeur temporaire unique pour satisfaire la contrainte `orders.reference`, puis la remplace dans la même transaction par `LG-AAAA-{id}`. Elle ne s’appuie jamais sur `count() + 1` : l’identifiant auto-incrémenté de la ligne rend la génération sûre face aux créations concurrentes.

Si un compteur annuel remis à zéro est exigé, cette décision doit être prise avant l’implémentation et nécessitera un compteur annuel verrouillé.

## Statuts de commande

Les valeurs minimales sont :

- `pending` : commande créée, stock réservé, en attente de confirmation administrative ;
- `confirmed` : commande acceptée par l’administration ;
- `preparing` : vendeur en préparation ;
- `picked_up` : commande récupérée chez le vendeur ;
- `delivering` : commande en cours de livraison ;
- `delivered` : livraison terminée ;
- `cancelled` : commande annulée selon les règles ci-dessous.

Les statuts sont représentés par un enum PHP backé par des chaînes. Le frontend ne décide jamais si une transition est permise ; il affiche seulement les capacités calculées par Laravel.

### Transitions autorisées

| Depuis       | Vers         | Condition principale                            |
| ------------ | ------------ | ----------------------------------------------- |
| `pending`    | `confirmed`  | Validation opérationnelle par un administrateur |
| `pending`    | `cancelled`  | Abandon, refus, erreur ou expiration validée    |
| `confirmed`  | `preparing`  | Commande transmise pour préparation             |
| `confirmed`  | `cancelled`  | Annulation avant préparation/retrait            |
| `preparing`  | `picked_up`  | Récupération physique effectuée                 |
| `preparing`  | `cancelled`  | Exception avant retrait, avec motif             |
| `picked_up`  | `delivering` | Livraison démarrée                              |
| `delivering` | `delivered`  | Livraison terminée                              |

`delivered` et `cancelled` sont terminaux. Les sauts d’étape et retours arrière sont refusés. Toute exception opérationnelle future doit être modélisée explicitement plutôt que par une modification libre du statut.

### Contrôle des transitions

- Une seule Action métier reçoit la commande verrouillée, le statut cible, l’administrateur et un éventuel motif.
- L’Action vérifie le rôle, la transition, les préconditions et l’idempotence dans une transaction.
- Les horodatages d’étape sont renseignés côté serveur.
- Un historique léger enregistre l’ancien statut, le nouveau, l’auteur, le motif et la date.
- Les notifications ou événements éventuels sont déclenchés après validation de la transaction.

## Annulation

- Seul un administrateur peut annuler une commande dans la V1, sauf mécanisme public d’annulation expressément ajouté plus tard.
- Un motif est obligatoire lorsque la commande n’est plus `pending`.
- L’annulation avant `picked_up` restaure le stock une seule fois.
- Une commande payée ne peut pas être simplement annulée sans procédure de correction ou remboursement définie.
- Une commande avec reversement vendeur ne peut pas être annulée sans traitement financier explicite.
- Les données historiques de la commande ne sont pas supprimées.

### Workflow opérationnel Phase 8

Après confirmation, les seules transitions normales sont `confirmed → preparing → picked_up → delivering → delivered`. Elles sont exécutées par une Action transactionnelle qui verrouille la commande, renseigne l’horodatage de l’étape et inscrit un historique avec l’administrateur auteur. Elles ne modifient jamais le stock déjà réservé.

Une annulation standard est autorisée depuis `pending`, `confirmed` ou `preparing` et restitue le stock exactement une fois via `CancelOrder`. Dès `picked_up`, l’annulation normale est refusée : le stock peut déjà avoir quitté physiquement la boutique. Les courses entre confirmation, transitions et expiration sont sérialisées par `lockForUpdate()` sur la commande ; SQLite ne remplace pas une validation de concurrence sur le SGBD de production.

## Paiement client

La V1 enregistre manuellement un paiement Wave ; elle ne déclenche aucun paiement via API.

- Seul un administrateur autorisé enregistre le paiement.
- Le montant attendu est lu depuis la commande et n’est jamais saisi comme source de vérité.
- Une contrainte unique sur `payments.order_id` interdit le double paiement V1.
- L’enregistrement conserve le montant, le moyen (`wave`), une référence externe optionnelle, l’administrateur et `paid_at`.
- Une référence externe renseignée doit être unique lorsqu’elle est destinée à identifier une transaction Wave.
- Une nouvelle requête identique retourne le paiement existant ou échoue proprement ; elle ne crée pas un second paiement.
- Le statut logistique de la commande et l’existence du paiement restent deux dimensions distinctes.

Le paiement client est enregistré uniquement après le passage à `delivered`. L’absence de ligne `payments` signifie « non enregistré » ; aucune suppression ou modification libre n’est prévue en V1.

## Reversement vendeur

- Seul un administrateur autorisé enregistre un reversement.
- Le montant est toujours égal au `seller_amount` figé sur la commande.
- Le reversement exige au minimum un paiement client enregistré et une commande `delivered`.
- Une contrainte unique sur `seller_payouts.order_id` interdit le double reversement V1.
- Le reversement conserve le vendeur bénéficiaire, le montant, le moyen, une référence externe optionnelle, l’administrateur et `paid_at`.
- Le reversement par commande est retenu pour la V1. Les paiements groupés pourront introduire ultérieurement des lots sans réécrire les commandes historiques.
- Le reversement est enregistré uniquement après le paiement client et la livraison ; l’absence de ligne `seller_payouts` signifie « non enregistré ».
- Les références Wave sont saisies par l’administration, sans appel API Wave ni automatisation en V1.

## Responsabilités

### Administrateur

- Maintenir les comptes vendeurs et les boutiques.
- Vérifier les commandes publiques et appliquer seulement les transitions autorisées.
- Organiser le retrait et la livraison.
- Enregistrer fidèlement paiement et reversement sans pouvoir en modifier librement le montant.
- Corriger les erreurs par des opérations tracées, jamais par suppression de l’historique.

### Vendeur

- Maintenir le stock et le poids moyen de ses propres boutiques.
- Préparer les quantités confirmées.
- Ne pas modifier prix, commission, paiement, reversement, statut administratif ou données d’un autre vendeur.
- Ne pas recevoir de données client non nécessaires à la préparation ou au retrait.

## Sécurité métier

- Les routes publiques ne retournent que les boutiques actives de vendeurs actifs.
- Les identifiants de route ne suffisent jamais à autoriser une action ; chaque ressource privée est contrôlée par Policy/Gate et, si utile, par liaison de route scoped.
- Les champs administratifs (`seller_id`, `active`, `role`, montants, statut) ne figurent pas dans les données mass-assignées depuis une requête vendeur ou publique.
- Les téléphones sont validés et normalisés au format international sénégalais retenu par le projet avant recherche ou affichage dans WhatsApp.
- Les textes libres sont échappés à l’affichage et les filtres/recherches utilisent Eloquent ou des paramètres liés.
- Les créations publiques de commande sont limitées par débit et journalisées sans exposer de données sensibles.
- Les uploads de boutique sont validés par contenu, taille et dimensions, puis stockés avec un nom généré.
- Les désactivations bloquent les nouvelles commandes, mais ne détruisent ni l’historique ni les obligations financières existantes.
