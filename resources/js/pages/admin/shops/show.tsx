import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarClock,
    MapPin,
    Package,
    Pencil,
    Store,
    UserRound,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Shop } from '@/types';
import { dashboard as adminDashboard } from '@/routes/admin';
import { show as sellersShow } from '@/routes/admin/sellers';
import {
    disable as shopsDisable,
    edit as shopsEdit,
    enable as shopsEnable,
    index as shopsIndex,
} from '@/routes/admin/shops';

interface ShopsShowProps {
    shop: Shop;
}

const formatDate = (date: string) =>
    new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(date));
const formatPrice = (price: number) =>
    `${new Intl.NumberFormat('fr-FR').format(price)} FCFA`;

export default function ShopsShow({ shop }: ShopsShowProps) {
    const toggle = () =>
        router.post(
            shop.active ? shopsDisable.url(shop.id) : shopsEnable.url(shop.id),
        );
    return (
        <>
            <Head title={`${shop.name} — Boutique`} />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Link
                            href={shopsIndex.url()}
                            className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-xs"
                        >
                            <ArrowLeft className="size-3.5" /> Retour aux
                            boutiques
                        </Link>
                        <h1 className="flex items-center gap-2 text-xl font-semibold">
                            <Store className="text-muted-foreground size-5" />
                            {shop.name}
                        </h1>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link href={shopsEdit.url(shop.id)}>
                                <Pencil className="size-4" /> Modifier
                            </Link>
                        </Button>
                        <Button
                            variant={shop.active ? 'destructive' : 'default'}
                            onClick={toggle}
                        >
                            {shop.active ? 'Désactiver' : 'Réactiver'}
                        </Button>
                    </div>
                </div>
                <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations de la boutique</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {shop.image_url ? (
                                <img
                                    src={shop.image_url}
                                    alt={`Image de ${shop.name}`}
                                    className="h-56 w-full rounded-lg object-cover"
                                />
                            ) : (
                                <div className="bg-muted text-muted-foreground flex h-40 items-center justify-center rounded-lg">
                                    <Store className="size-12" />
                                </div>
                            )}
                            <dl className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <dt className="text-muted-foreground text-xs uppercase">
                                        Vendeur
                                    </dt>
                                    <dd className="mt-1 flex items-center gap-2 text-sm font-medium">
                                        <UserRound className="size-4" />
                                        {shop.seller ? (
                                            <span className="flex flex-col gap-0.5">
                                                <Link
                                                    className="hover:underline"
                                                    href={sellersShow.url(
                                                        shop.seller.id,
                                                    )}
                                                >
                                                    {shop.seller.name}
                                                </Link>
                                                <span className="text-muted-foreground text-xs font-normal">
                                                    {shop.seller.email}
                                                    {shop.seller.phone
                                                        ? ` · ${shop.seller.phone}`
                                                        : ''}
                                                </span>
                                            </span>
                                        ) : (
                                            '—'
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground text-xs uppercase">
                                        Zone
                                    </dt>
                                    <dd className="mt-1 flex items-center gap-2 text-sm">
                                        <MapPin className="size-4" />
                                        {shop.zone}
                                    </dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-muted-foreground text-xs uppercase">
                                        Description
                                    </dt>
                                    <dd className="mt-1 text-sm whitespace-pre-wrap">
                                        {shop.description ||
                                            'Aucune description.'}
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>État et tarif</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                    Statut
                                </span>
                                <Badge
                                    variant={
                                        shop.active ? 'default' : 'secondary'
                                    }
                                >
                                    {shop.active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground inline-flex items-center gap-2">
                                    <Package className="size-4" />
                                    Stock actuel
                                </span>
                                <strong>{shop.stock_quantity}</strong>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                    Poids moyen
                                </span>
                                <strong>{shop.formatted_weight}</strong>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                    Prix actuel
                                </span>
                                <strong>{formatPrice(shop.unit_price)}</strong>
                            </div>
                            <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs">
                                <span className="inline-flex items-center gap-2">
                                    <CalendarClock className="size-3.5" />
                                    Créée le
                                </span>
                                <span>{formatDate(shop.created_at)}</span>
                            </div>
                            <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs">
                                <span>Modifiée le</span>
                                <span>{formatDate(shop.updated_at)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

ShopsShow.layout = {
    breadcrumbs: [
        { title: 'Tableau de bord', href: adminDashboard() },
        { title: 'Boutiques', href: shopsIndex() },
    ],
};
