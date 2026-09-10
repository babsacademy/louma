import { Head, Link } from '@inertiajs/react';
import { ClipboardList } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatFcfa } from '@/lib/format';
import { orderStatus, type OrderStatus } from '@/lib/order-status';
import { dashboard as sellerDashboard } from '@/routes/seller';
import {
    index as ordersIndex,
    show as ordersShow,
} from '@/routes/seller/orders';
import type { PaginatedData, SellerOrder } from '@/types';

const formatDate = (date: string | null) =>
    date
        ? new Intl.DateTimeFormat('fr-FR', {
              dateStyle: 'medium',
              timeStyle: 'short',
          }).format(new Date(date))
        : '—';

export default function SellerOrdersIndex({
    orders,
}: {
    orders: PaginatedData<SellerOrder>;
}) {
    return (
        <>
            <Head title="Mes commandes" />
            <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6">
                <div>
                    <p className="text-muted-foreground text-sm">
                        Espace vendeur
                    </p>
                    <h1 className="flex items-center gap-2 text-2xl font-semibold">
                        <ClipboardList className="size-5" />
                        Commandes
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Consultez les commandes de vos boutiques. Leur suivi est
                        géré par l’administration.
                    </p>
                </div>
                {orders.data.length === 0 ? (
                    <Card>
                        <CardContent className="text-muted-foreground py-10 text-center text-sm">
                            Aucune commande liée à vos boutiques.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {orders.data.map((order) => {
                            const status =
                                orderStatus[order.status as OrderStatus];

                            return (
                                <Link
                                    key={order.id}
                                    href={ordersShow.url(order.id)}
                                    className="block"
                                >
                                    <Card className="hover:border-primary/50 h-full transition-colors">
                                        <CardContent className="space-y-3 pt-5">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-mono font-semibold">
                                                    {order.reference}
                                                </p>
                                                <Badge
                                                    variant={
                                                        status?.variant ??
                                                        'secondary'
                                                    }
                                                >
                                                    {status?.label ??
                                                        order.status}
                                                </Badge>
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {order.shop.name}
                                                </p>
                                                <p className="text-muted-foreground text-sm">
                                                    {order.shop.zone}
                                                </p>
                                            </div>
                                            <div className="text-muted-foreground flex items-center justify-between text-sm">
                                                <span>
                                                    {order.quantity} poulet
                                                    {order.quantity > 1
                                                        ? 's'
                                                        : ''}
                                                </span>
                                                <span>
                                                    {new Intl.NumberFormat(
                                                        'fr-FR',
                                                        {
                                                            maximumFractionDigits: 3,
                                                        },
                                                    ).format(
                                                        order.average_weight_snapshot /
                                                            1000,
                                                    )}{' '}
                                                    kg
                                                </span>
                                            </div>
                                            <p className="text-muted-foreground text-sm">
                                                Montant vendeur :{' '}
                                                {formatFcfa(
                                                    order.seller_amount,
                                                )}
                                            </p>
                                            <p className="text-sm">
                                                Reversement :{' '}
                                                <span className="font-medium">
                                                    {order.seller_payout
                                                        ? 'Enregistré'
                                                        : 'En attente'}
                                                </span>
                                            </p>
                                            {order.seller_payout?.paid_at ? (
                                                <p className="text-muted-foreground text-xs">
                                                    Reversement le{' '}
                                                    {formatDate(
                                                        order.seller_payout
                                                            .paid_at,
                                                    )}
                                                </p>
                                            ) : null}
                                            <p className="text-muted-foreground text-xs">
                                                {formatDate(order.created_at)}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}

SellerOrdersIndex.layout = {
    breadcrumbs: [
        { title: 'Tableau de bord', href: sellerDashboard() },
        { title: 'Commandes', href: ordersIndex() },
    ],
};
