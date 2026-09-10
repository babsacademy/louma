import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, MapPin, Package, Scale, Store } from 'lucide-react';

import { ShopInventoryForm } from '@/components/seller/shop-inventory-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatFcfa } from '@/lib/format';
import { dashboard as sellerDashboard } from '@/routes/seller';
import { index as shopsIndex } from '@/routes/seller/shops';
import type { SellerShopDetails } from '@/types';

export default function SellerShopsShow({ shop }: { shop: SellerShopDetails }) {
    return (
        <>
            <Head title={`${shop.name} — Espace vendeur`} />
            <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Link
                            href={shopsIndex.url()}
                            className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-sm"
                        >
                            <ArrowLeft className="size-4" /> Retour à mes
                            boutiques
                        </Link>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                {shop.name}
                            </h1>
                            <Badge
                                variant={shop.active ? 'default' : 'secondary'}
                            >
                                {shop.active ? 'Active' : 'Désactivée'}
                            </Badge>
                        </div>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={shopsIndex.url()}>Voir mon stock</Link>
                    </Button>
                </div>
                {!shop.active ? (
                    <Alert>
                        <AlertTitle>
                            Boutique désactivée par l’administration
                        </AlertTitle>
                        <AlertDescription>
                            Vous pouvez consulter ses informations, mais son
                            stock et son poids ne peuvent pas être modifiés.
                        </AlertDescription>
                    </Alert>
                ) : null}
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
                    <Card>
                        <CardContent className="space-y-5 p-5">
                            {shop.image_url ? (
                                <img
                                    src={shop.image_url}
                                    alt={`Image de ${shop.name}`}
                                    className="aspect-video w-full rounded-lg object-cover"
                                />
                            ) : (
                                <div className="bg-muted text-muted-foreground flex aspect-video items-center justify-center rounded-lg">
                                    <Store className="size-12" />
                                </div>
                            )}
                            <dl className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <dt className="text-muted-foreground flex items-center gap-1 text-xs uppercase">
                                        <MapPin className="size-3.5" /> Zone
                                    </dt>
                                    <dd className="mt-1 font-medium">
                                        {shop.zone}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground flex items-center gap-1 text-xs uppercase">
                                        <Scale className="size-3.5" /> Poids
                                        moyen
                                    </dt>
                                    <dd className="mt-1 font-medium">
                                        {shop.formatted_weight}
                                    </dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-muted-foreground text-xs uppercase">
                                        Description
                                    </dt>
                                    <dd className="mt-1 whitespace-pre-wrap">
                                        {shop.description ||
                                            'Aucune description.'}
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                    <div className="space-y-5">
                        <Card>
                            <CardHeader>
                                <CardTitle>État actuel</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-muted-foreground flex items-center gap-2 text-sm">
                                        <Package className="size-4" /> Stock
                                        disponible
                                    </span>
                                    <strong className="tabular-nums">
                                        {shop.stock_quantity}
                                    </strong>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-muted-foreground text-sm">
                                        Prix actuel
                                    </span>
                                    <strong>
                                        {formatFcfa(shop.unit_price)}
                                    </strong>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Mettre à jour le stock</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {shop.active ? (
                                    <ShopInventoryForm shop={shop} />
                                ) : (
                                    <p className="text-muted-foreground text-sm">
                                        Les modifications sont bloquées tant que
                                        la boutique est désactivée.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

SellerShopsShow.layout = {
    breadcrumbs: [
        { title: 'Tableau de bord', href: sellerDashboard() },
        { title: 'Mes boutiques', href: shopsIndex() },
    ],
};
