# Louma Guinard — Référence fonctionnelle

## Vision

Louma Guinard est une marketplace web qui rend l’offre de poulets disponible à Dakar plus lisible et plus simple à commander. La plateforme regroupe les boutiques de vendeurs, affiche leur disponibilité et leurs prix, puis centralise le suivi opérationnel de la commande, de la livraison, du paiement client et du reversement vendeur.

La V1 vise un lancement rapide, fiable et administrable par une petite équipe. Elle reste un monolithe Laravel/Inertia et n’intègre ni microservices ni automatisations externes prématurées.

## Objectifs

- Permettre à un client de trouver rapidement une boutique et de commander depuis un téléphone.
- Donner aux vendeurs un moyen simple de tenir leur stock et leur poids moyen à jour.
- Donner à l’administrateur une vue centrale des vendeurs, boutiques, commandes, livraisons, paiements et reversements.
- Garantir côté serveur l’intégrité du stock, des montants et des autorisations.
- Préparer l’arrivée future des API WhatsApp Business Cloud et Wave sans les implémenter en V1.

## Périmètre géographique

Le lancement couvre uniquement la région de Dakar. Le champ `zone` d’une boutique sert à la recherche et au filtrage dans ce périmètre. L’ouverture à d’autres régions n’est pas comprise dans la V1, mais le schéma ne doit pas empêcher une extension ultérieure.

## Profils utilisateurs

### Client public

Le client n’a pas besoin de compte en V1. Il peut :

- consulter les boutiques actives de vendeurs actifs ;
- rechercher une boutique par nom ;
- filtrer ou rechercher par zone ;
- ouvrir la fiche d’une boutique ;
- voir le stock disponible, le poids moyen et le prix unitaire calculé ;
- choisir une quantité et fournir ses coordonnées de livraison ;
- créer une commande, puis poursuivre l’échange avec la plateforme dans WhatsApp grâce à un message prérempli.

Le numéro de téléphone normalisé du client permet de retrouver ses commandes sans constituer un compte ou un mécanisme d’authentification.

### Vendeur

Le vendeur possède un compte créé ou validé par l’administrateur. Il ne crée pas sa boutique. L’architecture retient une relation « un vendeur possède une ou plusieurs boutiques », tout en permettant de limiter opérationnellement la V1 à une seule boutique si l’équipe le décide.

Le vendeur peut :

- consulter ses propres boutiques ;
- mettre à jour le stock disponible ;
- mettre à jour le poids moyen utilisé pour les futures commandes ;
- consulter les informations d’activité nécessaires à la préparation et au retrait.

Le vendeur ne gère ni le paiement client ni la livraison. Il ne voit que les informations de commande nécessaires à son travail ; les coordonnées privées du client et les données de paiement sont réservées à l’administration lorsqu’elles ne sont pas indispensables au vendeur.

### Administrateur

L’administrateur utilise un espace authentifié et autorisé. Il peut :

- créer, modifier, activer ou désactiver les vendeurs ;
- créer, modifier, activer ou désactiver les boutiques ;
- consulter toutes les commandes ;
- faire progresser une commande selon les transitions autorisées ;
- organiser la préparation, la récupération et la livraison ;
- enregistrer le paiement client ;
- enregistrer le reversement vendeur ;
- consulter les données nécessaires à l’exploitation de la plateforme.

La désactivation est préférée à la suppression lorsqu’un vendeur ou une boutique possède un historique.

## Parcours client

1. Le client arrive sur la marketplace publique depuis son téléphone.
2. Il recherche une boutique par nom ou filtre les boutiques actives par zone.
3. Il consulte une boutique et voit son stock, son poids moyen et le prix unitaire correspondant.
4. Il saisit une quantité, son nom, son téléphone et son adresse de livraison.
5. Il soumet la demande à Laravel.
6. Laravel valide les données, verrouille le stock, recalcule tous les montants, réserve le stock et crée une référence de commande.
7. Après validation, la réponse ouvre WhatsApp avec un message contenant la référence et le récapitulatif calculé par le serveur.
8. L’administrateur confirme ou annule la commande, puis pilote la préparation, le retrait, la livraison et les enregistrements financiers.

La commande est donc persistée avant l’ouverture de WhatsApp. Cette décision protège le stock et donne une référence commune au client et à l’administrateur, mais impose de traiter les commandes `pending` dont le client abandonne WhatsApp.

