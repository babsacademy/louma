import { Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    CircleAlert,
    MapPin,
    Minus,
    Package,
    Plus,
    Scale,
} from 'lucide-react';

import InputError from '@/components/input-error';
import ShopAvailabilityBadge from '@/components/public/shop-availability-badge';
import ShopImage from '@/components/public/shop-image';
import PublicSeo from '@/components/public/public-seo';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { formatFcfa } from '@/lib/format';
import { store as ordersStore } from '@/routes/public/orders';
import { index as shopsIndex } from '@/routes/public/shops';
import type { PublicShop } from '@/types';

export default function PublicShopShow({ shop }: { shop: PublicShop }) {
    const available = shop.stock_quantity > 0;
    const form = useForm({
        customer_name: '',
        customer_phone: '',
        delivery_address: '',
        quantity: available ? 1 : 0,
        request_token: crypto.randomUUID(),
    });
    const updateQuantity = (value: number) =>
        form.setData(
            'quantity',
            Math.max(available ? 1 : 0, Math.min(shop.stock_quantity, value)),
        );
    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post(ordersStore.url(shop.slug));
    };

    return (
        <>
            <PublicSeo
                title={`${shop.name} · Poulets à ${shop.zone}`}
                description={`Stock, poids et prix des poulets de ${shop.name} à ${shop.zone}, Dakar.`}
                image={shop.image_url}
                schema={{
                    '@context': 'https://schema.org',
                    '@type': 'Store',
                    name: shop.name,
                    image: shop.image_url,
                    address: {
                        '@type': 'PostalAddress',
                        addressLocality: shop.zone,
                        addressRegion: 'Dakar',
                        addressCountry: 'SN',
                    },
                    areaServed: 'Dakar',
                    offers: {
                        '@type': 'Offer',
                        price: shop.unit_price,
                        priceCurrency: 'XOF',
                        availability:
                            shop.stock_quantity > 0
                                ? 'https://schema.org/InStock'
                                : 'https://schema.org/OutOfStock',
                    },
                }}
            />
            <div className="mx-auto w-full max-w-7xl bg-white px-4 py-7 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
                <Link
                    href={shopsIndex.url()}
                    className="mb-7 inline-flex items-center gap-1.5 text-sm font-medium text-stone-700 transition-colors hover:text-amber-800"
                >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Toutes les boutiques
                </Link>
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)] lg:gap-10 xl:gap-12">
                    <section>
                        <ShopImage
                            src={shop.image_url}
                            alt={shop.name}
                            className="rounded-2xl border border-stone-200 shadow-sm"
                        />
                        <div className="mt-7">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold tracking-[0.14em] text-amber-800 uppercase">
                                        Boutique à Dakar
                                    </p>
                                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
                                        {shop.name}
                                    </h1>
                                </div>
                                <ShopAvailabilityBadge available={available} />
                            </div>
                            <p className="mt-4 flex items-center gap-2 text-base text-stone-700">
                                <MapPin
                                    className="size-4 text-amber-800"
                                    aria-hidden="true"
                                />
                                {shop.zone}
                            </p>
                            <p className="mt-6 max-w-3xl leading-7 whitespace-pre-wrap text-stone-700">
                                {shop.description ||
                                    'Cette boutique propose des poulets disponibles à Dakar.'}
                            </p>
                        </div>
                        <div className="mt-8 grid gap-3 sm:grid-cols-3">
                            <Card className="gap-2 border-stone-200 py-4 shadow-none">
                                <CardContent className="px-4">
                                    <p className="flex items-center gap-2 text-sm text-stone-600">
                                        <Scale
                                            className="size-4 text-amber-800"
                                            aria-hidden="true"
                                        />
                                        Poids moyen
                                    </p>
                                    <p className="mt-2 text-lg font-semibold text-stone-950">
                                        {shop.formatted_weight}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="gap-2 border-stone-200 py-4 shadow-none">
                                <CardContent className="px-4">
                                    <p className="flex items-center gap-2 text-sm text-stone-600">
                                        <Package
                                            className="size-4 text-amber-800"
                                            aria-hidden="true"
                                        />
                                        Stock disponible
                                    </p>
                                    <p className="mt-2 text-lg font-semibold text-stone-950">
                                        {shop.stock_quantity} poulet
                                        {shop.stock_quantity > 1 ? 's' : ''}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="gap-2 border-amber-200 bg-amber-50 py-4 shadow-none">
                                <CardContent className="px-4">
                                    <p className="text-sm text-amber-900">
                                        Prix unitaire
                                    </p>
                                    <p className="mt-2 text-xl font-semibold tracking-tight text-amber-900">
                                        {formatFcfa(shop.unit_price)}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>
                    <aside className="lg:pt-1">
                        <Card className="border-amber-200 bg-white shadow-md lg:sticky lg:top-24">
                            <CardHeader className="gap-2">
                                <p className="text-sm font-semibold tracking-[0.14em] text-amber-800 uppercase">
                                    Votre commande
                                </p>
                                <CardTitle className="text-2xl text-stone-950">
                                    Réservez simplement
                                </CardTitle>
                                <p className="text-sm leading-6 text-stone-600">
                                    Renseignez vos coordonnées, puis choisissez
                                    la quantité souhaitée.
                                </p>
                            </CardHeader>
                            <CardContent>
                                {!available ? (
                                    <Alert className="border-stone-300 bg-stone-50 text-stone-800">
                                        <CircleAlert aria-hidden="true" />
                                        <AlertTitle>Stock épuisé</AlertTitle>
                                        <AlertDescription>
                                            Cette boutique ne peut pas accepter
                                            de nouvelle commande pour le moment.
                                        </AlertDescription>
                                    </Alert>
                                ) : null}
                                <form
                                    onSubmit={submit}
                                    className="mt-5 space-y-5"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="customer_name">
                                            Nom complet
                                        </Label>
                                        <Input
                                            id="customer_name"
                                            value={form.data.customer_name}
                                            disabled={
                                                !available || form.processing
                                            }
                                            onChange={(event) =>
                                                form.setData(
                                                    'customer_name',
                                                    event.target.value,
                                                )
                                            }
                                            autoComplete="name"
                                            className="h-11 border-stone-300 bg-white"
                                        />
                                        <InputError
                                            message={form.errors.customer_name}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="customer_phone">
                                            Téléphone
                                        </Label>
                                        <Input
                                            id="customer_phone"
                                            type="tel"
                                            placeholder="77 123 45 67"
                                            value={form.data.customer_phone}
                                            disabled={
                                                !available || form.processing
                                            }
                                            onChange={(event) =>
                                                form.setData(
                                                    'customer_phone',
                                                    event.target.value,
                                                )
                                            }
                                            autoComplete="tel"
                                            className="h-11 border-stone-300 bg-white placeholder:text-stone-500"
                                        />
                                        <InputError
                                            message={form.errors.customer_phone}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="delivery_address">
                                            Adresse de livraison
                                        </Label>
                                        <Textarea
                                            id="delivery_address"
                                            value={form.data.delivery_address}
                                            disabled={
                                                !available || form.processing
                                            }
                                            onChange={(event) =>
                                                form.setData(
                                                    'delivery_address',
                                                    event.target.value,
                                                )
                                            }
                                            autoComplete="street-address"
                                            className="min-h-24 border-stone-300 bg-white"
                                        />
                                        <InputError
                                            message={
                                                form.errors.delivery_address
                                            }
                                        />
                                    </div>
                                    <Separator className="bg-stone-200" />
                                    <div>
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <Label htmlFor="quantity">
                                                Quantité
                                            </Label>
                                            <span className="text-sm text-stone-600">
                                                {shop.stock_quantity} disponible
                                                {shop.stock_quantity > 1
                                                    ? 's'
                                                    : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="size-11 border-stone-300"
                                                disabled={
                                                    !available ||
                                                    form.processing ||
                                                    form.data.quantity <= 1
                                                }
                                                onClick={() =>
                                                    updateQuantity(
                                                        form.data.quantity - 1,
                                                    )
                                                }
                                            >
                                                <Minus className="size-4" />
                                                <span className="sr-only">
                                                    Diminuer
                                                </span>
                                            </Button>
                                            <Input
                                                id="quantity"
                                                type="number"
                                                min={available ? 1 : 0}
                                                max={shop.stock_quantity}
                                                value={form.data.quantity}
                                                disabled={
                                                    !available ||
                                                    form.processing
                                                }
                                                onChange={(event) =>
                                                    updateQuantity(
                                                        Number(
                                                            event.target.value,
                                                        ) || 0,
                                                    )
                                                }
                                                className="h-11 max-w-20 text-center text-lg font-semibold"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="size-11 border-stone-300"
                                                disabled={
                                                    !available ||
                                                    form.processing ||
                                                    form.data.quantity >=
                                                        shop.stock_quantity
                                                }
                                                onClick={() =>
                                                    updateQuantity(
                                                        form.data.quantity + 1,
                                                    )
                                                }
                                            >
                                                <Plus className="size-4" />
                                                <span className="sr-only">
                                                    Augmenter
                                                </span>
                                            </Button>
                                        </div>
                                        <InputError
                                            message={form.errors.quantity}
                                        />
                                    </div>
                                    <div className="rounded-xl bg-amber-50 p-4">
                                        <div className="flex justify-between gap-4 text-sm text-amber-950">
                                            <span>
                                                {formatFcfa(shop.unit_price)} ×{' '}
                                                {form.data.quantity}
                                            </span>
                                            <span>Total estimé</span>
                                        </div>
                                        <p className="mt-2 text-right text-2xl font-semibold tracking-tight text-amber-950">
                                            {formatFcfa(
                                                shop.unit_price *
                                                    form.data.quantity,
                                            )}
                                        </p>
                                    </div>
                                    <InputError
                                        message={form.errors.request_token}
                                    />
                                    <Button
                                        type="submit"
                                        disabled={!available || form.processing}
                                        className="h-11 w-full bg-amber-500 text-base text-stone-950 hover:bg-amber-400 disabled:bg-amber-200 disabled:text-stone-600"
                                    >
                                        {form.processing
                                            ? 'Réservation en cours…'
                                            : available
                                              ? 'Commander'
                                              : 'Stock épuisé'}
                                    </Button>
                                    <p className="text-center text-xs leading-5 text-stone-600">
                                        Le prix et le stock sont vérifiés à
                                        nouveau au moment de la réservation.
                                    </p>
                                </form>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </>
    );
}
