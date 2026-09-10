import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { update } from '@/routes/seller/shops/inventory';
import type { SellerShopDetails } from '@/types';

type InventoryFormData = {
    stock_quantity: string;
    average_weight: string;
};

export function ShopInventoryForm({ shop }: { shop: SellerShopDetails }) {
    const form = useForm<InventoryFormData>({
        stock_quantity: String(shop.stock_quantity),
        average_weight: String(shop.average_weight_kg),
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.patch(update.url(shop.id), { preserveScroll: true });
    };

    return (
        <form className="space-y-5" onSubmit={submit}>
            <div className="space-y-2">
                <Label htmlFor="stock_quantity">Stock disponible</Label>
                <Input
                    id="stock_quantity"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={form.data.stock_quantity}
                    onChange={(event) =>
                        form.setData('stock_quantity', event.target.value)
                    }
                    disabled={form.processing}
                />
                <InputError message={form.errors.stock_quantity} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="average_weight">Poids moyen (kg)</Label>
                <Input
                    id="average_weight"
                    type="number"
                    inputMode="decimal"
                    min="0.5"
                    max="10"
                    step="0.001"
                    value={form.data.average_weight}
                    onChange={(event) =>
                        form.setData('average_weight', event.target.value)
                    }
                    disabled={form.processing}
                />
                <p className="text-muted-foreground text-xs">
                    La valeur est convertie en grammes entiers côté serveur.
                </p>
                <InputError message={form.errors.average_weight} />
            </div>
            <Button className="w-full" type="submit" disabled={form.processing}>
                {form.processing
                    ? 'Enregistrement…'
                    : 'Enregistrer les modifications'}
            </Button>
        </form>
    );
}
