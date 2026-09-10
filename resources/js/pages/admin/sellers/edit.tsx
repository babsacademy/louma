import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, UserRoundPen, X } from 'lucide-react';

import type { SellerForEdit } from '@/types';

import {
    index as sellersIndex,
    show as sellersShow,
    update as sellersUpdate,
    edit as sellersEdit,
} from '@/routes/admin/sellers';
import { dashboard as adminDashboard } from '@/routes/admin';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';

interface SellersEditProps {
    seller: SellerForEdit;
}

export default function SellersEdit({ seller }: SellersEditProps) {
    const { data, setData, patch, processing, errors } = useForm({
        name: seller.name,
        email: seller.email,
        phone: seller.phone ?? '',
    });

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        patch(sellersUpdate.url(seller.id));
    };

    return (
        <>
            <Head title={`Modifier — ${seller.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                        <Link
                            href={sellersShow.url(seller.id)}
                            className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1 text-xs"
                        >
                            <ArrowLeft className="size-3.5" />
                            Retour à la fiche
                        </Link>
                        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                            <UserRoundPen className="text-muted-foreground size-5" />
                            Modifier {seller.name}
                        </h1>
                    </div>
                </div>

                <Card className="mx-auto w-full max-w-2xl p-6">
                    <form onSubmit={submit} className="space-y-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="name">Nom complet</Label>
                            <Input
                                id="name"
                                type="text"
                                autoComplete="name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                required
                                disabled={processing}
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                required
                                disabled={processing}
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="phone">
                                Téléphone{' '}
                                <span className="text-muted-foreground text-xs">
                                    (optionnel)
                                </span>
                            </Label>
                            <Input
                                id="phone"
                                type="tel"
                                autoComplete="tel"
                                placeholder="+221 77 000 00 00"
                                value={data.phone}
                                onChange={(e) =>
                                    setData('phone', e.target.value)
                                }
                                disabled={processing}
                            />
                            <InputError message={errors.phone} />
                        </div>

                        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    (window.location.href = sellersShow.url(
                                        seller.id,
                                    ))
                                }
                                disabled={processing}
                            >
                                <X className="size-4" />
                                Annuler
                            </Button>
                            <Button type="submit" disabled={processing}>
                                <Save className="size-4" />
                                {processing ? 'Enregistrement…' : 'Enregistrer'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </>
    );
}

SellersEdit.layout = {
    breadcrumbs: [
        {
            title: 'Tableau de bord',
            href: adminDashboard(),
        },
        {
            title: 'Vendeurs',
            href: sellersIndex(),
        },
        {
            title: () => 'Modifier',
            href: () => sellersEdit(sellerRoutePlaceholder()),
        },
    ],
};

function sellerRoutePlaceholder() {
    return { seller: 1 };
}
