import { Head, Link, router } from '@inertiajs/react';
import { CreditCard, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatFcfa } from '@/lib/format';
import { index as paymentsIndex } from '@/routes/admin/payments';
import { dashboard as adminDashboard } from '@/routes/admin';
import type { AdminPaymentRow, PaginatedData } from '@/types';

const formatDate = (date: string | null) =>
    date
        ? new Intl.DateTimeFormat('fr-FR', {
              dateStyle: 'medium',
              timeStyle: 'short',
          }).format(new Date(date))
        : '—';

export default function PaymentsIndex({
    payments,
    filters,
}: {
    payments: PaginatedData<AdminPaymentRow>;
    filters: { search: string };
}) {
    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const value = form.get('search');
        router.get(
            paymentsIndex.url({
                query: {
                    search:
                        typeof value === 'string' && value !== ''
                            ? value
                            : undefined,
                },
            }),
            {},
            { preserveState: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Paiements Wave" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <div>
                    <h1 className="flex items-center gap-2 text-xl font-semibold">
                        <CreditCard className="size-5" />
                        Paiements Wave
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Paiements clients enregistrés manuellement après
                        livraison.
                    </p>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={submit} className="flex max-w-xl gap-2">
                            <div className="relative flex-1">
                                <Search className="text-muted-foreground absolute top-2.5 left-3 size-4" />
                                <Input
                                    name="search"
                                    defaultValue={filters.search}
                                    placeholder="Référence ou transaction Wave"
                                    className="pl-9"
                                />
                            </div>
                            <Button type="submit">Rechercher</Button>
                        </form>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        {payments.data.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center text-sm">
                                Aucun paiement enregistré.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] text-sm">
                                    <thead className="text-muted-foreground border-b text-left">
                                        <tr>
                                            <th className="px-3 py-3 font-medium">
                                                Commande
                                            </th>
                                            <th className="px-3 py-3 font-medium">
                                                Boutique
                                            </th>
                                            <th className="px-3 py-3 font-medium">
                                                Montant
                                            </th>
                                            <th className="px-3 py-3 font-medium">
                                                Transaction
                                            </th>
                                            <th className="px-3 py-3 font-medium">
                                                Enregistré le
                                            </th>
                                            <th className="px-3 py-3 font-medium">
                                                Statut
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.data.map((payment) => (
                                            <tr
                                                key={payment.id}
                                                className="border-b last:border-0"
                                            >
                                                <td className="px-3 py-3 font-mono font-medium">
                                                    {payment.order.reference}
                                                </td>
                                                <td className="px-3 py-3">
                                                    {payment.order.shop_name ??
                                                        '—'}
                                                </td>
                                                <td className="px-3 py-3 font-semibold">
                                                    {formatFcfa(payment.amount)}
                                                </td>
                                                <td className="px-3 py-3">
                                                    {
                                                        payment.transaction_reference
                                                    }
                                                </td>
                                                <td className="px-3 py-3">
                                                    {formatDate(
                                                        payment.paid_at,
                                                    )}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <Badge variant="secondary">
                                                        Payé · Wave
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
                {payments.last_page > 1 ? (
                    <div className="flex flex-wrap gap-2">
                        {payments.links.map((link) => (
                            <Button
                                key={link.label}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                asChild
                                disabled={!link.url}
                            >
                                <Link href={link.url ?? '#'} preserveScroll>
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                </Link>
                            </Button>
                        ))}
                    </div>
                ) : null}
            </div>
        </>
    );
}

PaymentsIndex.layout = {
    breadcrumbs: [
        { title: 'Tableau de bord', href: adminDashboard() },
        { title: 'Paiements', href: paymentsIndex() },
    ],
};
