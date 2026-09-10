import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Plus,
    ShoppingBag,
    Store,
    UserCheck,
    UserRound,
    Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { dashboard as adminDashboard } from '@/routes/admin';
import {
    create as sellersCreate,
    index as sellersIndex,
    show as sellersShow,
} from '@/routes/admin/sellers';
import { index as shopsIndex } from '@/routes/admin/shops';

interface DashboardStats {
    total_sellers: number;
    active_sellers: number;
    inactive_sellers: number;
    total_shops: number;
    total_orders: number;
}

interface RecentSeller {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    active: boolean;
    disabled_at: string | null;
    created_at: string;
    shops_count?: number;
}

interface AdminDashboardProps {
    stats: DashboardStats;
    recent_sellers: RecentSeller[];
}

export default function AdminDashboard({
    stats,
    recent_sellers,
}: AdminDashboardProps) {
    const formatDate = (date: string) =>
        new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(new Date(date));

    return (
        <>
            <Head title="Tableau de bord — Administration" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* En-tête de page */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Tableau de bord
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Vue d'ensemble et pilotage de la plateforme Louma
                            Guinard.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href={sellersCreate.url()}>
                            <Plus className="size-4" />
                            Nouveau vendeur
                        </Link>
                    </Button>
                </div>

                {/* Grille de cartes statistiques */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Total vendeurs */}
                    <Card className="hover:border-primary/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Vendeurs
                            </CardTitle>
                            <Users className="text-muted-foreground size-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tabular-nums">
                                {stats.total_sellers}
                            </div>
                            <p className="text-muted-foreground mt-1 text-xs">
                                {stats.active_sellers} actif
                                {stats.active_sellers > 1 ? 's' : ''} ·{' '}
                                {stats.inactive_sellers} inactif
                                {stats.inactive_sellers > 1 ? 's' : ''}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Vendeurs actifs */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Vendeurs Actifs
                            </CardTitle>
                            <UserCheck className="size-4 text-emerald-600 dark:text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600 tabular-nums dark:text-emerald-500">
                                {stats.active_sellers}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5">
                                <Badge
                                    variant="outline"
                                    className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400"
                                >
                                    Opérationnels
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Boutiques */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Boutiques
                            </CardTitle>
                            <Store className="text-muted-foreground size-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tabular-nums">
                                {stats.total_shops}
                            </div>
                            <p className="text-muted-foreground mt-1 text-xs">
                                {stats.total_shops === 0
                                    ? 'Gestion en Phase 4'
                                    : `${stats.total_shops} boutique${stats.total_shops > 1 ? 's' : ''} enregistrée${stats.total_shops > 1 ? 's' : ''}`}
                            </p>
                            <Button
                                variant="link"
                                size="sm"
                                className="mt-1 h-auto px-0 text-xs"
                                asChild
                            >
                                <Link href={shopsIndex.url()}>
                                    Gérer les boutiques
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Commandes */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Commandes
                            </CardTitle>
                            <ShoppingBag className="text-muted-foreground size-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tabular-nums">
                                {stats.total_orders}
                            </div>
                            <p className="text-muted-foreground mt-1 text-xs">
                                {stats.total_orders === 0
                                    ? 'Flux en Phase 7'
                                    : `${stats.total_orders} commande${stats.total_orders > 1 ? 's' : ''}`}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Section Derniers vendeurs */}
                <Card>
                    <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold">
                                Derniers vendeurs ajoutés
                            </CardTitle>
                            <CardDescription>
                                Les 5 derniers comptes vendeurs enregistrés sur
                                la plateforme.
                            </CardDescription>
                        </div>

                        <Button variant="ghost" size="sm" asChild>
                            <Link
                                href={sellersIndex.url()}
                                className="gap-1 text-xs font-medium"
                            >
                                Voir tous les vendeurs
                                <ArrowRight className="size-3.5" />
                            </Link>
                        </Button>
                    </CardHeader>

                    <CardContent className="p-0 sm:p-6 sm:pt-0">
                        {recent_sellers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                                <UserRound className="text-muted-foreground/60 size-10" />
                                <p className="text-sm font-medium">
                                    Aucun vendeur enregistré
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    Commencez par créer votre premier compte
                                    vendeur.
                                </p>
                                <Button size="sm" asChild className="mt-2">
                                    <Link href={sellersCreate.url()}>
                                        <Plus className="size-3.5" />
                                        Créer un vendeur
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto border-t sm:rounded-md sm:border">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/40 text-muted-foreground text-xs uppercase">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">
                                                Nom
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Email
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Téléphone
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Statut
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Date d'ajout
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {recent_sellers.map((seller) => (
                                            <tr
                                                key={seller.id}
                                                className="hover:bg-muted/30 align-middle"
                                            >
                                                <td className="px-4 py-3 font-medium">
                                                    <Link
                                                        href={sellersShow.url(
                                                            seller.id,
                                                        )}
                                                        className="hover:underline"
                                                    >
                                                        {seller.name}
                                                    </Link>
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3">
                                                    {seller.email}
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3">
                                                    {seller.phone ?? '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {seller.active ? (
                                                        <Badge
                                                            variant="default"
                                                            className="bg-emerald-600 hover:bg-emerald-600/90"
                                                        >
                                                            Actif
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">
                                                            Inactif
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3">
                                                    {formatDate(
                                                        seller.created_at,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={sellersShow.url(
                                                                seller.id,
                                                            )}
                                                        >
                                                            Voir
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Tableau de bord',
            href: adminDashboard(),
        },
    ],
};
