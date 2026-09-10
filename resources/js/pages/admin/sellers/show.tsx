import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    ArrowLeft,
    Building2,
    CalendarClock,
    Mail,
    Phone,
    UserRound,
} from 'lucide-react';

import type { Seller } from '@/types';

import {
    index as sellersIndex,
    show as sellersShow,
    edit as sellersEdit,
    disable as sellersDisable,
    enable as sellersEnable,
} from '@/routes/admin/sellers';
import { dashboard as adminDashboard } from '@/routes/admin';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface SellersShowProps {
    seller: Seller;
}

export default function SellersShow({ seller }: SellersShowProps) {
    const [confirmState, setConfirmState] = useState<{
        open: boolean;
        action: 'disable' | 'enable' | null;
    }>({ open: false, action: null });

    const formatDate = (date: string) =>
        new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));

    const askConfirm = (action: 'disable' | 'enable') => {
        setConfirmState({ open: true, action });
    };

    const confirmAction = () => {
        if (!confirmState.action) return;
        if (confirmState.action === 'disable') {
            router.post(sellersDisable.url(seller.id));
        } else {
            router.post(sellersEnable.url(seller.id));
        }
        setConfirmState({ open: false, action: null });
    };

    const shopsCount = useMemo(
        () => seller.shops_count ?? 0,
        [seller.shops_count],
    );

    return (
        <>
            <Head title={`${seller.name} — Vendeur`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                        <Link
                            href={sellersIndex.url()}
                            className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1 text-xs"
                        >
                            <ArrowLeft className="size-3.5" />
                            Retour aux vendeurs
                        </Link>
                        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                            <UserRound className="text-muted-foreground size-5" />
                            {seller.name}
                        </h1>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild>
                            <Link href={sellersEdit.url(seller.id)}>
                                Modifier
                            </Link>
                        </Button>
                        {seller.active ? (
                            <Button
                                variant="destructive"
                                onClick={() => askConfirm('disable')}
                            >
                                Désactiver
                            </Button>
                        ) : (
                            <Button onClick={() => askConfirm('enable')}>
                                Réactiver
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="p-6 lg:col-span-2">
                        <h2 className="text-muted-foreground text-sm font-semibold">
                            Informations du vendeur
                        </h2>
                        <Separator className="my-4" />
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-muted-foreground text-xs tracking-wide uppercase">
                                    Nom complet
                                </dt>
                                <dd className="mt-1 text-sm font-medium">
                                    {seller.name}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground text-xs tracking-wide uppercase">
                                    Statut
                                </dt>
                                <dd className="mt-1">
                                    {seller.active ? (
                                        <Badge
                                            variant="default"
                                            className="bg-emerald-600 hover:bg-emerald-600/90"
                                        >
                                            Actif
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary">
                                            Inactif
                                        </Badge>
                                    )}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground flex items-center gap-1 text-xs tracking-wide uppercase">
                                    <Mail className="size-3" />
                                    Email
                                </dt>
                                <dd className="mt-1 text-sm break-all">
                                    {seller.email}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground flex items-center gap-1 text-xs tracking-wide uppercase">
                                    <Phone className="size-3" />
                                    Téléphone
                                </dt>
                                <dd className="mt-1 text-sm">
                                    {seller.phone ?? '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground flex items-center gap-1 text-xs tracking-wide uppercase">
                                    <CalendarClock className="size-3" />
                                    Date de création
                                </dt>
                                <dd className="mt-1 text-sm">
                                    {formatDate(seller.created_at)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground text-xs tracking-wide uppercase">
                                    Créé par
                                </dt>
                                <dd className="mt-1 text-sm">
                                    {seller.creator?.name ?? '—'}
                                </dd>
                            </div>
                            {seller.disabled_at ? (
                                <div className="sm:col-span-2">
                                    <dt className="text-destructive/80 text-xs tracking-wide uppercase">
                                        Désactivé le
                                    </dt>
                                    <dd className="text-destructive mt-1 text-sm">
                                        {formatDate(seller.disabled_at)}
                                    </dd>
                                </div>
                            ) : null}
                        </dl>
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-muted-foreground text-sm font-semibold">
                            Activité
                        </h2>
                        <Separator className="my-4" />
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-center justify-between gap-2">
                                <span className="text-muted-foreground inline-flex items-center gap-2">
                                    <Building2 className="size-4" />
                                    Boutiques
                                </span>
                                <span className="font-semibold tabular-nums">
                                    {shopsCount}
                                </span>
                            </li>
                            <li className="flex items-center justify-between gap-2">
                                <span className="text-muted-foreground">
                                    Commandes (à venir)
                                </span>
                                <span className="text-muted-foreground/60 font-semibold tabular-nums">
                                    —
                                </span>
                            </li>
                        </ul>
                        <Separator className="my-5" />
                        <p className="text-muted-foreground text-xs">
                            La gestion des boutiques et commandes arrive
                            prochainement.
                        </p>
                    </Card>
                </div>
            </div>

            <Dialog
                open={confirmState.open}
                onOpenChange={(open) =>
                    setConfirmState((s) => ({ ...s, open }))
                }
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {confirmState.action === 'disable'
                                ? 'Désactiver le vendeur ?'
                                : 'Réactiver le vendeur ?'}
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div className="text-muted-foreground space-y-2 text-sm">
                                {confirmState.action === 'disable' ? (
                                    <>
                                        <p>
                                            Le vendeur{' '}
                                            <strong>{seller.name}</strong>{' '}
                                            perdra immédiatement l'accès à son
                                            espace.
                                        </p>
                                        <p className="text-xs">
                                            Cette action est réversible
                                            (réactivation).
                                        </p>
                                    </>
                                ) : (
                                    <p>
                                        Le vendeur{' '}
                                        <strong>{seller.name}</strong>{' '}
                                        retrouvera immédiatement l'accès à son
                                        espace.
                                    </p>
                                )}
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                setConfirmState({ open: false, action: null })
                            }
                        >
                            Annuler
                        </Button>
                        <Button
                            type="button"
                            variant={
                                confirmState.action === 'disable'
                                    ? 'destructive'
                                    : 'default'
                            }
                            onClick={confirmAction}
                        >
                            {confirmState.action === 'disable'
                                ? 'Désactiver'
                                : 'Réactiver'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

SellersShow.layout = {
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
            title: () => 'Détail',
            href: () =>
                sellersShow(
                    (window as any).__sellerRouteArg ??
                        sellerRoutePlaceholder(),
                ),
        },
    ],
};

function sellerRoutePlaceholder() {
    return { seller: 1 };
}
