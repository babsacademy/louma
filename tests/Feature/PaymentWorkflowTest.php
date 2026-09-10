<?php

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\SellerPayoutStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\SellerPayout;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('an admin records one Wave payment from the delivered order snapshot', function () {
    $admin = User::factory()->admin()->create();
    $order = Order::factory()->delivered()->create(['subtotal' => 8700, 'seller_amount' => 7500]);
    $stock = $order->shop->stock_quantity;

    $this->actingAs($admin)->post(route('admin.orders.payment', $order), [
        'transaction_reference' => ' wave-001 ',
        'amount' => 1,
        'method' => 'cash',
        'status' => 'pending',
    ])->assertRedirect();

    $payment = Payment::sole();
    expect($payment->amount)->toBe(8700)
        ->and($payment->method)->toBe(PaymentMethod::Wave)
        ->and($payment->status)->toBe(PaymentStatus::Paid)
        ->and($payment->transaction_reference)->toBe('wave-001')
        ->and($payment->recorded_by)->toBe($admin->id)
        ->and($payment->paid_at)->not->toBeNull();
    expect($order->shop->refresh()->stock_quantity)->toBe($stock);
});

test('payment requires delivery and cannot be duplicated', function () {
    $admin = User::factory()->admin()->create();
    $pending = Order::factory()->create();

    $this->actingAs($admin)->post(route('admin.orders.payment', $pending), ['transaction_reference' => 'wave-pending'])
        ->assertSessionHasErrors('order');
    expect(Payment::count())->toBe(0);

    $order = Order::factory()->delivered()->create();
    $this->actingAs($admin)->post(route('admin.orders.payment', $order), ['transaction_reference' => 'wave-001']);
    $this->actingAs($admin)->post(route('admin.orders.payment', $order), ['transaction_reference' => 'wave-002'])
        ->assertSessionHasErrors('payment');
    expect(Payment::where('order_id', $order->id)->count())->toBe(1);
});

test('seller and guest cannot record payments', function () {
    $order = Order::factory()->delivered()->create();
    $seller = User::factory()->seller()->create();

    $this->post(route('admin.orders.payment', $order), ['transaction_reference' => 'guest'])->assertRedirect(route('login'));
    $this->actingAs($seller)->post(route('admin.orders.payment', $order), ['transaction_reference' => 'seller'])->assertForbidden();
    $this->actingAs($seller)->post(route('admin.orders.payout', $order), ['transaction_reference' => 'seller-payout'])->assertForbidden();
});

test('an admin records a payout only after client payment using the seller snapshot', function () {
    $admin = User::factory()->admin()->create();
    $seller = User::factory()->seller()->create();
    $shop = Shop::factory()->for($seller, 'seller')->create();
    $order = Order::factory()->for($shop, 'shop')->delivered()->create(['subtotal' => 6500, 'seller_amount' => 5700]);

    $this->actingAs($admin)->post(route('admin.orders.payout', $order), ['transaction_reference' => 'payout-before'])
        ->assertSessionHasErrors('payout');
    expect(SellerPayout::count())->toBe(0);

    $this->actingAs($admin)->post(route('admin.orders.payment', $order), ['transaction_reference' => 'wave-001']);
    $this->actingAs($admin)->post(route('admin.orders.payout', $order), [
        'transaction_reference' => ' payout-001 ',
        'amount' => 1,
        'seller_id' => User::factory()->seller()->create()->id,
        'method' => 'cash',
    ])->assertRedirect();

    $payout = SellerPayout::sole();
    expect($payout->amount)->toBe(5700)
        ->and($payout->seller_id)->toBe($seller->id)
        ->and($payout->method)->toBe(PaymentMethod::Wave)
        ->and($payout->status)->toBe(SellerPayoutStatus::Paid)
        ->and($payout->transaction_reference)->toBe('payout-001')
        ->and($payout->recorded_by)->toBe($admin->id);

    $this->actingAs($admin)->post(route('admin.orders.payout', $order), ['transaction_reference' => 'payout-002'])
        ->assertSessionHasErrors('payout');
    expect(SellerPayout::where('order_id', $order->id)->count())->toBe(1);
});

test('seller sees payout status but no client payment data', function () {
    $seller = User::factory()->seller()->create();
    $shop = Shop::factory()->for($seller, 'seller')->create();
    Order::factory()->for($shop, 'shop')->delivered()->create();

    $this->actingAs($seller)->get(route('seller.orders.index'))
        ->assertInertia(fn ($page) => $page
            ->where('orders.data.0.seller_payout', null)
            ->missing('orders.data.0.payment'));
});

test('admins can access payment and payout lists while sellers cannot', function () {
    $admin = User::factory()->admin()->create();
    $seller = User::factory()->seller()->create();

    $this->actingAs($admin)->get(route('admin.payments.index'))
        ->assertOk()->assertInertia(fn ($page) => $page->component('admin/payments/index'));
    $this->actingAs($admin)->get(route('admin.payouts.index'))
        ->assertOk()->assertInertia(fn ($page) => $page->component('admin/payouts/index'));
    $this->actingAs($seller)->get(route('admin.payments.index'))->assertForbidden();
    $this->actingAs($seller)->get(route('admin.payouts.index'))->assertForbidden();
});

test('admin order detail exposes payment and payout records without allowing client edits', function () {
    $admin = User::factory()->admin()->create();
    $seller = User::factory()->seller()->create();
    $order = Order::factory()->for(Shop::factory()->for($seller, 'seller'), 'shop')->delivered()->create();

    $this->actingAs($admin)->post(route('admin.orders.payment', $order), ['transaction_reference' => 'wave-detail']);
    $this->actingAs($admin)->post(route('admin.orders.payout', $order), ['transaction_reference' => 'payout-detail']);

    $this->actingAs($admin)->get(route('admin.orders.show', $order))
        ->assertInertia(fn ($page) => $page
            ->where('order.payment.transaction_reference', 'wave-detail')
            ->where('order.payment.amount', $order->subtotal)
            ->where('order.seller_payout.transaction_reference', 'payout-detail')
            ->where('order.seller_payout.amount', $order->seller_amount)
            ->missing('order.payment.customer_phone'));
});
