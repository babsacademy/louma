import { Link } from '@inertiajs/react';
import { ArrowUpRight, MapPin, Package, Scale } from 'lucide-react';

import ShopAvailabilityBadge from '@/components/public/shop-availability-badge';
import ShopImage from '@/components/public/shop-image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { formatFcfa } from '@/lib/format';
import type { PublicShop } from '@/types';
import { show as shopsShow } from '@/routes/public/shops';

export default function PublicShopCard({ shop }: { shop: PublicShop }) {
    const available = shop.stock_quantity > 0;

    return (
        <Card className="group h-full gap-0 overflow-hidden border-stone-200 py-0 shadow-sm transition-shadow duration-300 hover:shadow-lg">
            <ShopImage
                src={shop.image_url}
                alt={shop.name}
                className="aspect-[16/10]"
            />
            <CardContent className="flex flex-1 flex-col gap-3 px-4 pt-4">
                <div className="flex min-h-12 items-start justify-between gap-3">
                    <h2 className="text-lg leading-tight font-semibold tracking-tight">
                        {shop.name}
                    </h2>
                    <ShopAvailabilityBadge available={available} />
                </div>
                <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <MapPin className="size-4" />
                    {shop.zone}
                </p>
                <div className="grid grid-cols-2 gap-2 border-y border-stone-200 py-3 text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                        <Scale className="size-4" />
                        {shop.formatted_weight}
                    </span>
                    <span className="text-muted-foreground flex items-center justify-end gap-1.5 font-medium">
                        <Package className="size-4" />
                        {shop.stock_quantity} en stock
                    </span>
                </div>
                <div className="mt-auto">
                    <p className="text-muted-foreground text-sm">
                        Prix unitaire
                    </p>
                    <p className="mt-1 text-xl font-semibold tracking-tight text-amber-800">
                        {formatFcfa(shop.unit_price)}
                    </p>
                </div>
            </CardContent>
            <CardFooter className="mt-auto px-4 pt-3 pb-4">
                <Button
                    className="h-10 w-full border-stone-300"
                    variant="outline"
                    asChild
                >
                    <Link href={shopsShow.url(shop.slug)}>
                        Voir la boutique
                        <ArrowUpRight className="size-4" aria-hidden="true" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
