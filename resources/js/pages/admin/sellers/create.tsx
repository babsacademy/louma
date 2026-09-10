import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, UserRoundPlus, Save, X } from 'lucide-react';

import {
    store as sellersStore,
    index as sellersIndex,
    create as sellersCreate,
} from '@/routes/admin/sellers';
import { dashboard as adminDashboard } from '@/routes/admin';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PasswordInput from '@/components/password-input';
import InputError from '@/components/input-error';
import { useForm } from '@inertiajs/react';

export default function SellersCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post(sellersStore.url());
    };

    return (
        <>
            <Head title="Créer un vendeur" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <UserRoundPlus className="text-muted-foreground size-5" />
                        <h1 className="text-xl font-semibold tracking-tight">
                            Créer un vendeur
                        </h1>
                    </div>
                    <Button asChild variant="outline">
                        <Link href={sellersIndex.url()}>
                            <ArrowLeft className="size-4" />
                            Retour à la liste
                        </Link>
                    </Button>
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

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="password">
                                    Mot de passe initial
                                </Label>
                                <PasswordInput
                                    id="password"
                                    autoComplete="new-password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    required
                                    disabled={processing}
                                />
                                <InputError message={errors.password} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="password_confirmation">
                                    Confirmer le mot de passe
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    autoComplete="new-password"
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                    required
                                    disabled={processing}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    (window.location.href = sellersIndex.url())
                                }
                                disabled={processing}
                                asChild={false}
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

SellersCreate.layout = {
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
            title: 'Créer',
            href: sellersCreate(),
        },
    ],
};
