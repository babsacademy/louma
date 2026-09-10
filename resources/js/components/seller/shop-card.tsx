import { Link } from '@inertiajs/react';
import { MapPin, Package, Scale, Store } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { formatFcfa } from '@/lib/format';
import { show as shopsShow } from '@/routes/seller/shops';
import type { SellerShop } from '@/types';

export function SellerShopCard({ shop }: { shop: SellerShop }) {
    return (
        <Card className="flex h-full flex-col overflow-hidden">
            {shop.image_url ? (
                <img
                    src={shop.image_url}
                    alt={`Image de ${shop.name}`}
                    className="aspect-[16/9] w-full object-cover"
                    loading="lazy"
                />
            ) : (
                <div className="bg-muted text-muted-foreground flex aspect-[16/9] items-center justify-center">
                    <Store className="size-10" aria-hidden="true" />
                </div>
            )}
            <CardContent className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="font-semibold">{shop.name}</h2>
                        <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
                            <MapPin className="size-3.5" aria-hidden="true" />
                            {shop.zone}
                        </p>
                    </div>
                    <Badge variant={shop.active ? 'default' : 'secondary'}>
                        {shop.active ? 'Active' : 'Inactive'}
                    </Badge>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <dt className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Package className="size-3.5" aria-hidden="true" />
                            Stock
                        </dt>
                        <dd className="mt-1 font-semibold tabular-nums">
                            {shop.stock_quantity}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Scale className="size-3.5" aria-hidden="true" />
                            Poids moyen
                        </dt>
                        <dd className="mt-1 font-semibold">
                            {shop.formatted_weight}
                        </dd>
                    </div>
                </dl>
                <p className="mt-auto text-lg font-bold">
                    {formatFcfa(shop.unit_price)}
                </p>
            </CardContent>
            <CardFooter className="border-t p-3">
                <Button className="w-full" variant="outline" asChild>
                    <Link href={shopsShow.url(shop.id)}>Gérer le stock</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
