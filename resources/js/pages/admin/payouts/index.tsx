import { Head, Link, router } from '@inertiajs/react';
import { Search, Wallet } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatFcfa } from '@/lib/format';
import { dashboard as adminDashboard } from '@/routes/admin';
import { index as payoutsIndex } from '@/routes/admin/payouts';
import type { AdminPayoutRow, PaginatedData } from '@/types';

const formatDate = (date: string | null) =>
    date
        ? new Intl.DateTimeFormat('fr-FR', {
              dateStyle: 'medium',
              timeStyle: 'short',
          }).format(new Date(date))
        : '—';

export default function PayoutsIndex({
    payouts,
    filters,
}: {
    payouts: PaginatedData<AdminPayoutRow>;
    filters: { search: string };
}) {
    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const value = form.get('search');
        router.get(
            payoutsIndex.url({
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
            <Head title="Reversements vendeurs" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <div>
                    <h1 className="flex items-center gap-2 text-xl font-semibold">
                        <Wallet className="size-5" />
                        Reversements vendeurs
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Reversements Wave enregistrés après paiement client.
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
                                    placeholder="Commande, vendeur ou transaction"
                                    className="pl-9"
                                />
                            </div>
                            <Button type="submit">Rechercher</Button>
                        </form>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        {payouts.data.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center text-sm">
                                Aucun reversement enregistré.
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
                                                Vendeur
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
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payouts.data.map((payout) => (
                                            <tr
                                                key={payout.id}
                                                className="border-b last:border-0"
                                            >
                                                <td className="px-3 py-3 font-mono font-medium">
                                                    {payout.order.reference}
                                                </td>
                                                <td className="px-3 py-3">
                                                    {payout.seller ?? '—'}
                                                </td>
                                                <td className="px-3 py-3">
                                                    {payout.order.shop_name ??
                                                        '—'}
                                                </td>
                                                <td className="px-3 py-3 font-semibold">
                                                    {formatFcfa(payout.amount)}
                                                </td>
                                                <td className="px-3 py-3">
                                                    {
                                                        payout.transaction_reference
                                                    }
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div>
                                                        {formatDate(
                                                            payout.paid_at,
                                                        )}
                                                    </div>
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
                {payouts.last_page > 1 ? (
                    <div className="flex flex-wrap gap-2">
                        {payouts.links.map((link) => (
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

PayoutsIndex.layout = {
    breadcrumbs: [
        { title: 'Tableau de bord', href: adminDashboard() },
        { title: 'Reversements', href: payoutsIndex() },
    ],
};
