<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search'));

        $payments = Payment::query()
            ->with([
                'order:id,reference,customer_name,shop_id',
                'order.shop:id,name',
                'recorder:id,name',
            ])
            ->when($search !== '', function ($query) use ($search): void {
                $like = '%'.$search.'%';
                $query->where(function ($nestedQuery) use ($like): void {
                    $nestedQuery->where('transaction_reference', 'like', $like)
                        ->orWhereHas('order', function ($orderQuery) use ($like): void {
                            $orderQuery->where('reference', 'like', $like)
                                ->orWhere('customer_name', 'like', $like);
                        });
                });
            })
            ->orderByDesc('paid_at')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Payment $payment): array => [
                'id' => $payment->id,
                'amount' => $payment->amount,
                'method' => $payment->method->value,
                'status' => $payment->status->value,
                'transaction_reference' => $payment->transaction_reference,
                'paid_at' => $payment->paid_at->toIso8601String(),
                'order' => [
                    'reference' => $payment->order->reference,
                    'customer_name' => $payment->order->customer_name,
                    'shop_name' => $payment->order->shop->name,
                ],
                'recorded_by' => $payment->recorder?->name,
            ]);

        return Inertia::render('admin/payments/index', [
            'payments' => $payments,
            'filters' => ['search' => $search],
        ]);
    }
}
