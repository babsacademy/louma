import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { MoreHorizontal, Plus, Search, UserRound } from 'lucide-react';

import type { PaginatedData, Seller, SellerFilters } from '@/types';

import {
    index as sellersIndex,
    create as sellersCreate,
    show as sellersShow,
    edit as sellersEdit,
    disable as sellersDisable,
    enable as sellersEnable,
} from '@/routes/admin/sellers';
import { dashboard as adminDashboard } from '@/routes/admin';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SellersIndexProps {
    sellers: PaginatedData<Seller>;
    filters: SellerFilters;
}

export default function SellersIndex({ sellers, filters }: SellersIndexProps) {
    const [search, setSearch] = useState<string>(filters.search ?? '');
    const [confirmState, setConfirmState] = useState<{
        open: boolean;
        action: 'disable' | 'enable' | null;
        seller: Seller | null;
    }>({ open: false, action: null, seller: null });

    const searchDebounced = useMemo(() => {
        let timer: ReturnType<typeof setTimeout> | null = null;
        return (value: string) => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                router.get(
                    sellersIndex.url({ query: { search: value || undefined } }),
                    {
                        preserveState: true,
                        replace: true,
                    },
                );
            }, 350);
        };
    }, []);

    const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);
        searchDebounced(value);
    };

    const askConfirm = (action: 'disable' | 'enable', seller: Seller) => {
        setConfirmState({ open: true, action, seller });
    };

    const confirmAction = () => {
        if (!confirmState.action || !confirmState.seller) return;
        const { id } = confirmState.seller;
        if (confirmState.action === 'disable') {
            router.post(sellersDisable.url(id));
        } else {
            router.post(sellersEnable.url(id));
        }
        setConfirmState({ open: false, action: null, seller: null });
    };

    const formatDate = (date: string) =>
        new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(new Date(date));

    return (
        <>
            <Head title="Vendeurs" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <UserRound className="text-muted-foreground size-5" />
                        <h1 className="text-xl font-semibold tracking-tight">
                            Gestion des vendeurs
                        </h1>
                    </div>
                    <Button asChild>
                        <Link href={sellersCreate.url()}>
                            <Plus className="size-4" />
                            Nouveau vendeur
                        </Link>
                    </Button>
                </div>

                <Card className="p-4">
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:max-w-sm">
                            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                            <Label htmlFor="search" className="sr-only">
                                Rechercher
                            </Label>
                            <Input
                                id="search"
                                type="search"
                                value={search}
                                onChange={onSearchChange}
                                placeholder="Rechercher un vendeur (nom, email, téléphone)…"
                                className="pl-9"
                            />
                        </div>
                        <p className="text-muted-foreground text-xs">
                            {sellers.total} résultat
                            {sellers.total > 1 ? 's' : ''}
                        </p>
                    </div>

                    {sellers.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                            <UserRound className="text-muted-foreground/60 size-10" />
                            <p className="text-sm font-medium">Aucun vendeur</p>
                            <p className="text-muted-foreground text-xs">
                                Commencez par créer un premier vendeur.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto rounded-md border">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/40 text-muted-foreground text-xs uppercase">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">
                                                Nom
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Email
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Téléphone
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Statut
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Boutiques
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Créé le
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {sellers.data.map((seller) => (
                                            <tr
                                                key={seller.id}
                                                className="align-middle"
                                            >
                                                <td className="px-4 py-3 font-medium">
                                                    <Link
                                                        href={sellersShow.url(
                                                            seller.id,
                                                        )}
                                                        className="hover:underline"
                                                    >
                                                        {seller.name}
                                                    </Link>
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3">
                                                    {seller.email}
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3">
                                                    {seller.phone ?? '—'}
                                                </td>
                                                <td className="px-4 py-3">
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
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3 tabular-nums">
                                                    {seller.shops_count ?? 0}
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3">
                                                    {formatDate(
                                                        seller.created_at,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                            >
                                                                <MoreHorizontal className="size-4" />
                                                                <span className="sr-only">
                                                                    Actions
                                                                </span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                asChild
                                                            >
                                                                <Link
                                                                    href={sellersShow.url(
                                                                        seller.id,
                                                                    )}
                                                                >
                                                                    Voir la
                                                                    fiche
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                asChild
                                                            >
                                                                <Link
                                                                    href={sellersEdit.url(
                                                                        seller.id,
                                                                    )}
                                                                >
                                                                    Modifier
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {seller.active ? (
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        askConfirm(
                                                                            'disable',
                                                                            seller,
                                                                        )
                                                                    }
                                                                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                                >
                                                                    Désactiver
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        askConfirm(
                                                                            'enable',
                                                                            seller,
                                                                        )
                                                                    }
                                                                >
                                                                    Réactiver
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {sellers.last_page > 1 && (
                                <nav className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
                                    <p className="text-muted-foreground text-xs">
                                        Affichage de {sellers.from} à{' '}
                                        {sellers.to} sur {sellers.total}
                                    </p>
                                    <ul className="flex flex-wrap items-center gap-1">
                                        {sellers.links.map((link, idx) => {
                                            const label = link.label
                                                .replace(
                                                    '&laquo; Précédent',
                                                    'Précédent',
                                                )
                                                .replace(
                                                    'Suivant &raquo;',
                                                    'Suivant',
                                                );
                                            if (!link.url) {
                                                return (
                                                    <li key={idx}>
                                                        <span className="text-muted-foreground/60 inline-flex h-8 items-center rounded-md px-3 text-xs">
                                                            {label}
                                                        </span>
                                                    </li>
                                                );
                                            }
                                            const url = new URL(
                                                link.url,
                                                window.location.origin,
                                            );
                                            const page =
                                                url.searchParams.get('page') ??
                                                undefined;
                                            const active = link.active;
                                            return (
                                                <li key={idx}>
                                                    <button
                                                        type="button"
                                                        disabled={active}
                                                        onClick={() =>
                                                            router.get(
                                                                sellersIndex.url(
                                                                    {
                                                                        query: {
                                                                            search:
                                                                                filters.search ||
                                                                                undefined,
                                                                            page,
                                                                        },
                                                                    },
                                                                ),
                                                                {
                                                                    preserveState: true,
                                                                },
                                                            )
                                                        }
                                                        className={[
                                                            'inline-flex h-8 items-center rounded-md border px-3 text-xs transition-colors',
                                                            active
                                                                ? 'border-primary bg-primary text-primary-foreground'
                                                                : 'border-border hover:bg-muted/60',
                                                        ].join(' ')}
                                                    >
                                                        {label}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </nav>
                            )}
                        </>
                    )}
                </Card>
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
                                            <strong>
                                                {confirmState.seller?.name}
                                            </strong>{' '}
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
                                        <strong>
                                            {confirmState.seller?.name}
                                        </strong>{' '}
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
                                setConfirmState({
                                    open: false,
                                    action: null,
                                    seller: null,
                                })
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

SellersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Tableau de bord',
            href: adminDashboard(),
        },
        {
            title: 'Vendeurs',
            href: sellersIndex(),
        },
    ],
};
