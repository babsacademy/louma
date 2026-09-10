<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SellerPayout;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SellerPayoutController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search'));

        $payouts = SellerPayout::query()
            ->with([
                'order:id,reference,shop_id',
                'order.shop:id,name',
                'seller:id,name',
                'recorder:id,name',
            ])
            ->when($search !== '', function ($query) use ($search): void {
                $like = '%'.$search.'%';
                $query->where(function ($nestedQuery) use ($like): void {
                    $nestedQuery->where('transaction_reference', 'like', $like)
                        ->orWhereHas('order', fn ($orderQuery) => $orderQuery->where('reference', 'like', $like))
                        ->orWhereHas('seller', fn ($sellerQuery) => $sellerQuery->where('name', 'like', $like));
                });
            })
            ->orderByDesc('paid_at')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (SellerPayout $payout): array => [
                'id' => $payout->id,
                'amount' => $payout->amount,
                'method' => $payout->method->value,
                'status' => $payout->status->value,
                'transaction_reference' => $payout->transaction_reference,
                'paid_at' => $payout->paid_at->toIso8601String(),
                'order' => [
                    'reference' => $payout->order->reference,
                    'shop_name' => $payout->order->shop->name,
                ],
                'seller' => $payout->seller->name,
                'recorded_by' => $payout->recorder?->name,
            ]);

        return Inertia::render('admin/payouts/index', [
            'payouts' => $payouts,
            'filters' => ['search' => $search],
        ]);
    }
}
