import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    CreditCard,
    MapPin,
    Package,
    Store,
    Wallet,
    X,
} from 'lucide-react';

import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { formatFcfa } from '@/lib/format';
import { orderStatus, type OrderStatus } from '@/lib/order-status';
import { dashboard as adminDashboard } from '@/routes/admin';
import {
    cancel as cancelOrder,
    confirm as confirmOrder,
    index as ordersIndex,
    markDelivered,
    markPickedUp,
    payment as recordPayment,
    payout as recordPayout,
    startDelivery,
    startPreparing,
} from '@/routes/admin/orders';
import type { AdminOrder } from '@/types';

const formatDate = (date: string | null) =>
    date
        ? new Intl.DateTimeFormat('fr-FR', {
              dateStyle: 'medium',
              timeStyle: 'short',
          }).format(new Date(date))
        : '—';

export default function OrdersShow({ order }: { order: AdminOrder }) {
    const cancellation = useForm({ cancellation_reason: '' });
    const paymentForm = useForm({ transaction_reference: '' });
    const payoutForm = useForm({ transaction_reference: '' });
    const paymentErrors = paymentForm.errors as Record<
        string,
        string | undefined
    >;
    const payoutErrors = payoutForm.errors as Record<
        string,
        string | undefined
    >;
    const pending = order.status === 'pending';
    const cancellable =
        pending || order.status === 'confirmed' || order.status === 'preparing';
    const currentStatus = orderStatus[order.status as OrderStatus];
    const progressAction = {
        confirmed: { label: 'Démarrer la préparation', route: startPreparing },
        preparing: { label: 'Marquer comme récupérée', route: markPickedUp },
        picked_up: { label: 'Mettre en livraison', route: startDelivery },
        delivering: { label: 'Marquer comme livrée', route: markDelivered },
    }[order.status as 'confirmed' | 'preparing' | 'picked_up' | 'delivering'];
    const steps: Array<{
        status: OrderStatus;
        label: string;
        date: string | null;
    }> = [
        { status: 'pending', label: 'En attente', date: order.created_at },
        { status: 'confirmed', label: 'Confirmée', date: order.confirmed_at },
        { status: 'preparing', label: 'Préparation', date: order.preparing_at },
        {
            status: 'picked_up',
            label: 'Récupérée chez le vendeur',
            date: order.picked_up_at,
        },
        {
            status: 'delivering',
            label: 'En livraison',
            date: order.delivering_at,
        },
        { status: 'delivered', label: 'Livrée', date: order.delivered_at },
    ];
    return (
        <>
            <Head title={order.reference} />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Link
                            href={ordersIndex.url()}
                            className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-xs"
                        >
                            <ArrowLeft className="size-3.5" />
                            Retour aux commandes
                        </Link>
                        <h1 className="font-mono text-xl font-semibold">
                            {order.reference}
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Créée le {formatDate(order.created_at)}
                        </p>
                    </div>
                    <Badge variant={currentStatus?.variant ?? 'secondary'}>
                        {currentStatus?.label ?? order.status_label}
                    </Badge>
                </div>
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="space-y-5">
                        <Card>
                            <CardHeader>
                                <CardTitle>Suivi de commande</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {steps.map((step, index) => {
                                    const reached = step.date !== null;
                                    const current =
                                        step.status === order.status;
                                    return (
                                        <div
                                            key={step.status}
                                            className="flex gap-3"
                                        >
                                            <div className="flex flex-col items-center">
                                                <span
                                                    className={
                                                        current
                                                            ? 'bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-xs font-semibold'
                                                            : reached
                                                              ? 'bg-muted-foreground/30 flex size-6 items-center justify-center rounded-full text-xs font-semibold'
                                                              : 'border-muted-foreground/30 flex size-6 items-center justify-center rounded-full border text-xs'
                                                    }
                                                >
                                                    {index + 1}
                                                </span>
                                                {index < steps.length - 1 ? (
                                                    <Separator
                                                        orientation="vertical"
                                                        className="my-1 min-h-4"
                                                    />
                                                ) : null}
                                            </div>
                                            <div className="pb-2">
                                                <p
                                                    className={
                                                        current
                                                            ? 'font-semibold'
                                                            : 'font-medium'
                                                    }
                                                >
                                                    {step.label}
                                                </p>
                                                <p className="text-muted-foreground text-sm">
                                                    {reached
                                                        ? formatDate(step.date)
                                                        : 'À venir'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Client et livraison</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-5 sm:grid-cols-2">
                                <div>
                                    <p className="text-muted-foreground text-sm">
                                        Client
                                    </p>
                                    <p className="mt-1 font-medium">
                                        {order.customer_name}
                                    </p>
                                    <a
                                        className="text-primary underline-offset-4 hover:underline"
                                        href={`tel:${order.customer_phone}`}
                                    >
                                        {order.customer_phone}
                                    </a>
                                </div>
                                <div>
                                    <p className="text-muted-foreground flex items-center gap-1 text-sm">
                                        <MapPin className="size-4" />
                                        Adresse
                                    </p>
                                    <p className="mt-1 whitespace-pre-wrap">
                                        {order.delivery_address}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Détail financier figé</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <p className="text-muted-foreground text-sm">
                                        Quantité
                                    </p>
                                    <p className="mt-1 font-semibold">
                                        {order.quantity}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm">
                                        Prix unitaire
                                    </p>
                                    <p className="mt-1 font-semibold">
                                        {formatFcfa(order.unit_price)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm">
                                        Commission
                                    </p>
                                    <p className="mt-1 font-semibold">
                                        {formatFcfa(order.platform_commission)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm">
                                        Montant vendeur
                                    </p>
                                    <p className="mt-1 font-semibold">
                                        {formatFcfa(order.seller_amount)}
                                    </p>
                                </div>
                                <div className="border-t pt-4 sm:col-span-2 lg:col-span-4">
                                    <p className="text-muted-foreground text-sm">
                                        Total client
                                    </p>
                                    <p className="mt-1 text-2xl font-semibold">
                                        {formatFcfa(order.subtotal)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Historique</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {order.history.map((item) => (
                                    <div
                                        key={item.id}
                                        className="border-l-2 pl-4"
                                    >
                                        <p className="font-medium">
                                            {item.from_status
                                                ? (orderStatus[
                                                      item.from_status as OrderStatus
                                                  ]?.label ?? item.from_status)
                                                : 'Création'}{' '}
                                            →{' '}
                                            {orderStatus[
                                                item.to_status as OrderStatus
                                            ]?.label ?? item.to_status}
                                        </p>
                                        <p className="text-muted-foreground text-sm">
                                            {formatDate(item.created_at)} ·{' '}
                                            {item.changed_by ?? 'Système'}
                                        </p>
                                        {item.reason ? (
                                            <p className="mt-1 text-sm">
                                                {item.reason}
                                            </p>
                                        ) : null}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                    <aside className="space-y-5">
                        <Card>
                            <CardHeader>
                                <CardTitle>Réservation</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <p className="flex gap-2">
                                    <Store className="text-muted-foreground mt-0.5 size-4" />
                                    <span>
                                        <strong>{order.shop.name}</strong>
                                        <br />
                                        {order.shop.zone} ·{' '}
                                        {order.shop.seller_name ?? '—'}
                                        {order.shop.seller_phone ? (
                                            <>
                                                <br />
                                                <a
                                                    className="text-primary underline-offset-4 hover:underline"
                                                    href={`tel:${order.shop.seller_phone}`}
                                                >
                                                    Appeler le vendeur
                                                </a>
                                            </>
                                        ) : null}
                                    </span>
                                </p>
                                <p className="flex gap-2">
                                    <Package className="text-muted-foreground mt-0.5 size-4" />
                                    <span>
                                        Poids figé :{' '}
                                        {new Intl.NumberFormat('fr-FR', {
                                            maximumFractionDigits: 3,
                                        }).format(
                                            order.average_weight_snapshot /
                                                1000,
                                        )}{' '}
                                        kg
                                    </span>
                                </p>
                                <p>
                                    <span className="text-muted-foreground">
                                        Réservée :
                                    </span>{' '}
                                    {formatDate(order.stock_reserved_at)}
                                </p>
                                <p>
                                    <span className="text-muted-foreground">
                                        Expiration enregistrée :
                                    </span>{' '}
                                    {formatDate(order.reservation_expires_at)}
                                </p>
                                {order.stock_released_at ? (
                                    <p>
                                        <span className="text-muted-foreground">
                                            Stock rendu :
                                        </span>{' '}
                                        {formatDate(order.stock_released_at)}
                                    </p>
                                ) : null}
                            </CardContent>
                        </Card>
                        {pending ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Confirmer</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-4 text-sm">
                                        Le stock est déjà réservé : cette action
                                        ne le décrémente pas une seconde fois.
                                    </p>
                                    <Button
                                        className="w-full"
                                        onClick={() =>
                                            router.post(
                                                confirmOrder.url(order.id),
                                            )
                                        }
                                    >
                                        <Check className="size-4" />
                                        Confirmer la commande
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : null}
                        {progressAction ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Étape suivante</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Button
                                        className="w-full"
                                        onClick={() =>
                                            router.post(
                                                progressAction.route.url(
                                                    order.id,
                                                ),
                                            )
                                        }
                                    >
                                        <Check className="size-4" />
                                        {progressAction.label}
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : null}
                        {cancellable ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Annuler</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form
                                        onSubmit={(event) => {
                                            event.preventDefault();
                                            cancellation.post(
                                                cancelOrder.url(order.id),
                                            );
                                        }}
                                        className="space-y-3"
                                    >
                                        <Label htmlFor="cancellation_reason">
                                            Motif{' '}
                                            {pending
                                                ? '(facultatif)'
                                                : '(obligatoire)'}
                                        </Label>
                                        <Textarea
                                            id="cancellation_reason"
                                            value={
                                                cancellation.data
                                                    .cancellation_reason
                                            }
                                            onChange={(event) =>
                                                cancellation.setData(
                                                    'cancellation_reason',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                cancellation.errors
                                                    .cancellation_reason
                                            }
                                        />
                                        <Button
                                            type="submit"
                                            variant="destructive"
                                            disabled={cancellation.processing}
                                            className="w-full"
                                        >
                                            <X className="size-4" />
                                            Annuler et restituer le stock
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        ) : null}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="size-4" />
                                    Paiement client
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {order.payment ? (
                                    <>
                                        <p className="font-semibold">
                                            {formatFcfa(order.payment.amount)} ·
                                            Wave
                                        </p>
                                        <p className="text-muted-foreground text-sm">
                                            Transaction :{' '}
                                            {
                                                order.payment
                                                    .transaction_reference
                                            }
                                        </p>
                                        <p className="text-muted-foreground text-sm">
                                            Enregistré le{' '}
                                            {formatDate(order.payment.paid_at)}
                                        </p>
                                    </>
                                ) : (
                                    <form
                                        className="space-y-3"
                                        onSubmit={(event) => {
                                            event.preventDefault();
                                            paymentForm.post(
                                                recordPayment.url(order.id),
                                            );
                                        }}
                                    >
                                        <p className="text-muted-foreground text-sm">
                                            À enregistrer après livraison.
                                            Montant attendu :{' '}
                                            <strong>
                                                {formatFcfa(order.subtotal)}
                                            </strong>
                                            .
                                        </p>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="payment_transaction_reference">
                                                Référence Wave
                                            </Label>
                                            <Input
                                                id="payment_transaction_reference"
                                                value={
                                                    paymentForm.data
                                                        .transaction_reference
                                                }
                                                onChange={(event) =>
                                                    paymentForm.setData(
                                                        'transaction_reference',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Ex. TX-123456"
                                            />
                                            <InputError
                                                message={
                                                    paymentErrors.transaction_reference ??
                                                    paymentErrors.payment ??
                                                    paymentErrors.order
                                                }
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={
                                                paymentForm.processing ||
                                                order.status !== 'delivered'
                                            }
                                        >
                                            Enregistrer le paiement
                                        </Button>
                                        {order.status !== 'delivered' ? (
                                            <p className="text-muted-foreground text-xs">
                                                Disponible lorsque la commande
                                                est livrée.
                                            </p>
                                        ) : null}
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Wallet className="size-4" />
                                    Reversement vendeur
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {order.seller_payout ? (
                                    <>
                                        <p className="font-semibold">
                                            {formatFcfa(
                                                order.seller_payout.amount ??
                                                    order.seller_amount,
                                            )}{' '}
                                            · Wave
                                        </p>
                                        <p className="text-muted-foreground text-sm">
                                            Transaction :{' '}
                                            {
                                                order.seller_payout
                                                    .transaction_reference
                                            }
                                        </p>
                                        <p className="text-muted-foreground text-sm">
                                            Enregistré le{' '}
                                            {formatDate(
                                                order.seller_payout.paid_at,
                                            )}
                                        </p>
                                    </>
                                ) : (
                                    <form
                                        className="space-y-3"
                                        onSubmit={(event) => {
                                            event.preventDefault();
                                            payoutForm.post(
                                                recordPayout.url(order.id),
                                            );
                                        }}
                                    >
                                        <p className="text-muted-foreground text-sm">
                                            {order.payment ? (
                                                <>
                                                    Montant vendeur :{' '}
                                                    <strong>
                                                        {formatFcfa(
                                                            order.seller_amount,
                                                        )}
                                                    </strong>
                                                    .
                                                </>
                                            ) : (
                                                'Le paiement client doit être enregistré avant le reversement.'
                                            )}
                                        </p>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="payout_transaction_reference">
                                                Référence Wave
                                            </Label>
                                            <Input
                                                id="payout_transaction_reference"
                                                value={
                                                    payoutForm.data
                                                        .transaction_reference
                                                }
                                                onChange={(event) =>
                                                    payoutForm.setData(
                                                        'transaction_reference',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Ex. TX-789012"
                                            />
                                            <InputError
                                                message={
                                                    payoutErrors.transaction_reference ??
                                                    payoutErrors.payout ??
                                                    payoutErrors.order
                                                }
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={
                                                payoutForm.processing ||
                                                !order.payment ||
                                                order.status !== 'delivered'
                                            }
                                        >
                                            Enregistrer le reversement
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </>
    );
}

OrdersShow.layout = {
    breadcrumbs: [
        { title: 'Tableau de bord', href: adminDashboard() },
        { title: 'Commandes', href: ordersIndex() },
        { title: 'Détail', href: ordersIndex() },
    ],
};
