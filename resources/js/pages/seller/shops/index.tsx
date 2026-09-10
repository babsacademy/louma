import { Head } from '@inertiajs/react';
import { Store } from 'lucide-react';

import { SellerShopCard } from '@/components/seller/shop-card';
import { Card, CardContent } from '@/components/ui/card';
import { dashboard as sellerDashboard } from '@/routes/seller';
import { index as shopsIndex } from '@/routes/seller/shops';
import type { SellerShop } from '@/types';

export default function SellerShopsIndex({ shops }: { shops: SellerShop[] }) {
    return (
        <>
            <Head title="Mes boutiques" />
            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <div>
                    <p className="text-muted-foreground text-sm">
                        Espace vendeur
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Mes boutiques
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Gérez uniquement le stock et le poids moyen de vos
                        boutiques.
                    </p>
                </div>
                {shops.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center">
                            <Store className="text-muted-foreground mx-auto size-10" />
                            <p className="mt-3 font-medium">
                                Aucune boutique attribuée
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
            </div>
        </>
    );
}

SellerShopsIndex.layout = {
    breadcrumbs: [
        { title: 'Tableau de bord', href: sellerDashboard() },
        { title: 'Mes boutiques', href: shopsIndex() },
    ],
};
