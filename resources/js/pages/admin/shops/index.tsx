import { Head, Link, router } from '@inertiajs/react';
import { MoreHorizontal, Plus, Search, Store } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PaginatedData, Shop, ShopFilters } from '@/types';
import { dashboard as adminDashboard } from '@/routes/admin';
import {
    create as shopsCreate,
    disable as shopsDisable,
    edit as shopsEdit,
    enable as shopsEnable,
    index as shopsIndex,
    show as shopsShow,
} from '@/routes/admin/shops';

interface ShopsIndexProps {
    shops: PaginatedData<Shop>;
    zones: string[];
    filters: ShopFilters;
}

const formatPrice = (price: number) =>
    `${new Intl.NumberFormat('fr-FR').format(price)} FCFA`;
const formatDate = (date: string) =>
    new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(
        new Date(date),
    );

export default function ShopsIndex({ shops, zones, filters }: ShopsIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [zone, setZone] = useState(filters.zone ?? 'all');
    const [status, setStatus] = useState(filters.status ?? 'all');
    const reload = (next: Partial<ShopFilters> = {}) =>
        router.get(
            shopsIndex.url({
                query: {
                    search: (next.search ?? search) || undefined,
                    zone: next.zone ?? (zone === 'all' ? undefined : zone),
                    status:
                        next.status ?? (status === 'all' ? undefined : status),
                },
            }),
            { preserveState: true, replace: true },
        );
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search ?? '')) reload({ search });
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);
    return (
        <>
            <Head title="Boutiques" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-xl font-semibold">
                            <Store className="text-muted-foreground size-5" />
                            Gestion des boutiques
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {shops.total} boutique{shops.total > 1 ? 's' : ''}
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={shopsCreate.url()}>
                            <Plus className="size-4" />
                            Nouvelle boutique
                        </Link>
                    </Button>
                </div>
                <Card>
                    <CardContent className="space-y-4 p-4">
                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_180px]">
                            <div className="relative">
                                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                <Label
                                    htmlFor="shop-search"
                                    className="sr-only"
                                >
                                    Rechercher une boutique
                                </Label>
                                <Input
                                    id="shop-search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Nom, vendeur ou zone…"
                                    className="pl-9"
                                />
                            </div>
                            <Select
                                value={zone}
                                onValueChange={(value) => {
                                    setZone(value);
                                    reload({
                                        zone: value === 'all' ? '' : value,
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Toutes les zones" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Toutes les zones
                                    </SelectItem>
                                    {zones.map((item) => (
                                        <SelectItem key={item} value={item}>
                                            {item}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={status}
                                onValueChange={(value) => {
                                    setStatus(value);
                                    reload({
                                        status: value === 'all' ? '' : value,
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Tous les statuts" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Tous les statuts
                                    </SelectItem>
                                    <SelectItem value="active">
                                        Actives
                                    </SelectItem>
                                    <SelectItem value="inactive">
                                        Inactives
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {shops.data.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-12 text-center">
                                <Store className="text-muted-foreground/50 size-10" />
                                <p className="font-medium">
                                    Aucune boutique trouvée
                                </p>
                                <p className="text-muted-foreground text-sm">
                                    Modifiez vos filtres ou créez une boutique.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-md border">
                                <table className="w-full min-w-[900px] text-left text-sm">
                                    <thead className="bg-muted/40 text-muted-foreground text-xs uppercase">
                                        <tr>
                                            {[
                                                'Boutique',
                                                'Vendeur',
                                                'Zone',
                                                'Stock',
                                                'Poids',
                                                'Prix',
                                                'Statut',
                                                'Créée le',
                                                '',
                                            ].map((heading) => (
                                                <th
                                                    key={heading}
                                                    className="px-4 py-3 font-medium"
                                                >
                                                    {heading}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {shops.data.map((shop) => (
                                            <tr
                                                key={shop.id}
                                                className="hover:bg-muted/30 align-middle"
                                            >
                                                <td className="px-4 py-3">
                                                    <Link
                                                        href={shopsShow.url(
                                                            shop.id,
                                                        )}
                                                        className="flex items-center gap-2 font-medium hover:underline"
                                                    >
                                                        {shop.image_url ? (
                                                            <img
                                                                src={
                                                                    shop.image_url
                                                                }
                                                                alt=""
                                                                className="size-9 rounded object-cover"
                                                            />
                                                        ) : (
                                                            <span className="bg-muted flex size-9 items-center justify-center rounded">
                                                                <Store className="text-muted-foreground size-4" />
                                                            </span>
                                                        )}
                                                        {shop.name}
                                                    </Link>
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3">
                                                    {shop.seller?.name ?? '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {shop.zone}
                                                </td>
                                                <td className="px-4 py-3 tabular-nums">
                                                    {shop.stock_quantity}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {shop.formatted_weight}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {formatPrice(
                                                        shop.unit_price,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge
                                                        variant={
                                                            shop.active
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {shop.active
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </Badge>
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
                                                    {formatDate(
                                                        shop.created_at,
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
                                                                    href={shopsShow.url(
                                                                        shop.id,
                                                                    )}
                                                                >
                                                                    Voir
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                asChild
                                                            >
                                                                <Link
                                                                    href={shopsEdit.url(
                                                                        shop.id,
                                                                    )}
                                                                >
                                                                    Modifier
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    router.post(
                                                                        shop.active
                                                                            ? shopsDisable.url(
                                                                                  shop.id,
                                                                              )
                                                                            : shopsEnable.url(
                                                                                  shop.id,
                                                                              ),
                                                                    )
                                                                }
                                                            >
                                                                {shop.active
                                                                    ? 'Désactiver'
                                                                    : 'Réactiver'}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {shops.last_page > 1 ? (
                            <nav className="flex flex-wrap justify-end gap-1">
                                {shops.links.map((link, index) =>
                                    link.url ? (
                                        <Button
                                            key={index}
                                            variant={
                                                link.active
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            size="sm"
                                            disabled={link.active}
                                            asChild={!link.active}
                                        >
                                            <Link href={link.url}>
                                                {link.label
                                                    .replace(
                                                        '&laquo; Précédent',
                                                        'Précédent',
                                                    )
                                                    .replace(
                                                        'Suivant &raquo;',
                                                        'Suivant',
                                                    )}
                                            </Link>
                                        </Button>
                                    ) : (
                                        <span
                                            key={index}
                                            className="text-muted-foreground px-2 py-1 text-xs"
                                        >
                                            {link.label}
                                        </span>
                                    ),
                                )}
                            </nav>
                        ) : null}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ShopsIndex.layout = {
    breadcrumbs: [
        { title: 'Tableau de bord', href: adminDashboard() },
        { title: 'Boutiques', href: shopsIndex() },
    ],
};
