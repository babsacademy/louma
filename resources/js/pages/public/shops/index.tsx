import { Link, router } from '@inertiajs/react';
import { MapPin, Search, Store, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';

import PublicShopCard from '@/components/public/shop-card';
import PublicSeo from '@/components/public/public-seo';
import ShopZoneMap from '@/components/public/shop-zone-map';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { PublicShopFilters, PublicShopPageProps } from '@/types';
import { home } from '@/routes';
import { index as shopsIndex } from '@/routes/public/shops';

export default function PublicShopsIndex({
    shops,
    zones,
    mapShops,
    filters,
}: PublicShopPageProps) {
    const [search, setSearch] = useState(filters.search);
    const [zone, setZone] = useState(filters.zone || 'all');
    const visit = (next: Partial<PublicShopFilters> = {}) => {
        router.get(
            shopsIndex.url({
                query: {
                    search: (next.search ?? search) || undefined,
                    zone: next.zone ?? (zone === 'all' ? undefined : zone),
                },
            }),
            {},
            { preserveState: true, replace: true },
        );
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== filters.search) visit({ search });
        }, 350);

        return () => clearTimeout(timer);
    }, [search]);

    return (
        <>
            <PublicSeo
                title="Poulets disponibles à Dakar"
                description="Trouvez une boutique de poulet à Dakar, consultez le stock, le poids et le prix, puis commandez simplement."
                noIndex={Boolean(
                    filters.search || filters.zone || shops.current_page > 1,
                )}
                schema={{
                    '@context': 'https://schema.org',
                    '@type': 'WebSite',
                    name: 'Louma Guinard',
                    inLanguage: 'fr-SN',
                }}
            />
            <section className="border-b border-amber-600 bg-amber-500">
                <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20">
                    <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
                        <div>
                            <p className="mb-4 text-sm font-semibold tracking-[0.16em] text-white uppercase">
                                Marketplace locale · Dakar
                            </p>
                            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl lg:text-6xl lg:leading-[1.04]">
                                Des poulets disponibles près de chez vous
                            </h1>
                            <p className="mt-5 max-w-2xl text-base leading-7 text-amber-950/85 sm:text-lg sm:leading-8">
                                Trouvez une boutique à Dakar, consultez le
                                stock, le poids et le prix, puis passez votre
                                commande simplement.
                            </p>
                        </div>
                        <div className="grid gap-3 rounded-2xl border border-amber-700/20 bg-white p-5 shadow-sm sm:grid-cols-3 lg:grid-cols-1">
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                                    <Store
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                </span>
                                <div>
                                    <p className="font-semibold text-stone-900">
                                        Boutiques locales
                                    </p>
                                    <p className="mt-0.5 text-sm leading-5 text-stone-600">
                                        Une offre proche de vous.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                                    <MapPin
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                </span>
                                <div>
                                    <p className="font-semibold text-stone-900">
                                        Informations claires
                                    </p>
                                    <p className="mt-0.5 text-sm leading-5 text-stone-600">
                                        Stock, poids et prix visibles.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                                    <Truck
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                </span>
                                <div>
                                    <p className="font-semibold text-stone-900">
                                        Commande simple
                                    </p>
                                    <p className="mt-0.5 text-sm leading-5 text-stone-600">
                                        Réservez en quelques instants.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-10 grid gap-3 rounded-2xl border border-amber-200 bg-white p-3 shadow-md sm:grid-cols-[minmax(0,1fr)_15rem] sm:p-4">
                        <div className="relative">
                            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-stone-600" />
                            <Label htmlFor="search" className="sr-only">
                                Rechercher une boutique ou une zone
                            </Label>
                            <Input
                                id="search"
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Rechercher une boutique ou une zone"
                                className="h-12 border-stone-300 bg-white pl-11 text-base placeholder:text-stone-500"
                            />
                        </div>
                        <Select
                            value={zone}
                            onValueChange={(value) => {
                                setZone(value);
                                visit({ zone: value === 'all' ? '' : value });
                            }}
                        >
                            <SelectTrigger className="h-12 w-full border-stone-300 bg-white text-base">
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
                    </div>
                </div>
            </section>
            <ShopZoneMap shops={mapShops} />
            <section
                id="boutiques"
                className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
            >
                <div className="mb-6 flex items-end justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold tracking-[0.14em] text-amber-800 uppercase">
                            Choisissez votre boutique
                        </p>
                        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
                            Boutiques disponibles
                        </h2>
                        <p className="mt-2 text-base text-stone-700">
                            {shops.total} boutique{shops.total > 1 ? 's' : ''}{' '}
                            trouvée{shops.total > 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                {shops.data.length ? (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {shops.data.map((shop) => (
                            <PublicShopCard key={shop.id} shop={shop} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
                        <Store className="mb-3 size-10 text-stone-500" />
                        <h2 className="text-lg font-semibold text-stone-900">
                            Aucune boutique ne correspond à votre recherche
                        </h2>
                        <p className="mt-2 text-sm text-stone-600">
                            Essayez une autre zone ou un autre terme.
                        </p>
                        <Button variant="outline" className="mt-5" asChild>
                            <Link href={home.url()}>
                                Réinitialiser les filtres
                            </Link>
                        </Button>
                    </div>
                )}
                {shops.last_page > 1 ? (
                    <nav
                        className="mt-8 flex flex-wrap justify-center gap-2"
                        aria-label="Pagination"
                    >
                        {shops.links.map((link, index) =>
                            link.url ? (
                                <Button
                                    key={index}
                                    variant={
                                        link.active ? 'default' : 'outline'
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
                                    className="text-muted-foreground px-2 py-1 text-sm"
                                >
                                    {link.label}
                                </span>
                            ),
                        )}
                    </nav>
                ) : null}
            </section>
        </>
    );
}
