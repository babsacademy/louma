import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ClipboardList,
    Package,
    Store,
    StoreIcon,
} from 'lucide-react';

import { SellerShopCard } from '@/components/seller/shop-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard as sellerDashboard } from '@/routes/seller';
import { index as shopsIndex } from '@/routes/seller/shops';
import { index as ordersIndex } from '@/routes/seller/orders';
import { formatFcfa } from '@/lib/format';
import type { SellerDashboardStats, SellerShop } from '@/types';

type SellerDashboardProps = {
    stats: SellerDashboardStats;
    shops: SellerShop[];
};

export default function SellerDashboard({
    stats,
    shops,
}: SellerDashboardProps) {
    const statCards = [
        { label: 'Mes boutiques', value: stats.total_shops, icon: Store },
        { label: 'Stock disponible', value: stats.total_stock, icon: Package },
        {
            label: 'Boutiques actives',
            value: stats.active_shops,
            icon: StoreIcon,
        },
        {
            label: 'En rupture',
            value: stats.out_of_stock_shops,
            icon: AlertCircle,
        },
        {
            label: 'À traiter',
            value: stats.orders_to_prepare,
            icon: ClipboardList,
        },
        {
            label: 'En préparation',
            value: stats.orders_preparing,
            icon: ClipboardList,
        },
        {
            label: 'Livrées',
            value: stats.recently_delivered,
            icon: ClipboardList,
        },
        {
            label: 'Reversements en attente',
            value: formatFcfa(stats.pending_payout_amount),
            icon: ClipboardList,
        },
        {
            label: 'Reversements enregistrés',
            value: formatFcfa(stats.paid_payout_amount),
            icon: ClipboardList,
        },
    ];

    return (
        <>
            <Head title="Espace vendeur" />
            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-muted-foreground text-sm">
                            Espace vendeur
                        </p>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Mon activité
                        </h1>
                    </div>
                    <Button asChild>
                        <Link href={shopsIndex.url()}>
                            Mettre à jour mon stock
                        </Link>
                    </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((stat) => (
                        <Card key={stat.label}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-muted-foreground text-sm font-medium">
                                    {stat.label}
                                </CardTitle>
                                <stat.icon className="text-muted-foreground size-4" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold tabular-nums">
                                    {stat.value}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Button variant="outline" className="w-fit" asChild>
                    <Link href={ordersIndex.url()}>Voir mes commandes</Link>
                </Button>
                <section className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Mes boutiques
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                Consultez le stock, le poids et le prix actuel.
                            </p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={shopsIndex.url()}>Tout voir</Link>
                        </Button>
                    </div>
                    {shops.length === 0 ? (
                        <Card>
                            <CardContent className="py-10 text-center">
                                <Store className="text-muted-foreground mx-auto size-10" />
                                <p className="mt-3 font-medium">
                                    Aucune boutique attribuée
                                </p>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    Contactez l’administration si une boutique
                                    doit vous être attribuée.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {shops.map((shop) => (
                                <SellerShopCard key={shop.id} shop={shop} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

SellerDashboard.layout = {
    breadcrumbs: [{ title: 'Tableau de bord', href: sellerDashboard() }],
};
