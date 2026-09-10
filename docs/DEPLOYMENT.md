# Déploiement de Louma Guinard

## Pré-requis

- PHP 8.3 avec les extensions `ctype`, `curl`, `dom`, `fileinfo`, `filter`, `mbstring`, `openssl`, `pdo`, `pdo_pgsql`, `session`, `tokenizer` et `xml`.
- Composer 2.
- Node.js LTS uniquement pour construire les assets frontend.
- PostgreSQL 16 ou plus récent est le moteur recommandé. MySQL 8 / MariaDB récent reste compatible, mais PostgreSQL est la référence opérationnelle à tester avant le lancement.
- Un serveur web HTTPS configuré pour servir le dossier `public/`.

SQLite est adapté au développement et aux tests simples. Il ne reproduit pas les verrous de ligne de PostgreSQL/MySQL et ne doit pas être utilisé en production.

## Configuration d’environnement

Créer le fichier `.env` sur le serveur à partir de `.env.example`, sans le versionner. Injecter `APP_KEY`, les accès PostgreSQL et les secrets par le mécanisme de secrets de l’hébergeur.

Les valeurs minimales de production sont :

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://votre-domaine.example

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=louma_guinard
DB_USERNAME=louma_app
DB_PASSWORD=<secret>
DB_SSLMODE=require

SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax
CACHE_STORE=database
QUEUE_CONNECTION=database
FILESYSTEM_DISK=local
```

Créer une base PostgreSQL UTF-8 et un utilisateur applicatif dédié. En production multi-instance, utiliser Redis ou une autre store de cache partagé afin que les verrous `withoutOverlapping` soient communs à tous les nœuds.

## Installation et mise à jour

Depuis la racine du projet :

```bash
composer install --no-dev --prefer-dist --optimize-autoloader
npm ci
npm run build
php artisan migrate --force
php artisan storage:link
php artisan optimize
```

Le répertoire servi par le serveur web est `public/`. Les processus PHP doivent pouvoir écrire dans `storage/` et `bootstrap/cache/`. Les images de boutiques sont enregistrées sur le disque `public` Laravel, puis publiées par `storage:link`; contrôler les droits de lecture du lien `public/storage`.

Après chaque déploiement, vérifier `php artisan about`, `php artisan route:list`, `php artisan schedule:list`, puis ouvrir une boutique et une commande de démonstration non financière.

## Premier administrateur

Ne jamais lancer `php artisan db:seed` pour créer un administrateur de production. Les données de démonstration sont limitées aux environnements `local` et `testing`.

Après les migrations, exécuter une seule fois depuis une console administrée :

```bash
php artisan app:create-initial-admin --name="Nom administrateur" --email="admin@votre-domaine.example"
```

La commande demande le mot de passe deux fois sans l’afficher, applique la politique de mot de passe de production et refuse de s’exécuter si un administrateur existe déjà. Conserver le mot de passe dans un gestionnaire de mots de passe et activer la 2FA pour les comptes d’administration selon la politique d’exploitation.

## Scheduler et files d’attente

La réservation des commandes est expirée par `orders:expire-reservations`, planifiée toutes les cinq minutes avec `withoutOverlapping(10)`. Le scheduler doit être appelé toutes les minutes :

```cron
* * * * * cd /chemin/vers/loumarguinar && php artisan schedule:run >> /dev/null 2>&1
```

Les files d’attente utilisent actuellement le driver `database`. Lancer un worker supervisé si des jobs sont ajoutés ultérieurement :

```bash
php artisan queue:work --tries=3 --max-time=3600
```

## Base de données, concurrence et rollback

Les migrations utilisent des clés étrangères, des index de clés métier, des contraintes `unique` pour les références et les transactions Laravel avec `lockForUpdate()`. Les colonnes `unsigned*` restent compatibles avec Laravel sur PostgreSQL; les invariants arithmétiques (stock non négatif, montants et transitions) sont vérifiés dans les Actions transactionnelles et les tests.

Avant le lancement, créer une base de test PostgreSQL distincte, configurer `DB_CONNECTION=pgsql` et des identifiants de test séparés, puis exécuter :

```bash
php artisan migrate:fresh --env=testing
vendor/bin/pest tests/Feature/ProductionReadinessTest.php --compact
```

Ne jamais utiliser `migrate:fresh` contre une base contenant des données. Pour un rollback applicatif, remettre la version précédente du code, exécuter seulement les migrations `down` validées lorsque c’est nécessaire, puis restaurer une sauvegarde cohérente si une migration de données doit être annulée.

## Sauvegardes et sécurité opérationnelle

- Sauvegarder quotidiennement la base PostgreSQL, chiffrer les sauvegardes et tester une restauration régulièrement.
- Sauvegarder aussi `storage/app/public/`, qui contient les images des boutiques.
- Conserver les sauvegardes base et fichiers sur la même rétention afin de restaurer un état cohérent.
- Activer HTTPS, `SESSION_SECURE_COOKIE=true`, `APP_DEBUG=false` et des logs centralisés avec rotation.
- Ne jamais placer de mot de passe, `APP_KEY`, secret de passkey, accès PostgreSQL ou référence Wave dans Git, dans une prop Inertia ou dans un log.

## Contrôles avant mise en ligne

```bash
vendor/bin/pest
vendor/bin/phpstan analyse --memory-limit=1G
vendor/bin/pint --format agent
npm run types:check
npm run check
npm run build
composer audit
npm audit --omit=dev
php artisan route:list
php artisan schedule:list
```

Vérifier enfin sur PostgreSQL le parcours complet : commande publique, expiration, confirmation, livraison, paiement Wave manuel et reversement vendeur. Aucune API Wave ni intégration WhatsApp Cloud n’est requise pour cette V1.
