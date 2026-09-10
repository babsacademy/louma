import { Head, Link, router } from '@inertiajs/react';
import { Eye, Search, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatFcfa } from '@/lib/format';
import { orderStatus, type OrderStatus } from '@/lib/order-status';
import { dashboard as adminDashboard } from '@/routes/admin';
import {
    index as ordersIndex,
    show as ordersShow,
} from '@/routes/admin/orders';
import type { OrdersIndexProps } from '@/types';

const formatDate = (date: string | null) =>
    date
        ? new Intl.DateTimeFormat('fr-FR', {
              dateStyle: 'medium',
              timeStyle: 'short',
          }).format(new Date(date))
        : '—';
export default function OrdersIndex({
    orders,
    filters,
    statuses,
}: OrdersIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? 'all');
    const reload = (nextSearch = search, nextStatus = status) =>
        router.get(
            ordersIndex.url({
                query: {
                    search: nextSearch || undefined,
                    status: nextStatus === 'all' ? undefined : nextStatus,
                },
            }),
            {},
            { preserveState: true, replace: true },
        );

    useEffect(() => {
        setSearch(filters.search ?? '');
        setStatus(filters.status ?? 'all');
    }, [filters.search, filters.status]);

    return (
        <>
            <Head title="Commandes" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <div>
                    <h1 className="flex items-center gap-2 text-xl font-semibold">
                        <ShoppingBag className="text-muted-foreground size-5" />
                        Commandes
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Réservations, confirmations et annulations.
                    </p>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
                            <div className="space-y-1.5">
                                <Label htmlFor="search">Rechercher</Label>
                                <div className="relative">
                                    <Search className="text-muted-foreground absolute top-2.5 left-3 size-4" />
                                    <Input
                                        id="search"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        onKeyDown={(event) =>
                                            event.key === 'Enter' && reload()
                                        }
                                        placeholder="Référence, client ou téléphone"
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Statut</Label>
                                <Select
                                    value={status}
                                    onValueChange={setStatus}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Tous les statuts
                                        </SelectItem>
                                        {statuses.map((item) => (
                                            <SelectItem
                                                key={item.value}
                                                value={item.value}
                                            >
                                                {item.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                className="self-end"
                                onClick={() => reload()}
                            >
                                Filtrer
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        {orders.data.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center text-sm">
                                Aucune commande ne correspond à ces critères.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] text-sm">
                                    <thead className="text-muted-foreground border-b text-left">
                                        <tr>
                                            <th className="px-3 py-3 font-medium">
                                                Référence
                                            </th>
                                            <th className="px-3 py-3 font-medium">
                                                Client
                                            </th>
                                            <th className="px-3 py-3 font-medium">
                                                Boutique
                                            </th>
                                            <th className="px-3 py-3 font-medium">
                                                Total
                                            </th>
                                            <th className="px-3 py-3 font-medium">
                                                Statut
                                            </th>
                                            <th className="px-3 py-3 font-medium">
                                                <span className="sr-only">
                                                    Voir
                                                </span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.data.map((order) => (
                                            <tr
                                                key={order.id}
                                                className="border-b last:border-0"
                                            >
                                                <td className="px-3 py-3">
                                                    <p className="font-mono font-medium">
                                                        {order.reference}
                                                    </p>
                                                    <p className="text-muted-foreground text-xs">
                                                        {formatDate(
                                                            order.created_at,
                                                        )}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <p>{order.customer_name}</p>
                                                    <p className="text-muted-foreground text-xs">
                                                        {order.customer_phone}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <p>{order.shop.name}</p>
                                                    <p className="text-muted-foreground text-xs">
                                                        {order.shop
                                                            .seller_name ??
                                                            '—'}{' '}
                                                        · {order.shop.zone}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    {formatFcfa(order.subtotal)}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <Badge
                                                        variant={
                                                            orderStatus[
                                                                order.status as OrderStatus
                                                            ]?.variant ??
                                                            'secondary'
                                                        }
                                                    >
                                                        {orderStatus[
                                                            order.status as OrderStatus
                                                        ]?.label ??
                                                            order.status_label}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={ordersShow.url(
                                                                order.id,
                                                            )}
                                                        >
                                                            <Eye className="size-4" />
                                                            <span className="sr-only">
                                                                Voir la commande
                                                            </span>
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {orders.last_page > 1 ? (
                            <nav className="mt-5 flex flex-wrap justify-end gap-1">
                                {orders.links.map((link, index) =>
                                    link.url ? (
                                        <Button
                                            key={index}
                                            variant={
                                                link.active
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            size="sm"
                                            disabled={link.active}
                                            asChild={!link.active}
                                        >
                                            <Link href={link.url}>
                                                {link.label
                                                    .replace(
                                                        '&laquo; Précédent',
                                                        'Précédent',
                                                    )
                                                    .replace(
                                                        'Suivant &raquo;',
                                                        'Suivant',
                                                    )}
                                            </Link>
                                        </Button>
                                    ) : (
                                        <span
                                            key={index}
                                            className="text-muted-foreground px-2 py-1 text-xs"
                                        >
                                            {link.label}
                                        </span>
                                    ),
                                )}
                            </nav>
                        ) : null}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

OrdersIndex.layout = {
    breadcrumbs: [
        { title: 'Tableau de bord', href: adminDashboard() },
        { title: 'Commandes', href: ordersIndex() },
    ],
};
