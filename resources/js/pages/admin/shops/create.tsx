import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Store } from 'lucide-react';

import ShopForm from '@/components/admin/shop-form';
import { Button } from '@/components/ui/button';
import type { ShopSeller } from '@/types';
import { dashboard as adminDashboard } from '@/routes/admin';
import { index as shopsIndex, store as shopsStore } from '@/routes/admin/shops';

interface ShopsCreateProps {
    sellers: ShopSeller[];
}

export default function ShopsCreate({ sellers }: ShopsCreateProps) {
    return (
        <>
            <Head title="Nouvelle boutique" />
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
                            Nouvelle boutique
                        </h1>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={shopsIndex.url()}>Annuler</Link>
                    </Button>
                </div>
                {sellers.length === 0 ? (
                    <p className="text-muted-foreground rounded-md border border-dashed p-6 text-sm">
                        Créez d’abord un vendeur actif pour pouvoir attribuer
                        une boutique.
                    </p>
                ) : (
                    <ShopForm
                        sellers={sellers}
                        action={shopsStore.url()}
                        method="post"
                    />
                )}
            </div>
        </>
    );
}

ShopsCreate.layout = {
    breadcrumbs: [
        { title: 'Tableau de bord', href: adminDashboard() },
        { title: 'Boutiques', href: shopsIndex() },
        { title: 'Créer', href: shopsIndex() },
    ],
};