## Parcours vendeur

1. L’administrateur crée ou valide le compte vendeur et lui attribue une ou plusieurs boutiques.
2. Le vendeur se connecte avec l’authentification Laravel existante.
3. Il consulte uniquement ses boutiques et les données autorisées liées à leur activité.
4. Il actualise le stock et le poids moyen.
5. Les nouvelles commandes utilisent la valeur du poids au moment de leur création ; modifier le poids ne recalcule jamais une commande existante.

## Parcours administrateur

1. L’administrateur se connecte à l’espace protégé.
2. Il gère les vendeurs et leurs boutiques.
3. Il consulte les commandes `pending` et vérifie l’échange WhatsApp.
4. Il confirme la commande, suit la préparation, le retrait et la livraison.
5. Il enregistre le paiement client une seule fois.
6. Une fois les conditions métier satisfaites, il enregistre le reversement vendeur une seule fois.
7. Les opérations sensibles gardent l’identité de l’administrateur et leurs horodatages.

## Exigences mobile-first

- Concevoir d’abord les vues publiques pour des écrans étroits et une utilisation tactile.
- Rendre visibles sans effort le prix, le stock, la quantité et l’action WhatsApp.
- Utiliser des champs adaptés au mobile, notamment `tel` pour le téléphone et des cibles tactiles suffisamment grandes.
- Limiter le poids initial des pages et prévoir des états de chargement accessibles.
- Conserver une hiérarchie lisible, un contraste suffisant, des libellés explicites et la navigation clavier.
- Adapter ensuite les interfaces vendeur et administrateur aux tablettes et écrans larges sans dégrader le mobile.

## Périmètre V1

- Marketplace publique des boutiques actives à Dakar.
- Recherche par nom et filtrage par zone.
- Fiche boutique avec stock, poids moyen et prix calculé.
- Commande publique sans compte, persistée côté serveur.
- Redirection vers un lien WhatsApp avec message prérempli.
- Comptes `admin` et `seller` avec autorisations Laravel natives.
- Gestion administrative des vendeurs, boutiques et commandes.
- Mise à jour du stock et du poids moyen par le vendeur autorisé.
- Workflow contrôlé des commandes.
- Organisation manuelle de la récupération et de la livraison.
- Enregistrement manuel du paiement Wave et du reversement vendeur.
- Historisation des valeurs financières dans la commande.
- Tests Pest des calculs, du stock, des transitions et des autorisations.

## Explicitement hors V1

- Compte client obligatoire, panier multi-boutiques ou catalogue multi-produit.
- WhatsApp Business Cloud API, bot WhatsApp, webhooks et création automatique depuis un message.
- API Wave et automatisation des paiements ou reversements.
- Paiement en ligne initié depuis le site.
- Dispatch automatisé de livreurs, géolocalisation ou suivi temps réel.
- Statistiques avancées, exports complexes et historique analytique détaillé.
- Ouverture hors Dakar.
- Architecture microservices, CQRS, event sourcing et système de permissions externe.

## Critères de succès de la V1

- Un client mobile peut trouver une boutique et initier une commande sans compte.
- Aucun montant métier n’est accepté depuis le frontend sans recalcul Laravel.
- Deux commandes concurrentes ne peuvent pas rendre le stock négatif.
- Un vendeur ne peut agir que sur ses propres boutiques et données autorisées.
- Une commande, un paiement et un reversement sont traçables et ne peuvent pas être appliqués deux fois.
- Les équipes peuvent exploiter le flux complet manuellement avant d’automatiser WhatsApp ou Wave.

## Ambiguïtés à arbitrer avant la phase Commandes

- Numéro WhatsApp destinataire : numéro central de la plateforme recommandé, ou numéro propre à chaque boutique.
- Durée de réservation d’une commande `pending` abandonnée : annulation manuelle en premier lieu, ou expiration automatique après un délai à valider.
- Séquence des références : compteur global basé sur l’identifiant recommandé, ou compteur remis à zéro chaque année.
- Moment exact du paiement client : avant expédition, à la livraison, ou les deux selon le cas.
- Condition de reversement : immédiatement après paiement, uniquement après livraison, ou selon un cycle groupé.
- Niveau d’information commande visible par le vendeur, en respectant la minimisation des données client.
- Possibilité réelle de plusieurs boutiques par vendeur dès la V1.
