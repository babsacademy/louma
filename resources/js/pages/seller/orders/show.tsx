import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ClipboardList, Store } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatFcfa } from '@/lib/format';
import { orderStatus, type OrderStatus } from '@/lib/order-status';
import { dashboard as sellerDashboard } from '@/routes/seller';
import { index as ordersIndex } from '@/routes/seller/orders';
import type { SellerOrder } from '@/types';

export default function SellerOrderShow({ order }: { order: SellerOrder }) {
    const status = orderStatus[order.status as OrderStatus];
    return (
        <>
            <Head title={order.reference} />
            <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6">
                <div>
                    <Link
                        href={ordersIndex.url()}
                        className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-xs"
                    >
                        <ArrowLeft className="size-3.5" />
                        Retour aux commandes
                    </Link>
                    <div className="flex items-center justify-between gap-3">
                        <h1 className="font-mono text-xl font-semibold">
                            {order.reference}
                        </h1>
                        <Badge variant={status?.variant ?? 'secondary'}>
                            {status?.label ?? order.status}
                        </Badge>
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardList className="size-5" />
                            Préparation
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <p className="text-muted-foreground flex items-center gap-1 text-sm">
                                <Store className="size-4" />
                                Boutique
                            </p>
                            <p className="mt-1 font-medium">
                                {order.shop.name}
                            </p>
                            <p className="text-muted-foreground text-sm">
                                {order.shop.zone}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">
                                Reversement vendeur
                            </p>
                            <p className="mt-1 font-medium">
                                {order.seller_payout
                                    ? 'Enregistré'
                                    : 'En attente'}
                            </p>
                            {order.seller_payout?.paid_at ? (
                                <p className="text-muted-foreground mt-1 text-sm">
                                    Le{' '}
                                    {new Intl.DateTimeFormat('fr-FR', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short',
                                    }).format(
                                        new Date(order.seller_payout.paid_at),
                                    )}
                                </p>
                            ) : null}
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">
                                Quantité à préparer
                            </p>
                            <p className="mt-1 text-2xl font-semibold">
                                {order.quantity} poulet
                                {order.quantity > 1 ? 's' : ''}
                            </p>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Poids moyen figé :{' '}
                                {new Intl.NumberFormat('fr-FR', {
                                    maximumFractionDigits: 3,
                                }).format(
                                    order.average_weight_snapshot / 1000,
                                )}{' '}
                                kg
                            </p>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Montant vendeur :{' '}
                                {formatFcfa(order.seller_amount)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <p className="text-muted-foreground text-sm">
                    Cette fiche est informative : l’administration confirme,
                    suit et clôture les commandes.
                </p>
            </div>
        </>
    );
}

SellerOrderShow.layout = {
    breadcrumbs: [
        { title: 'Tableau de bord', href: sellerDashboard() },
        { title: 'Commandes', href: ordersIndex() },
        { title: 'Détail', href: ordersIndex() },
    ],
};
