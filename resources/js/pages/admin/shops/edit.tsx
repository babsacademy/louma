import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Store } from 'lucide-react';

import ShopForm from '@/components/admin/shop-form';
import { Button } from '@/components/ui/button';
import type { ShopForEdit, ShopSeller } from '@/types';
import { dashboard as adminDashboard } from '@/routes/admin';
import {
    index as shopsIndex,
    show as shopsShow,
    update as shopsUpdate,
} from '@/routes/admin/shops';

interface ShopsEditProps {
    shop: ShopForEdit;
    sellers: ShopSeller[];
}

export default function ShopsEdit({ shop, sellers }: ShopsEditProps) {
    return (
        <>
            <Head title={`Modifier — ${shop.name}`} />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Link
                            href={shopsShow.url(shop.id)}
                            className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-xs"
                        >
                            <ArrowLeft className="size-3.5" /> Retour à la
                            boutique
                        </Link>
                        <h1 className="flex items-center gap-2 text-xl font-semibold">
                            <Store className="text-muted-foreground size-5" />
                            Modifier {shop.name}
                        </h1>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={shopsShow.url(shop.id)}>Annuler</Link>
                    </Button>
                </div>
                <ShopForm
                    sellers={sellers}
                    shop={shop}
                    action={shopsUpdate.url(shop.id)}
                    method="patch"
                />
            </div>
        </>
    );
}

ShopsEdit.layout = {
    breadcrumbs: [
        { title: 'Tableau de bord', href: adminDashboard() },
        { title: 'Boutiques', href: shopsIndex() },
    ],
};
