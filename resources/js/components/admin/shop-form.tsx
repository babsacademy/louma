import { FormEvent, useState } from 'react';
import { useForm } from '@inertiajs/react';

import type { ShopForEdit, ShopSeller } from '@/types';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface ShopFormProps {
    sellers: ShopSeller[];
    shop?: ShopForEdit;
    action: string;
    method: 'post' | 'patch';
}

interface ShopFormData {
    seller_id: string;
    name: string;
    zone: string;
    description: string;
    stock_quantity: string;
    average_weight: string;
    active: boolean;
    image: File | null;
}

export default function ShopForm({
    sellers,
    shop,
    action,
    method,
}: ShopFormProps) {
    const form = useForm<ShopFormData>({
        seller_id: shop ? String(shop.seller_id) : '',
        name: shop?.name ?? '',
        zone: shop?.zone ?? '',
        description: shop?.description ?? '',
        stock_quantity: shop ? String(shop.stock_quantity) : '0',
        average_weight: shop ? String(shop.average_weight_kg) : '',
        active: shop?.active ?? true,
        image: null,
    });
    const [imageName, setImageName] = useState<string>('');

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const options = { forceFormData: true, preserveScroll: true };
        if (method === 'post') {
            form.post(action, options);
        } else {
            form.patch(action, options);
        }
    };

    return (
        <Card className="mx-auto w-full max-w-3xl">
            <form onSubmit={submit}>
                <CardContent className="grid gap-5 p-6 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="seller_id">Vendeur</Label>
                        <Select
                            value={form.data.seller_id}
                            onValueChange={(value) =>
                                form.setData('seller_id', value)
                            }
                        >
                            <SelectTrigger id="seller_id" className="w-full">
                                <SelectValue placeholder="Sélectionner un vendeur" />
                            </SelectTrigger>
                            <SelectContent>
                                {sellers.map((seller) => (
                                    <SelectItem
                                        key={seller.id}
                                        value={String(seller.id)}
                                    >
                                        {seller.name} · {seller.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={form.errors.seller_id} />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="name">Nom de la boutique</Label>
                        <Input
                            id="name"
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            disabled={form.processing}
                        />
                        <InputError message={form.errors.name} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="zone">Zone</Label>
                        <Input
                            id="zone"
                            placeholder="Ex. Almadies"
                            value={form.data.zone}
                            onChange={(event) =>
                                form.setData('zone', event.target.value)
                            }
                            disabled={form.processing}
                        />
                        <InputError message={form.errors.zone} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="stock_quantity">Stock disponible</Label>
                        <Input
                            id="stock_quantity"
                            type="number"
                            min="0"
                            step="1"
                            value={form.data.stock_quantity}
                            onChange={(event) =>
                                form.setData(
                                    'stock_quantity',
                                    event.target.value,
                                )
                            }
                            disabled={form.processing}
                        />
                        <InputError message={form.errors.stock_quantity} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="average_weight">Poids moyen (kg)</Label>
                        <Input
                            id="average_weight"
                            type="number"
                            min="0.5"
                            max="10"
                            step="0.001"
                            placeholder="Ex. 2.1"
                            value={form.data.average_weight}
                            onChange={(event) =>
                                form.setData(
                                    'average_weight',
                                    event.target.value,
                                )
                            }
                            disabled={form.processing}
                        />
                        <p className="text-muted-foreground text-xs">
                            Sera converti en grammes côté serveur.
                        </p>
                        <InputError message={form.errors.average_weight} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="description">
                            Description{' '}
                            <span className="text-muted-foreground text-xs">
                                (optionnelle)
                            </span>
                        </Label>
                        <Textarea
                            id="description"
                            rows={4}
                            value={form.data.description}
                            onChange={(event) =>
                                form.setData('description', event.target.value)
                            }
                            disabled={form.processing}
                        />
                        <InputError message={form.errors.description} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="image">
                            Image principale{' '}
                            <span className="text-muted-foreground text-xs">
                                (optionnelle, 2 Mo max.)
                            </span>
                        </Label>
                        <Input
                            id="image"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(event) => {
                                const file = event.target.files?.[0] ?? null;
                                form.setData('image', file);
                                setImageName(file?.name ?? '');
                            }}
                            disabled={form.processing}
                        />
                        {imageName ? (
                            <p className="text-muted-foreground text-xs">
                                {imageName}
                            </p>
                        ) : null}
                        <InputError message={form.errors.image} />
                    </div>
                    {shop ? (
                        <label className="flex items-center gap-2 text-sm sm:col-span-2">
                            <input
                                type="checkbox"
                                checked={form.data.active}
                                onChange={(event) =>
                                    form.setData('active', event.target.checked)
                                }
                                disabled={form.processing}
                                className="border-input size-4 rounded"
                            />
                            Boutique active
                        </label>
                    ) : null}
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t px-6 py-4">
                    <Button
                        type="submit"
                        disabled={form.processing || sellers.length === 0}
                    >
                        {form.processing
                            ? 'Enregistrement…'
                            : shop
                              ? 'Enregistrer les modifications'
                              : 'Créer la boutique'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
