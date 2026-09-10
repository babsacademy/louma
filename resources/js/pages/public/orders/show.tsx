import { Head, Link } from '@inertiajs/react';
import {
    CheckCircle2,
    CircleAlert,
    MapPin,
    Package,
    Store,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatFcfa } from '@/lib/format';
import { index as shopsIndex } from '@/routes/public/shops';
import type { PublicOrderConfirmation } from '@/types';

export default function PublicOrderShow({
    order,
}: {
    order: PublicOrderConfirmation;
}) {
    const isExpired =
        order.status === 'cancelled' &&
        order.cancellation_reason === 'Réservation expirée';

    return (
        <>
            <Head title={`Commande ${order.reference}`} />
            <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
                <Card
                    className={
                        isExpired
                            ? 'border-destructive/40 bg-white shadow-sm'
                            : 'border-emerald-200 bg-white shadow-md'
                    }
                >
                    <CardHeader className="items-center pt-8 text-center sm:pt-10">
                        <span
                            className={
                                isExpired
                                    ? 'text-destructive flex size-16 items-center justify-center rounded-full bg-red-50'
                                    : 'flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700'
                            }
                        >
                            {isExpired ? (
                                <CircleAlert
                                    className="size-8"
                                    aria-hidden="true"
                                />
                            ) : (
                                <CheckCircle2
                                    className="size-8"
                                    aria-hidden="true"
                                />
                            )}
                        </span>
                        <p className="mt-5 text-sm font-semibold tracking-[0.14em] text-amber-800 uppercase">
                            {isExpired
                                ? 'Réservation terminée'
                                : 'Merci pour votre commande'}
                        </p>
                        <CardTitle className="mt-2 text-3xl tracking-tight text-stone-950">
                            {isExpired
                                ? 'Commande annulée'
                                : 'Commande enregistrée'}
                        </CardTitle>
                        <p className="mt-2 max-w-md text-sm leading-6 text-stone-600">
                            {isExpired
                                ? 'Votre réservation a expiré et le stock a été libéré.'
                                : 'Votre demande a bien été prise en compte. Conservez cette référence pour votre suivi.'}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-7 px-5 pb-7 sm:px-8 sm:pb-9">
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
                            <p className="text-xs font-semibold tracking-[0.14em] text-amber-900 uppercase">
                                Référence
                            </p>
                            <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-stone-950">
                                {order.reference}
                            </p>
                            <Badge
                                className={
                                    isExpired
                                        ? 'mt-4'
                                        : 'mt-4 border-amber-200 bg-white text-amber-900'
                                }
                                variant={
                                    isExpired ? 'destructive' : 'secondary'
                                }
                            >
                                {isExpired
                                    ? 'Annulée'
                                    : 'En attente de confirmation'}
                            </Badge>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="rounded-xl border border-stone-200 p-4">
                                <p className="flex items-center gap-1.5 text-sm font-medium text-stone-600">
                                    <Store className="size-4" />
                                    Boutique
                                </p>
                                <p className="mt-2 font-semibold text-stone-950">
                                    {order.shop_name}
                                </p>
                                <p className="mt-1 text-sm text-stone-600">
                                    {order.shop_zone}
                                </p>
                            </div>
                            <div className="rounded-xl border border-stone-200 p-4">
                                <p className="flex items-center gap-1.5 text-sm font-medium text-stone-600">
                                    <Package className="size-4" />
                                    Commande
                                </p>
                                <p className="mt-2 font-semibold text-stone-950">
                                    {order.quantity} poulet
                                    {order.quantity > 1 ? 's' : ''}
                                </p>
                                <p className="mt-1 text-sm text-stone-600">
                                    {formatFcfa(order.unit_price)} l’unité
                                </p>
                            </div>
                        </div>
                        <Separator className="bg-stone-200" />
                        <div>
                            <p className="flex items-center gap-1.5 text-sm font-medium text-stone-600">
                                <MapPin className="size-4" />
                                Livraison pour {order.customer_name} ·{' '}
                                {order.customer_phone_masked}
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-stone-900">
                                {order.delivery_address}
                            </p>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-stone-950 px-5 py-4 text-lg text-white">
                            <span>Total à confirmer</span>
                            <strong className="text-xl">
                                {formatFcfa(order.subtotal)}
                            </strong>
                        </div>
                        <Button
                            asChild
                            className="h-11 w-full bg-amber-500 text-base text-stone-950 hover:bg-amber-400"
                        >
                            <Link href={shopsIndex.url()}>
                                Voir les boutiques
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
